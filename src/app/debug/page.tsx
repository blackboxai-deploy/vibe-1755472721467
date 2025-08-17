"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testFullFlow = async () => {
    setIsProcessing(true)
    setLogs([])
    
    try {
      addLog("🔄 Starting full flow test...")
      
      // Step 1: Test URL fetching
      addLog("📥 Testing URL fetch...")
      const fetchResponse = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" })
      })
      
      addLog(`📥 Fetch response status: ${fetchResponse.status}`)
      
      if (!fetchResponse.ok) {
        throw new Error(`Fetch failed: ${fetchResponse.status}`)
      }
      
      const fetchData = await fetchResponse.json()
      addLog(`📥 Fetch success: ${JSON.stringify(Object.keys(fetchData))}`)
      
      if (!fetchData.success) {
        throw new Error(fetchData.error)
      }
      
      const websiteData = fetchData.data
      const originalContent = websiteData.html + (websiteData.css ? `\n<style>${websiteData.css}</style>` : '')
      
      addLog(`📄 Original content length: ${originalContent.length}`)
      addLog(`📄 Content preview: ${originalContent.substring(0, 100)}...`)
      
      // Step 2: Test AI enhancement
      addLog("🤖 Testing AI enhancement...")
      
      const enhancePayload = {
        originalContent: originalContent,
        url: "https://example.com"
      }
      
      addLog(`🤖 Sending payload with keys: ${Object.keys(enhancePayload).join(', ')}`)
      addLog(`🤖 originalContent length: ${enhancePayload.originalContent.length}`)
      
      const enhanceResponse = await fetch("/api/enhance-website-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enhancePayload)
      })
      
      addLog(`🤖 Enhancement response status: ${enhanceResponse.status}`)
      
      if (!enhanceResponse.ok) {
        const errorText = await enhanceResponse.text()
        addLog(`❌ Enhancement error: ${errorText}`)
        throw new Error(`Enhancement failed: ${enhanceResponse.status} - ${errorText}`)
      }
      
      const enhanceData = await enhanceResponse.json()
      addLog(`🤖 Enhancement success: ${Object.keys(enhanceData).join(', ')}`)
      
      if (enhanceData.enhancedContent) {
        addLog(`✅ Enhanced content length: ${enhanceData.enhancedContent.length}`)
        addLog(`✅ Enhanced preview: ${enhanceData.enhancedContent.substring(0, 100)}...`)
      }
      
      addLog("🎉 Full flow test completed successfully!")
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testFullFlow} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? "🔄 Testing..." : "🚀 Test Full Flow"}
          </Button>
          
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">Click the button above to start testing...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}