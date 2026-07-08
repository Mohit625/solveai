import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { Button } from "./ui/button";
import { useDarkMode } from "../hooks/useDarkMode";

const MONACO_LANGUAGE_MAP = {
  c: "c",
  cpp: "cpp",
  python: "python",
  sql: "sql",
};

const FILE_EXTENSIONS = {
  c: "c",
  cpp: "cpp",
  python: "py",
  sql: "sql",
};

async function handleCopy(code) {
  try {
    await navigator.clipboard.writeText(code || "");
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

function handleDownload(code, language) {
  const extension = FILE_EXTENSIONS[language] || "txt";
  const blob = new Blob([code || ""], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `solution.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CodeViewer({ code, language }) {
  const { isDark } = useDarkMode();

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="text-xs uppercase text-muted-foreground">{language || "plaintext"}</span>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleCopy(code)}>
            Copy
          </Button>
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleDownload(code, language)}>
            Download
          </Button>
        </div>
      </div>
      <Editor
        height="420px"
        theme={isDark ? "vs-dark" : "light"}
        language={MONACO_LANGUAGE_MAP[language] || "plaintext"}
        value={code || ""}
        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
      />
    </div>
  );
}
