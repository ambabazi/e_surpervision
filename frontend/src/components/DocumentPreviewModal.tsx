import { useEffect, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import {
  downloadAuthenticatedFile,
  fetchAuthenticatedFileBlob,
  isDocxDocument,
  isPdfDocument,
  openDocumentInNewTab,
  wordBlobToHtml,
} from "@/lib/files";

export function DocumentPreviewModal({
  fileUrl,
  fileName,
  title,
  onClose,
}: {
  fileUrl: string;
  fileName?: string;
  title: string;
  onClose: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [contentType, setContentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    (async () => {
      setLoading(true);
      setError("");
      setWordHtml(null);
      setPreviewUrl(null);
      try {
        const { blob, contentType: type } = await fetchAuthenticatedFileBlob(fileUrl);
        if (!active) return;
        setContentType(type);

        if (isPdfDocument(type, fileUrl)) {
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        } else if (isDocxDocument(type, fileUrl)) {
          const html = await wordBlobToHtml(blob);
          if (!active) return;
          setWordHtml(html);
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load this document from the server.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl]);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadAuthenticatedFile(fileUrl, fileName || title);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const openInTab = async () => {
    setOpening(true);
    setError("");
    try {
      await openDocumentInNewTab(fileUrl, { fileName, title });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not open document.");
    } finally {
      setOpening(false);
    }
  };

  const canOpen = isPdfDocument(contentType, fileUrl) || isDocxDocument(contentType, fileUrl) || wordHtml || previewUrl;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-soft">
        <div className="flex items-start justify-between border-b border-slate-100 p-4">
          <div className="min-w-0 pr-4">
            <h3 className="truncate text-lg font-bold text-slate-800">{title}</h3>
            <p className="truncate text-sm text-slate-500">{fileName || "Student submission"}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {canOpen && (
              <button type="button" className="btn-primary !py-1.5 text-xs" onClick={openInTab} disabled={opening || loading}>
                <ExternalLink size={14} />
                {opening ? "Opening..." : "Open"}
              </button>
            )}
            <button type="button" className="btn-outline !py-1.5 text-xs" onClick={download} disabled={downloading}>
              <Download size={14} />
              {downloading ? "Saving..." : "Download"}
            </button>
            <button type="button" className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-[320px] flex-1 overflow-hidden bg-slate-50 p-4">
          {loading && <p className="text-sm text-slate-500">Loading student document from server...</p>}
          {error && (
            <div className="rounded-xl border border-crimson-200 bg-crimson-50 p-4 text-sm text-crimson-700">
              {error}
            </div>
          )}
          {!loading && !error && previewUrl && (
            <iframe title={title} src={previewUrl} className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white" />
          )}
          {!loading && !error && wordHtml && (
            <div
              className="prose prose-slate h-[70vh] max-w-none overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-sm"
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />
          )}
          {!loading && !error && !previewUrl && !wordHtml && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Document loaded</p>
              <p className="mt-2">Use <strong>Open</strong> to view in a new browser tab, or <strong>Download</strong> to save the file.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
