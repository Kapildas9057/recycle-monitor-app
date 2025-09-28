import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ecoButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-eco text-primary-foreground hover:shadow-eco transform hover:scale-105",
        success: "bg-gradient-success text-success-foreground hover:shadow-eco transform hover:scale-105",
        outline: "border border-card-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        card: "bg-gradient-card border border-card-border text-card-foreground hover:shadow-card transform hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 rounded-lg px-4",
        lg: "h-14 rounded-xl px-8",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface EcoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ecoButtonVariants> {
  asChild?: boolean;
}

const EcoButton = React.forwardRef<HTMLButtonElement, EcoButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(ecoButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
EcoButton.displayName = "EcoButton";

export { EcoButton, ecoButtonVariants };