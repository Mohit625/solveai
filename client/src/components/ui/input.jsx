import { cn } from "../../utils/cn";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  );
}
