import * as React from "react";

// Minimal, dependency-free shim for @radix-ui/react-tooltip
// Prevents runtime errors if any component imports Radix Tooltip primitives
// by exporting safe no-op components that keep the API surface.

export const Provider: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;

export const Root: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;

export const Trigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={className} {...props} />
  ),
);
Trigger.displayName = "TooltipTrigger";

export const Content = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, style, ...props }, ref) => (
    // Hidden by default; placeholder to preserve structure
    <div ref={ref} className={["hidden", className].filter(Boolean).join(" ")} style={style} {...props} />
  ),
);
Content.displayName = "TooltipContent";

// Backwards-compatible named exports expected by consumers
export { Provider as TooltipProvider, Root as Tooltip, Trigger as TooltipTrigger, Content as TooltipContent };
