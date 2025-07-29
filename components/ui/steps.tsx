import { cn } from "@/lib/utils"

interface StepProps {
  steps: { label: string }[]
  activeStep: number
}

export function Steps({ steps, activeStep }: StepProps) {
  return (
    <div className="relative flex justify-between">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full border",
              activeStep === index
                ? "border-primary bg-primary text-primary-foreground"
                : activeStep > index
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-background text-muted-foreground"
            )}
          >
            {activeStep > index ? "✓" : index + 1}
          </div>
          <div
            className={cn(
              "mt-2 text-xs",
              activeStep === index
                ? "font-medium text-primary"
                : "text-muted-foreground"
            )}
          >
            {step.label}
          </div>
          {index < steps.length - 1 && (
            <div className="absolute inset-x-[calc(50%+1rem)] top-4 h-px bg-border" />
          )}
        </div>
      ))}
    </div>
  )
}