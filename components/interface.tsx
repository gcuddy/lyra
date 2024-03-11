import { useTheme } from "@/hooks/useTheme"
import { Suspense } from "react";

// Component that holds the interface for Lyra
export function Interface() {
  useTheme();

  return (
    <Suspense>
      <div>
      </div>
    </Suspense>
  )
}
