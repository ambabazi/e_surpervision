import { useState } from "react";
import { Copy, Download, ExternalLink, FileText, Mail, Phone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/lib/useApi";
import { downloadAuthenticatedFile, openAuthenticatedFile } from "@/lib/files";
import {
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { Toast, type ToastKind } from "@/components/Toast";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Submission, SupervisorStudent } from "@/types";

export default function SupervisorStudents() {
  const { data, loading, error } = useApi<SupervisorStudent[]>("/supervisor/students");
  const [contact, setContact] = useState<SupervisorStudent | null>(null);
  const [selected, setSelected] = useState<SupervisorStudent | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const navigate = useNavigate();

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast({ message: `${label} copied to clipboard.`, kind: "success" });
    } catch {
      setToast({ message: `Could not copy. ${label}: ${value}`, kind: "info" });
    }
  };

  const openEmail = (student: SupervisorStudent) => {
    const email = student.project.student?.email;
    if (!email) return;
    const subject = encodeURIComponent(`Capstone Supervision — ${student.project.title}`);
    window.open(`mailto:${email}?subject=${subject}`, "_blank");
  };

  if (loading) return <Spinner label="Loading your students..." />;
  if (error) return <EmptyState message={error} />;

  const rows = data || [];

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />
      )}

      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">My Students</h1>
        <p className="text-sm text-slate-500">
          {rows.length} capstone {rows.length === 1 ? "project" : "projects"} under your supervision.
          Click a student card to view details and open their submissions.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No students assigned to you yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const { project, ...stats } = row;
            return (
              <Card
                key={project.id}
                className="flex cursor-pointer flex-col transition hover:border-crimson-200 hover:shadow-md"
                onClick={() => setSelected(row)}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={project.student?.fullName} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">
                      {project.student?.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{project.student?.program}</p>
                  </div>
                  <div className="ml-auto">
                    <StatusBadge status={project.status} />
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 text-sm font-semibold text-slate-700">
                  {project.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-400">Department</p>
                    <p className="font-medium text-slate-700">{project.student?.department || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-400">Current phase</p>
                    <p className="font-medium text-slate-700">{project.currentPhase || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-400">Submissions</p>
                    <p className="font-medium text-slate-700">
                      {stats.totalSubmissions} total · {stats.pendingSubmissions} pending
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-400">Milestones</p>
                    <p className="font-medium text-slate-700">
                      {stats.completedMilestones}/{stats.totalMilestones} done
                    </p>
                  </div>
                </div>

                {stats.lastSubmissionTitle && (
                  <p className="mt-3 text-xs text-slate-500">
                    Last submission:{" "}
                    <span className="font-medium text-slate-700">{stats.lastSubmissionTitle}</span>
                    {stats.lastSubmissionAt && ` · ${formatDate(stats.lastSubmissionAt)}`}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Started {formatDate(project.startDate)}</span>
                  <span>Due {formatDate(project.dueDate)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={project.progress} />
                  <span className="text-xs font-semibold text-slate-500">{project.progress}%</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-outline !py-2 text-xs"
                    onClick={() => setContact(row)}
                  >
                    <Mail size={14} /> Contact student
                  </button>
                  {stats.pendingSubmissions > 0 ? (
                    <button
                      type="button"
                      className="btn-primary !py-2 text-xs"
                      onClick={() => navigate("/supervisor/reviews")}
                    >
                      Review ({stats.pendingSubmissions})
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-outline !py-2 text-xs"
                      onClick={() => setSelected(row)}
                    >
                      <FileText size={14} /> View submissions
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <StudentDetailModal
          student={selected}
          onClose={() => setSelected(null)}
          onContact={() => {
            setContact(selected);
            setSelected(null);
          }}
          onReview={() => navigate("/supervisor/reviews")}
        />
      )}

      {contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Contact Student</h3>
                <p className="text-sm text-slate-500">{contact.project.student?.fullName}</p>
              </div>
              <button type="button" onClick={() => setContact(null)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-medium text-slate-800">{contact.project.student?.email || "—"}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="btn-outline !py-1.5 text-xs"
                    onClick={() => contact.project.student?.email && copyText("Email", contact.project.student.email)}
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <button
                    type="button"
                    className="btn-primary !py-1.5 text-xs"
                    onClick={() => openEmail(contact)}
                  >
                    <ExternalLink size={14} /> Open email
                  </button>
                </div>
              </div>

              {contact.project.student?.phone && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-slate-800">{contact.project.student.phone}</p>
                  <button
                    type="button"
                    className="btn-outline mt-2 !py-1.5 text-xs"
                    onClick={() => copyText("Phone", contact.project.student!.phone!)}
                  >
                    <Phone size={14} /> Copy phone
                  </button>
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Project</p>
                <p className="mt-1">{contact.project.title}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentDetailModal({
  student,
  onClose,
  onContact,
  onReview,
}: {
  student: SupervisorStudent;
  onClose: () => void;
  onContact: () => void;
  onReview: () => void;
}) {
  const { project, submissions = [], pendingSubmissions } = student;
  const s = project.student;
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const openDoc = async (submission: Submission) => {
    if (!submission.fileUrl) return;
    setOpeningId(submission.id);
    try {
      await openAuthenticatedFile(submission.fileUrl);
    } finally {
      setOpeningId(null);
    }
  };

  const downloadDoc = async (submission: Submission) => {
    if (!submission.fileUrl) return;
    setDownloadingId(submission.id);
    try {
      await downloadAuthenticatedFile(submission.fileUrl, submission.fileName || submission.title);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-soft">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <Avatar name={s?.fullName} size={48} />
            <div>
              <h3 className="text-lg font-bold text-slate-800">{s?.fullName}</h3>
              <p className="text-sm text-slate-500">{s?.program}</p>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem label="Registration" value={s?.registrationNumber || "—"} mono />
            <InfoItem label="Department" value={s?.department || "—"} />
            <InfoItem label="Email" value={s?.email || "—"} />
            <InfoItem label="Phone" value={s?.phone || "Not provided"} />
          </dl>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Project</p>
            <p className="mt-1 font-bold text-slate-800">{project.title}</p>
            {project.description && (
              <p className="mt-1 text-sm text-slate-600">{project.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Phase: <strong className="text-slate-700">{project.currentPhase || "—"}</strong></span>
              <span>Progress: <strong className="text-slate-700">{project.progress}%</strong></span>
              <span>Due: <strong className="text-slate-700">{formatDate(project.dueDate)}</strong></span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-bold text-slate-800">Submissions ({submissions.length})</h4>
              {pendingSubmissions > 0 && (
                <button type="button" className="btn-primary !py-1.5 text-xs" onClick={onReview}>
                  Review pending ({pendingSubmissions})
                </button>
              )}
            </div>

            {submissions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No submissions uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <FileText size={18} className="shrink-0 text-crimson-600" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{submission.title}</p>
                      <p className="text-xs text-slate-500">
                        {submission.fileName || "Document"} · {formatDateTime(submission.submittedAt)}
                      </p>
                    </div>
                    <StatusBadge status={submission.status} />
                    {submission.fileUrl ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-outline !py-1.5 text-xs"
                          onClick={() => openDoc(submission)}
                          disabled={openingId === submission.id}
                        >
                          <ExternalLink size={14} />
                          {openingId === submission.id ? "Opening..." : "Open"}
                        </button>
                        <button
                          type="button"
                          className="btn-outline !py-1.5 text-xs"
                          onClick={() => downloadDoc(submission)}
                          disabled={downloadingId === submission.id}
                        >
                          <Download size={14} />
                          {downloadingId === submission.id ? "Saving..." : "Download"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No file attached</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn-outline" onClick={onContact}>
            <Mail size={14} /> Contact student
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={`font-medium text-slate-800 ${mono ? "font-mono text-sm" : ""}`}>{value}</dd>
    </div>
  );
}
