"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 rounded-md border-2 border-[#7C3AED] bg-white shadow-sm transition-all duration-200 outline-none min-h-[20px] min-w-[20px]",
        "focus-visible:ring-4 focus-visible:ring-[#7C3AED]/20",
        "data-[state=checked]:bg-[#7C3AED] data-[state=checked]:border-[#7C3AED]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-[#6D28D9] hover:shadow-md",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-white transition-none"
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
