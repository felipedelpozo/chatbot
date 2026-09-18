"use client";

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      // Keep the SSR initializer executable while making client remounts inert.
      // React 19.2 otherwise warns when next-themes renders its script again.
      scriptProps={
        typeof window === "undefined"
          ? undefined
          : { type: "application/json" }
      }
    >
      {children}
    </NextThemesProvider>
  );
}
