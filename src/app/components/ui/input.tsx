import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-lg border-2 border-gray-200 bg-[#F3F4F6] px-4 py-3 text-base text-[#1F2937] font-medium placeholder:text-[#9CA3AF] transition-all duration-300 outline-none",
        "focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#1F2937]",
        "min-h-[44px]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
