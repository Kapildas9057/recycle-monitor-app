import * as React from "react";

import { cn } from "@/lib/utils";

// Safe no-op Tooltip components to avoid runtime errors from Radix Tooltip
// These components render children without attaching any tooltip behavior.
const TooltipProvider: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;

const Tooltip: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;

const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn(className)} {...props} />
  ),
);
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    // Hidden by default; acts as a placeholder to keep API compatibility
    <div ref={ref} className={cn("hidden", className)} {...props} />
  ),
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
