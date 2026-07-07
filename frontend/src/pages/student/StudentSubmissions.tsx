import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Upload, X } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { formatFileSize, validateSubmissionFile } from "@/lib/files";
import {
  Card,
  EmptyState,
  SectionTitle,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { Toast, type ToastKind } from "@/components/Toast";
import { formatDate } from "@/lib/format";
import type { Submission } from "@/types";

export default function StudentSubmissions() {
  const { data, loading, error, reload } = useApi<Submission[]>("/student/submissions");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const [windowInfo, setWindowInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<{ enabled: boolean; message: string }>("/public/submission-window")
      .then((res) => setWindowInfo(res.data.enabled ? res.data.message : null))
      .catch(() => undefined);
  }, []);

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setToast({ message: "Please select a PDF or Word document to upload.", kind: "error" });
      return;
    }

    const validationError = validateSubmissionFile(file);
    if (validationError) {
      setToast({ message: validationError, kind: "error" });
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("notes", notes.trim());
      form.append("file", file);
      await api.post("/student/submissions", form);
      resetForm();
      setShowForm(false);
      reload();
      setToast({
        message: "Submission successful! Your supervisor has been notified.",
        kind: "success",
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; detail?: string } } };
      const message =
        ax.response?.data?.message ||
        ax.response?.data?.detail ||
        "Submission failed. Please check your file and try again.";
      setToast({ message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      return;
    }
    const validationError = validateSubmissionFile(selected);
    if (validationError) {
      setToast({ message: validationError, kind: "error" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(selected);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Submissions</h1>
          <p className="text-sm text-slate-500">
            Upload PDF or Word documents only (.pdf, .doc, .docx) — max 10 MB.
          </p>
          {windowInfo && (
            <p className="mt-1 text-xs text-gold-800">{windowInfo}</p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "New Submission"}
        </button>
      </div>

      {showForm && (
        <Card>
          <SectionTitle title="New Submission" subtitle="Upload a deliverable for supervisor review" />
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
              <input
                className="input"
                placeholder="e.g. Chapter 3 - Methodology"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Notes for supervisor
              </label>
              <textarea
                className="input min-h-[90px]"
                placeholder="Briefly describe what you are submitting..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Document (PDF or Word)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="input cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-campus-maroon file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                required
              />
              {file && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={busy || !file}>
              <Upload size={18} /> {busy ? "Submitting..." : "Submit for Review"}
            </button>
          </form>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState message={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="You have no submissions yet." />
      ) : (
        <div className="space-y-3">
          {data.map((s) => (
            <Card key={s.id} className="flex items-center gap-4 !p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-crimson-50 text-crimson-700">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{s.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {s.fileName} · Submitted {formatDate(s.submittedAt)}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
