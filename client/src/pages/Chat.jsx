import { useEffect, useRef, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { MessageBubble } from "../components/MessageBubble";
import { UploadDropzone } from "../components/UploadDropzone";
import { LanguagePicker } from "../components/LanguagePicker";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  listMessages,
  sendScreenshot,
  sendFollowUp,
  getErrorMessage,
  requiresLanguageSelection,
} from "../services/api";
import { compressImages } from "../utils/compressImage";

const FOLLOW_UPS = [
  { label: "TLE", text: "TLE" },
  { label: "Wrong Answer", text: "Wrong Answer" },
  { label: "Compilation Error", text: "Compilation Error" },
  { label: "Runtime Error", text: "Runtime Error" },
];

// Cosmetic staging only — the backend is a single request/response, not a
// stream, so these labels advance on timers derived from real measured
// latencies (OCR ~1-7s, AI call ~0.3-0.5s) rather than genuine server push.
const OCR_STAGE_DELAY_MS = 800;
const GENERATING_STAGE_DELAY_MS = 3000;

export default function Chat() {
  const { chatId } = useParams();
  const { refreshChats } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const [pendingLanguageFiles, setPendingLanguageFiles] = useState(null);
  const [chatText, setChatText] = useState("");
  const stageTimers = useRef([]);

  useEffect(() => {
    listMessages(chatId)
      .then(setMessages)
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [chatId]);

  useEffect(() => () => stageTimers.current.forEach(clearTimeout), []);

  function startSimulatedStages(hasUpload) {
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];

    if (hasUpload) {
      setStage("Uploading screenshot...");
    } else {
      setStage("Generating solution...");
      return;
    }

    stageTimers.current.push(
      setTimeout(() => setStage("Reading screenshot (OCR)..."), OCR_STAGE_DELAY_MS)
    );
    stageTimers.current.push(
      setTimeout(() => setStage("Generating solution..."), OCR_STAGE_DELAY_MS + GENERATING_STAGE_DELAY_MS)
    );
  }

  function stopStages() {
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];
    setStage(null);
    setUploadProgress(null);
  }

  async function handleFiles(files, language) {
    setBusy(true);
    setLastFailedAction(null);
    setPendingLanguageFiles(null);
    setStage("Preparing screenshots...");
    try {
      // Resized/re-encoded client-side so the upload reliably fits under
      // Vercel's 4.5MB request body cap — real phone-camera photos can be
      // 5-10x that on their own, which otherwise fails with a raw 413 from
      // Vercel's edge before our own code even runs.
      const compressed = await compressImages(files);
      startSimulatedStages(true);
      const message = await sendScreenshot(chatId, compressed, setUploadProgress, language);
      setMessages((prev) => [...prev, message]);
      // The first screenshot's OCR text may have just auto-titled this chat
      // (see messageService.handleScreenshotMessage) — refresh the sidebar
      // list so it shows the new title instead of the "New Chat" placeholder.
      refreshChats();
    } catch (err) {
      if (requiresLanguageSelection(err)) {
        setPendingLanguageFiles(files);
      } else {
        toast.error(getErrorMessage(err));
        setLastFailedAction({ type: "screenshot", files });
      }
    } finally {
      setBusy(false);
      stopStages();
    }
  }

  async function handleFollowUp(text) {
    setBusy(true);
    setLastFailedAction(null);
    startSimulatedStages(false);
    try {
      const message = await sendFollowUp(chatId, text);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLastFailedAction({ type: "followup", text });
    } finally {
      setBusy(false);
      stopStages();
    }
  }

  function handleRetry() {
    if (!lastFailedAction) return;
    if (lastFailedAction.type === "screenshot") handleFiles(lastFailedAction.files);
    else handleFollowUp(lastFailedAction.text);
  }

  function handleLanguageSelected(language) {
    if (!pendingLanguageFiles) return;
    handleFiles(pendingLanguageFiles, language);
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    const text = chatText.trim();
    if (!text || busy) return;
    setChatText("");
    handleFollowUp(text);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
      {messages.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          Upload one or more screenshots below to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      )}

      {pendingLanguageFiles ? (
        <LanguagePicker onSelect={handleLanguageSelected} disabled={busy} />
      ) : (
        <UploadDropzone onFiles={handleFiles} disabled={busy} />
      )}

      {busy && stage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>
            {stage}
            {uploadProgress !== null && uploadProgress < 100 ? ` ${uploadProgress}%` : ""}
          </span>
        </div>
      )}

      {!busy && lastFailedAction && (
        <Button variant="outline" onClick={handleRetry} className="w-fit">
          Retry
        </Button>
      )}

      {messages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FOLLOW_UPS.map((item) => (
            <Button key={item.text} variant="outline" disabled={busy} onClick={() => handleFollowUp(item.text)}>
              {item.label}
            </Button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <Input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            disabled={busy}
            placeholder="Ask for a change, e.g. &quot;make it iterative&quot; or &quot;handle negative numbers&quot;"
            className="flex-1"
          />
          <Button type="submit" disabled={busy || !chatText.trim()}>
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
