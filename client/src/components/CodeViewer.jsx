import { useState } from "react";
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

// Monaco's own height defaults to filling a fixed-size container (scrolling
// internally past that), not growing to fit its content — the opposite of
// what a read-only "show the whole solution" viewer needs. Track content
// height in state and feed it back as the Editor's height so the container
// always grows/shrinks to exactly fit the code, both on mount and whenever
// the code changes (e.g. a follow-up edit produces a shorter/longer answer).
function useAutoHeight() {
  const [height, setHeight] = useState(100);

  function handleMount(editor) {
    const update = () => setHeight(editor.getContentHeight());
    update();
    editor.onDidContentSizeChange(update);
  }

  return { height, handleMount };
}

export function CodeViewer({ code, language }) {
  const { isDark } = useDarkMode();
  const { height, handleMount } = useAutoHeight();

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
        height={`${height}px`}
        theme={isDark ? "vs-dark" : "light"}
        language={MONACO_LANGUAGE_MAP[language] || "plaintext"}
        value={code || ""}
        onMount={handleMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "off",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          scrollbar: { vertical: "hidden", horizontal: "hidden" },
          overviewRulerLanes: 0,
          // Not on by default — without it, rotating a phone or resizing the
          // window leaves the word-wrap point (and therefore the computed
          // content height) stale until something else forces a relayout.
          automaticLayout: true,
        }}
      />
    </div>
  );
}
