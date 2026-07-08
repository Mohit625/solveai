import { createContext, useEffect, useState } from "react";

const STORAGE_KEY = "solveai-theme";

// Mirrors the inline script in index.html (which sets the class before React
// mounts, avoiding a flash of the wrong theme) — same storage key, same
// fallback to the OS preference when the user hasn't chosen explicitly.
function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = {
    theme,
    isDark: theme === "dark",
    toggle: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
