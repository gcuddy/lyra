import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

export interface ShortcutProps extends ComponentProps<"div"> {
  chars: string;
}

export const Shortcut = (props: ShortcutProps) => {
  const { className, chars, ...rest } = props;

  return (
    <kbd
      className={cn(
        `border px-1`,
        `font-ink-dull rounded-md text-xs font-medium`,
        `border-app-line dark:border-transparent`,
        className
      )}
      {...rest}
    >
      {chars}
    </kbd>
  );
};
