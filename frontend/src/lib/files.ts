import mammoth from "mammoth";
import { api } from "./api";

const ALLOWED = [".pdf"] as const;

const MIME_TYPES = new Set(["application/pdf"]);

export function validateSubmissionFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED.includes(ext as (typeof ALLOWED)[number])) {
    return "Only PDF documents (.pdf) are allowed.";
  }
  if (file.type && !MIME_TYPES.has(file.type)) {
    return "Invalid file type. Please upload a PDF document.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "File is too large. Maximum size is 10 MB.";
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function apiFilePath(fileUrl: string): string {
  const path = fileUrl.replace(/^\/api/, "");
  return path.startsWith("/") ? path : `/${path}`;
}

async function readBlobError(blob: Blob): Promise<string> {
  try {
    const text = await blob.text();
    const data = JSON.parse(text) as { message?: string; detail?: string };
    return data.message || data.detail || "Could not load document from server.";
  } catch {
    return "Could not load document from server.";
  }
}

export async function fetchAuthenticatedFileBlob(
  fileUrl: string,
): Promise<{ blob: Blob; contentType: string; fileName: string }> {
  const response = await api.get(apiFilePath(fileUrl), { responseType: "blob" });
  const contentType = (response.headers["content-type"] as string) || "application/octet-stream";
  if (response.status === 404) {
    throw new Error("Document file not found on the server. Ask the student to re-upload, or redeploy the backend.");
  }
  if (response.status >= 400 || contentType.includes("application/json")) {
    throw new Error(await readBlobError(response.data as Blob));
  }
  const blob = new Blob([response.data], { type: contentType });
  const fileName = fileUrl.split("/").pop() || "document";
  return { blob, contentType, fileName };
}

export function isPdfDocument(contentType: string, fileUrl: string): boolean {
  return contentType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf");
}

export function isDocxDocument(contentType: string, fileUrl: string): boolean {
  const lower = fileUrl.toLowerCase();
  return (
    contentType.includes("wordprocessingml") ||
    lower.endsWith(".docx")
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function wordBlobToHtml(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

export function openHtmlDocumentInNewTab(html: string, documentTitle: string): void {
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.65; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; }
    p { margin: 0 0 1rem; }
  </style>
</head>
<body>${html}</body>
</html>`;
  const blob = new Blob([page], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Pop-up blocked. Allow pop-ups for this site to open the document.");
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function openDocumentInNewTab(
  fileUrl: string,
  options?: { fileName?: string; title?: string },
): Promise<void> {
  const { blob, contentType } = await fetchAuthenticatedFileBlob(fileUrl);
  const docTitle = options?.title || options?.fileName || "Student submission";

  if (isPdfDocument(contentType, fileUrl)) {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      URL.revokeObjectURL(url);
      throw new Error("Pop-up blocked. Allow pop-ups for this site to open the document.");
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  if (isDocxDocument(contentType, fileUrl)) {
    const html = await wordBlobToHtml(blob);
    openHtmlDocumentInNewTab(html, docTitle);
    return;
  }

  throw new Error("In-browser preview is available for PDF and .docx files. Use Download for older .doc files.");
}

export async function openAuthenticatedFile(fileUrl: string, options?: { fileName?: string; title?: string }): Promise<void> {
  await openDocumentInNewTab(fileUrl, options);
}

export async function downloadAuthenticatedFile(fileUrl: string, fileName?: string): Promise<void> {
  const { blob } = await fetchAuthenticatedFileBlob(fileUrl);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || fileUrl.split("/").pop() || "submission";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
