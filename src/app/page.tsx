"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type UploadResult = {
  fileName: string;
  id: string;
  shareUrl: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isHtmlFile(file: File) {
  return file.name.toLowerCase().endsWith(".html");
}

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeFileSize, setActiveFileSize] = useState<number | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  async function uploadFile(file: File | null) {
    if (!file || isUploading) {
      return;
    }

    setError(null);
    setCopyState("idle");
    setUploadResult(null);

    if (!isHtmlFile(file)) {
      setActiveFileName(null);
      setActiveFileSize(null);
      setError("Only .html files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setActiveFileName(file.name);
      setActiveFileSize(file.size);
      setError("File size must be 5MB or smaller.");
      return;
    }

    setActiveFileName(file.name);
    setActiveFileSize(file.size);

    try {
      await file.text();
    } catch {
      setError("The selected file could not be read.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    setIsUploading(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload: unknown = await response.json().catch(() => null);
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Upload failed. Please try again.";

      if (!response.ok) {
        throw new Error(message);
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !("id" in payload) ||
        typeof payload.id !== "string" ||
        !("url" in payload) ||
        typeof payload.url !== "string"
      ) {
        throw new Error("Unexpected response from the server.");
      }

      setUploadResult({
        fileName: file.name,
        id: payload.id,
        shareUrl: new URL(payload.url, window.location.origin).toString(),
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void uploadFile(event.target.files?.item(0) ?? null);
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (!isUploading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void uploadFile(event.dataTransfer.files.item(0));
  }

  async function handleCopy() {
    if (!uploadResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(uploadResult.shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#eef2ff_45%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-700">
              materi-html-hoster
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Host a single HTML file and share it with a short live URL.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Drop a <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-900">.html</code>{" "}
              file, let the app store its raw markup in object storage, then open it again
              through a six-character route.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
                  Input
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Strictly <span className="font-semibold text-slate-950">.html</span>{" "}
                  uploads only.
                </p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-700">
                  Storage
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Stored in <span className="font-mono text-slate-950">Cloudflare R2</span>.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Limit
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Maximum file size: <span className="font-semibold text-slate-950">5MB</span>.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  Upload Zone
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Drag and drop, or click to choose your file.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                HTML only
              </div>
            </div>

            <label
              className={`mt-6 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed px-6 py-10 text-center transition ${
                isDragging
                  ? "border-cyan-300 bg-cyan-400/10"
                  : "border-white/15 bg-white/5 hover:border-cyan-400/60 hover:bg-white/8"
              } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                accept=".html,text/html"
                className="sr-only"
                disabled={isUploading}
                onChange={handleFileChange}
                type="file"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                {isUploading ? (
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-200/40 border-t-cyan-200" />
                ) : (
                  <span>+</span>
                )}
              </div>
              <p className="mt-6 text-xl font-semibold text-white">
                {isUploading ? "Uploading your file..." : "Drop your .html file here"}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                {isUploading
                  ? "The upload will finish automatically and a shareable link will appear below."
                  : "The file is sent straight to the local upload route and mapped to a new short URL."}
              </p>
              <span className="mt-6 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950">
                {isUploading ? "Please wait" : "Choose file"}
              </span>
            </label>

            <div className="mt-5 space-y-4">
              {activeFileName ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <p className="font-medium text-white">Current file</p>
                  <p className="mt-2 break-all font-mono text-xs text-cyan-200">
                    {activeFileName}
                  </p>
                  {activeFileSize !== null ? (
                    <p className="mt-2 text-xs text-slate-400">
                      {formatFileSize(activeFileSize)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              {uploadResult ? (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                  <p className="text-sm font-medium text-emerald-100">
                    Upload complete for {uploadResult.fileName}
                  </p>
                  <a
                    className="mt-3 block break-all font-mono text-sm text-white underline decoration-emerald-300/60 underline-offset-4"
                    href={uploadResult.shareUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {uploadResult.shareUrl}
                  </a>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-emerald-100/80">
                    ID {uploadResult.id}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-100"
                      onClick={handleCopy}
                      type="button"
                    >
                      {copyState === "copied"
                        ? "Copied"
                        : copyState === "error"
                          ? "Copy failed"
                          : "Copy to Clipboard"}
                    </button>
                    <a
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      href={uploadResult.shareUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open link
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
