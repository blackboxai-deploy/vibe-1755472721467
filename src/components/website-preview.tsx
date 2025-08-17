"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  ExternalLink, 
  Code, 
  Eye, 
  Smartphone, 
  Tablet, 
  Monitor,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface WebsitePreviewProps {
  originalUrl: string;
  enhancedHtml: string;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    enhancementType?: string;
    processingTime?: number;
  };
  onDownload?: () => void;
  onRegenerate?: () => void;
}

type ViewportSize = "mobile" | "tablet" | "desktop";

export function WebsitePreview({ 
  originalUrl, 
  enhancedHtml, 
  metadata,
  onDownload,
  onRegenerate 
}: WebsitePreviewProps) {
  const [viewportSize, setViewportSize] = useState<ViewportSize>("desktop");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const viewportDimensions = {
    mobile: { width: "375px", height: "667px" },
    tablet: { width: "768px", height: "1024px" },
    desktop: { width: "100%", height: "600px" }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const iframe = iframeRef.current;
      iframe.onload = () => setIsLoading(false);
      iframe.src = iframe.src;
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(enhancedHtml);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([enhancedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enhanced-${new URL(originalUrl).hostname}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File downloaded successfully!");
    onDownload?.();
  };

  useEffect(() => {
    if (iframeRef.current && enhancedHtml) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(enhancedHtml);
        doc.close();
      }
    }
  }, [enhancedHtml]);

  return (
    <div className="space-y-6">
      {/* Header with metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Enhanced Website Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Original: <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{originalUrl}</a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {metadata?.enhancementType && (
                <Badge variant="secondary">{metadata.enhancementType}</Badge>
              )}
              {metadata?.processingTime && (
                <Badge variant="outline">{metadata.processingTime}s</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {metadata && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {metadata.title && (
                <div>
                  <span className="font-medium">Title:</span>
                  <p className="text-muted-foreground">{metadata.title}</p>
                </div>
              )}
              {metadata.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground">{metadata.description}</p>
                </div>
              )}
              {metadata.keywords && metadata.keywords.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-medium">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Preview Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewportSize === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewportSize("mobile")}
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </Button>
              <Button
                variant={viewportSize === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewportSize("tablet")}
              >
                <Tablet className="h-4 w-4" />
                Tablet
              </Button>
              <Button
                variant={viewportSize === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewportSize("desktop")}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Code
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              {onRegenerate && (
                <Button variant="outline" size="sm" onClick={onRegenerate}>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Preview Tabs */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="h-4 w-4 mr-2" />
            Source Code
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <div 
                  className="border rounded-lg overflow-hidden shadow-lg transition-all duration-300"
                  style={{
                    width: viewportDimensions[viewportSize].width,
                    height: viewportDimensions[viewportSize].height,
                    maxWidth: "100%"
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    title="Enhanced Website Preview"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Enhanced HTML Source</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border">
                <pre className="p-4 text-sm">
                  <code className="language-html">{enhancedHtml}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Enhanced HTML
        </Button>
        <Button variant="outline" asChild>
          <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            View Original
          </a>
        </Button>
      </div>
    </div>
  );
}