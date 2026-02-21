import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-[#7C3AED]/30 min-h-[44px] hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white hover:from-[#6D28D9] hover:to-[#7C3AED] shadow-md hover:shadow-lg",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg",
        outline:
          "border-2 border-gray-200 bg-white text-[#1F2937] hover:border-gray-300 hover:bg-gray-50 shadow-sm",
        secondary:
          "bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:from-[#059669] hover:to-[#047857] shadow-md hover:shadow-lg",
        ghost:
          "hover:bg-gray-100 text-[#1F2937]",
        link: "text-[#7C3AED] underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-4",
        sm: "px-4 py-2 text-sm min-h-[36px]",
        lg: "px-8 py-5 text-lg min-h-[52px]",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
