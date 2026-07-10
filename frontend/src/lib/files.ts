import { api } from "./api";

const ALLOWED = [".pdf", ".doc", ".docx"] as const;

const MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateSubmissionFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED.includes(ext as (typeof ALLOWED)[number])) {
    return "Only PDF and Word documents (.pdf, .doc, .docx) are allowed.";
  }
  if (file.type && !MIME_TYPES.has(file.type)) {
    return "Invalid file type. Please upload a PDF or Word document.";
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
  if (response.status >= 400 || contentType.includes("application/json")) {
    throw new Error(await readBlobError(response.data as Blob));
  }
  const blob = new Blob([response.data], { type: contentType });
  const fileName = fileUrl.split("/").pop() || "document";
  return { blob, contentType, fileName };
}

export async function openAuthenticatedFile(fileUrl: string): Promise<void> {
  const { blob, contentType } = await fetchAuthenticatedFileBlob(fileUrl);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  if (!contentType.includes("pdf")) {
    URL.revokeObjectURL(url);
  }
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
