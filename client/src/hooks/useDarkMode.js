import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export function useDarkMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useDarkMode must be used within ThemeProvider");
  return ctx;
}
