import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-muted-foreground px-2.5 pt-0.5 pb-0.25 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: string;
}

function Badge({ className, variant, status, ...props }: BadgeProps) {
  let computedVariant = variant;
  if (!variant && status) {
    if (status === "completed" || status === "done" || status === "DONE") {
      computedVariant = "default";
    } else if (status === "failed" || status === "FAILED") {
      computedVariant = "destructive";
    } else {
      computedVariant = "outline";
    }
  }
  return (
    <div className={cn(badgeVariants({ variant: computedVariant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
