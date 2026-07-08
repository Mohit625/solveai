import { useState } from "react";
import { CodeViewer } from "./CodeViewer";
import { Button } from "./ui/button";

export function MessageBubble({ message }) {
  const [showFullOcr, setShowFullOcr] = useState(false);
  const imageUrls = message.image_urls?.length ? message.image_urls : message.image_url ? [message.image_url] : [];

  return (
    <div className="space-y-2 rounded-md border border-border p-4">
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`Uploaded screenshot ${index + 1}`}
              className="max-h-48 rounded-md border border-border"
            />
          ))}
        </div>
      )}
      {message.ocr_text && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">OCR text</span>
            <Button
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => setShowFullOcr((prev) => !prev)}
            >
              {showFullOcr ? "Collapse" : "Show full text"}
            </Button>
          </div>
          <p
            className={`whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs text-muted-foreground ${
              showFullOcr ? "" : "line-clamp-3"
            }`}
          >
            {message.ocr_text}
          </p>
        </div>
      )}
      {message.generated_code && (
        <CodeViewer code={message.generated_code} language={message.language} />
      )}
    </div>
  );
}
