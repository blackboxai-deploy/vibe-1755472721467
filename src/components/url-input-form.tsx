"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Globe, Sparkles, Download, Eye } from "lucide-react"

interface UrlInputFormProps {
  onEnhancementComplete?: (enhancedHtml: string) => void
}

export function UrlInputForm({ onEnhancementComplete }: UrlInputFormProps) {
  const [url, setUrl] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(`You are an expert web designer and developer. Analyze the provided website content and create an enhanced version with the following improvements:

1. Modern, clean design with better typography and spacing
2. Responsive layout that works on all devices
3. Improved color scheme and visual hierarchy
4. Better accessibility features
5. Enhanced user experience and navigation
6. Optimized CSS with modern techniques
7. Professional styling and animations

Return only a complete HTML file with embedded CSS. Make it visually appealing and professional.`)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState("")
  const [enhancedHtml, setEnhancedHtml] = useState("")

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL")
      return
    }

    setError("")
    setIsProcessing(true)
    setProgress(0)
    setEnhancedHtml("")

    try {
      // Step 1: Fetch website content
      setCurrentStep("Fetching website content...")
      setProgress(25)
      
      const fetchResponse = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      })

      if (!fetchResponse.ok) {
        throw new Error("Failed to fetch website content")
      }

      const fetchData = await fetchResponse.json()
      
      if (!fetchData.success) {
        throw new Error(fetchData.error || "Failed to fetch website content")
      }

      const websiteData = fetchData.data
      const originalContent = `${websiteData.html}\n<style>${websiteData.css}</style>`

      // Step 2: Enhance with AI
      setCurrentStep("Enhancing website with AI...")
      setProgress(50)

      console.log("Sending to enhance API:", { originalContent: originalContent.substring(0, 100) + "...", url })

      const enhanceResponse = await fetch("/api/enhance-website-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          originalContent: originalContent,
          url: url
        })
      })

      console.log("Enhance API response status:", enhanceResponse.status)
      
      if (!enhanceResponse.ok) {
        const errorText = await enhanceResponse.text()
        console.error("Enhance API error:", errorText)
        throw new Error(`Failed to enhance website: ${enhanceResponse.status} - ${errorText}`)
      }

      const enhanceData = await enhanceResponse.json()
      const enhanced = enhanceData.enhancedContent
      
      if (!enhanced) {
        throw new Error("No enhanced content received from AI")
      }

      // Step 3: Complete
      setCurrentStep("Enhancement complete!")
      setProgress(100)
      setEnhancedHtml(enhanced)
      onEnhancementComplete?.(enhanced)

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
      setCurrentStep("")
    }
  }

  const handleDownload = () => {
    if (!enhancedHtml) return

    const blob = new Blob([enhancedHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "enhanced-website.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Website Enhancement Tool
          </CardTitle>
          <CardDescription>
            Enter a website URL to generate an enhanced version using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    disabled={isProcessing}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isProcessing || !url.trim()}
                  className="min-w-[120px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enhance
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">AI System Prompt (Customizable)</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Customize how the AI should enhance the website..."
                className="min-h-[120px]"
                disabled={isProcessing}
              />
            </div>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {enhancedHtml && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Enhancement Complete!</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download HTML
                  </Button>
                </div>
              </div>
              
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  Your enhanced website is ready! You can preview it below and download the HTML file.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}