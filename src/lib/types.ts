export interface WebsiteContent {
  url: string;
  title: string;
  html: string;
  css: string;
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
}

export interface EnhancementRequest {
  originalContent: WebsiteContent;
  systemPrompt?: string;
  enhancementType: 'modern' | 'minimal' | 'professional' | 'creative' | 'custom';
  preserveContent: boolean;
  targetDevices: ('desktop' | 'tablet' | 'mobile')[];
}

export interface EnhancedWebsite {
  originalUrl: string;
  enhancedHtml: string;
  enhancedCss: string;
  improvements: string[];
  aiModel: string;
  processingTime: number;
  timestamp: string;
}

export interface ProcessingStatus {
  stage: 'fetching' | 'analyzing' | 'enhancing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FetchUrlResponse {
  content: WebsiteContent;
  processingTime: number;
}

export interface EnhanceWebsiteResponse {
  enhanced: EnhancedWebsite;
  downloadUrl: string;
}

export interface AIConfig {
  model: string;
  endpoint: string;
  customerId: string;
  maxTokens: number;
  temperature: number;
}

export interface SystemPromptConfig {
  default: string;
  custom?: string;
  variables: {
    originalUrl: string;
    contentType: string;
    enhancementGoals: string[];
  };
}

export interface FileGenerationOptions {
  includeInlineCSS: boolean;
  minifyOutput: boolean;
  addMetaTags: boolean;
  optimizeImages: boolean;
}

export interface DownloadableFile {
  filename: string;
  content: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface URLValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  normalizedUrl?: string;
}