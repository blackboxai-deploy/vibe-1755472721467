import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the website content with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $('title').text() || $('h1').first().text() || 'Untitled';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().substring(0, 160) || '';

    // Extract and inline CSS
    let inlineStyles = '';
    $('style').each((_, element) => {
      inlineStyles += $(element).html() + '\n';
    });

    // Extract external CSS links
    const externalCssUrls: string[] = [];
    $('link[rel="stylesheet"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const cssUrl = new URL(href, validUrl.toString()).toString();
        externalCssUrls.push(cssUrl);
      }
    });

    // Fetch external CSS
    let externalCss = '';
    for (const cssUrl of externalCssUrls.slice(0, 5)) { // Limit to 5 CSS files
      try {
        const cssController = new AbortController();
        const cssTimeoutId = setTimeout(() => cssController.abort(), 5000);

        const cssResponse = await fetch(cssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: cssController.signal,
        });

        clearTimeout(cssTimeoutId);

        if (cssResponse.ok) {
          externalCss += await cssResponse.text() + '\n';
        }
      } catch (error) {
        console.warn(`Failed to fetch CSS from ${cssUrl}:`, error);
      }
    }

    // Clean up HTML - remove scripts and unnecessary elements
    $('script').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('embed').remove();
    $('object').remove();
    $('link[rel="stylesheet"]').remove();
    $('style').remove();

    // Convert relative URLs to absolute
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        $(element).attr('src', new URL(src, validUrl.toString()).toString());
      }
    });

    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        $(element).attr('href', new URL(href, validUrl.toString()).toString());
      }
    });

    // Extract main content
    const bodyContent = $('body').html() || '';
    const headContent = $('head').html() || '';

    // Combine all CSS
    const allCss = inlineStyles + '\n' + externalCss;

    return NextResponse.json({
      success: true,
      data: {
        url: validUrl.toString(),
        title,
        description,
        html: bodyContent,
        css: allCss,
        headContent,
        originalHtml: html,
        metadata: {
          title,
          description,
          favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href'),
          ogImage: $('meta[property="og:image"]').attr('content'),
          charset: $('meta[charset]').attr('charset') || 'utf-8',
        }
      }
    });

  } catch (error) {
    console.error('Error fetching URL:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error: Unable to reach the website. The site may be blocking requests or may be down.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch website content. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to fetch URL content.' },
    { status: 405 }
  );
}