import * as React from "react"

import { cn } from "@/lib/utils"

// Card remains a div by default
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg bg-card text-card-foreground",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

// CardHeader remains a div by default
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// --- MODIFIED CardTitle COMPONENT ---
// 1. Define the props type for CardTitle to include an 'as' prop
interface CardTitleProps extends React.HTMLAttributes<HTMLElement> { // Extend HTMLElement for general attributes
  as?: React.ElementType; // New prop to specify the HTML element type
}

const CardTitle = React.forwardRef<
  HTMLElement, // Change ref type to HTMLElement to be generic
  CardTitleProps // Use the new interface for props
>(({ className, as: Component = "div", ...props }, ref) => ( // Destructure 'as' and provide 'div' as default
  <Component // Render the dynamic component
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"
// --- END MODIFIED CardTitle COMPONENT ---

// CardDescription remains a div by default
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// CardContent remains a div by default
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

// CardFooter remains a div by default
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }