import * as React from "react";

import { cn } from "@/lib/utils";
import { tv } from "tailwind-variants";

export const inputSizes = {
  xs: "h-[25px]",
  sm: "h-[30px]",
  md: "h-[34px]",
  lg: "h-[38px]",
};

export const inputStyles = tv({
  base: "rounded-md border text-sm leading-4 shadow-sm outline-none transition-all focus-within:ring-2 text-ink",
  variants: {
    variant: {
      default: [
        "border-app-line bg-app-input placeholder-ink-faint focus-within:bg-app-focus",
        "focus-within:border-app-divider/80 focus-within:ring-app-selected/30",
      ],
      transparent: [
        "border-transparent bg-transparent placeholder-ink-dull focus-within:bg-transparent",
        "focus-within:border-transparent focus-within:ring-transparent",
      ],
    },
    size: inputSizes,
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
  },
});

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputStyles(),

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
