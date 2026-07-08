import { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

const MAX_SCREENSHOTS = 5;

export function UploadDropzone({ onFiles, disabled }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxFiles: MAX_SCREENSHOTS,
  });

  useEffect(() => {
    function handlePaste(event) {
      if (disabled) return;
      const items = Array.from(event.clipboardData?.items || []).filter((item) =>
        item.type.startsWith("image/")
      );
      const files = items.map((item) => item.getAsFile()).filter(Boolean);
      if (files.length > 0) onFiles(files.slice(0, MAX_SCREENSHOTS));
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFiles, disabled]);

  return (
    <div
      {...getRootProps()}
      className={`flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground ${
        isDragActive ? "border-primary" : "border-border"
      }`}
    >
      <input {...getInputProps()} />
      <p>Drop up to {MAX_SCREENSHOTS} screenshots, click to browse, or paste (Ctrl+V)</p>
    </div>
  );
}
