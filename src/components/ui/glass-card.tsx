import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "glow";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-card-glass backdrop-blur-sm border-card-border hover:bg-card-glass/90 transition-all duration-300",
      hover: "bg-card-glass backdrop-blur-sm border-card-border hover:bg-card-glass/90 hover:shadow-glow-soft hover:scale-[1.02] transition-all duration-500",
      glow: "bg-card-glass backdrop-blur-sm border-card-border shadow-glow-soft hover:shadow-glow-strong transition-all duration-500"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border p-6",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };