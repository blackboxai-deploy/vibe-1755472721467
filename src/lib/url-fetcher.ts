import * as cheerio from 'cheerio';

export interface WebsiteContent {
  url: string;
  title: string;
  html: string;
  css: string;
  text: string;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
    viewport?: string;
    charset?: string;
  };
  images: string[];
  links: string[];
  scripts: string[];
  error?: string;
}

export interface FetchOptions {
  timeout?: number;
  userAgent?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
}

export class URLFetcher {
  private defaultOptions: FetchOptions = {
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    followRedirects: true,
    maxRedirects: 5
  };

  async fetchWebsiteContent(url: string, options?: FetchOptions): Promise<WebsiteContent> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Validate URL
      const validatedUrl = this.validateAndNormalizeUrl(url);
      
      // Fetch the webpage
      const response = await this.fetchWithTimeout(validatedUrl, opts);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse content using Cheerio
      const $ = cheerio.load(html);
      
      // Extract content
      const content = this.extractContent($, validatedUrl, html);
      
      return content;
    } catch (error) {
      return {
        url,
        title: '',
        html: '',
        css: '',
        text: '',
        metadata: {},
        images: [],
        links: [],
        scripts: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateAndNormalizeUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      
      // Basic security checks
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS protocols are supported');
      }
      
      // Block localhost and private IPs for security
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        throw new Error('Local and private network URLs are not allowed');
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchWithTimeout(url: string, options: FetchOptions): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': options.userAgent || this.defaultOptions.userAgent!,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: options.followRedirects ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${options.timeout}ms`);
      }
      throw error;
    }
  }

  private extractContent($: any, url: string, html: string): WebsiteContent {
    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';

    // Extract metadata
    const metadata = {
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      author: $('meta[name="author"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      charset: $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content')
    };

    // Extract CSS
    let css = '';
    $('style').each((_: any, element: any) => {
      css += $(element).html() + '\n';
    });

    // Extract external CSS links
    const cssLinks: string[] = [];
    $('link[rel="stylesheet"]').each((_: any, element: any) => {
      const href = $(element).attr('href');
      if (href) {
        cssLinks.push(this.resolveUrl(href, url));
      }
    });

    // Extract text content (remove scripts and styles)
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    // Extract images
    const images: string[] = [];
    $('img').each((_: any, element: any) => {
      const src = $(element).attr('src');
      if (src) {
        images.push(this.resolveUrl(src, url));
      }
    });

    // Extract links
    const links: string[] = [];
    $('a[href]').each((_: any, element: any) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        links.push(this.resolveUrl(href, url));
      }
    });

    // Extract scripts
    const scripts: string[] = [];
    $('script[src]').each((_: any, element: any) => {
      const src = $(element).attr('src');
      if (src) {
        scripts.push(this.resolveUrl(src, url));
      }
    });

    // Clean HTML (remove scripts for security)
    $('script').remove();
    const cleanHtml = $.html();

    return {
      url,
      title,
      html: cleanHtml,
      css,
      text,
      metadata,
      images,
      links,
      scripts
    };
  }

  private resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString();
    } catch {
      return relativeUrl;
    }
  }

  async fetchMultipleUrls(urls: string[], options?: FetchOptions): Promise<WebsiteContent[]> {
    const promises = urls.map(url => this.fetchWebsiteContent(url, options));
    return Promise.all(promises);
  }

  async fetchWithRetry(url: string, maxRetries: number = 3, options?: FetchOptions): Promise<WebsiteContent> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.fetchWebsiteContent(url, options);
        if (!result.error) {
          return result;
        }
        lastError = new Error(result.error);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
}

export const urlFetcher = new URLFetcher();