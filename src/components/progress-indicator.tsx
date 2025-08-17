"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Circle, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProcessingStep {
  id: string
  label: string
  description: string
  status: "pending" | "processing" | "completed" | "error"
  progress?: number
}

interface ProgressIndicatorProps {
  steps: ProcessingStep[]
  currentStep?: string
  className?: string
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    steps.forEach((step) => {
      if (step.progress !== undefined) {
        const targetProgress = step.progress
        const currentProgress = animatedProgress[step.id] || 0
        
        if (targetProgress !== currentProgress) {
          const increment = targetProgress > currentProgress ? 2 : -2
          const timer = setInterval(() => {
            setAnimatedProgress((prev) => {
              const newProgress = prev[step.id] || 0
              const nextProgress = Math.min(Math.max(newProgress + increment, 0), targetProgress)
              
              if (nextProgress === targetProgress) {
                clearInterval(timer)
              }
              
              return { ...prev, [step.id]: nextProgress }
            })
          }, 50)
          
          return () => clearInterval(timer)
        }
      }
    })
  }, [steps, animatedProgress])

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStepStatus = (step: ProcessingStep) => {
    switch (step.status) {
      case "completed":
        return "text-green-700 bg-green-50 border-green-200"
      case "processing":
        return "text-blue-700 bg-blue-50 border-blue-200"
      case "error":
        return "text-red-700 bg-red-50 border-red-200"
      default:
        return "text-gray-500 bg-gray-50 border-gray-200"
    }
  }

  const overallProgress = steps.length > 0 
    ? (steps.filter(s => s.status === "completed").length / steps.length) * 100 
    : 0

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Step-by-step Progress */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "relative p-4 rounded-lg border transition-all duration-300",
                  getStepStatus(step),
                  currentStep === step.id && "ring-2 ring-blue-500 ring-opacity-50"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{step.label}</h4>
                      <span className="text-xs text-muted-foreground">
                        Step {index + 1} of {steps.length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    
                    {/* Individual step progress */}
                    {step.progress !== undefined && step.status === "processing" && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Processing...</span>
                          <span>{Math.round(animatedProgress[step.id] || 0)}%</span>
                        </div>
                        <Progress 
                          value={animatedProgress[step.id] || 0} 
                          className="h-1.5" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection line to next step */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-4 bg-gray-200" />
                )}
              </div>
            ))}
          </div>

          {/* Status Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>
              {steps.filter(s => s.status === "completed").length} completed, {" "}
              {steps.filter(s => s.status === "processing").length} in progress, {" "}
              {steps.filter(s => s.status === "error").length} failed
            </span>
            <span>
              {steps.filter(s => s.status === "pending").length} remaining
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function useProgressSteps() {
  const [steps, setSteps] = useState<ProcessingStep[]>([])
  const [currentStep, setCurrentStep] = useState<string>("")

  const initializeSteps = (initialSteps: Omit<ProcessingStep, "status">[]) => {
    setSteps(initialSteps.map(step => ({ ...step, status: "pending" as const })))
    setCurrentStep("")
  }

  const updateStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const startStep = (stepId: string) => {
    setCurrentStep(stepId)
    updateStep(stepId, { status: "processing", progress: 0 })
  }

  const updateStepProgress = (stepId: string, progress: number) => {
    updateStep(stepId, { progress: Math.min(Math.max(progress, 0), 100) })
  }

  const completeStep = (stepId: string) => {
    updateStep(stepId, { status: "completed", progress: 100 })
  }

  const errorStep = (stepId: string, error?: string) => {
    updateStep(stepId, { 
      status: "error", 
      description: error || steps.find(s => s.id === stepId)?.description || ""
    })
  }

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ 
      ...step, 
      status: "pending" as const, 
      progress: undefined 
    })))
    setCurrentStep("")
  }

  return {
    steps,
    currentStep,
    initializeSteps,
    updateStep,
    startStep,
    updateStepProgress,
    completeStep,
    errorStep,
    resetSteps
  }
}