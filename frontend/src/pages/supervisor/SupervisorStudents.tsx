import { useState } from "react";
import { Copy, Mail, Phone, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/lib/useApi";
import {
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { Toast, type ToastKind } from "@/components/Toast";
import { formatDate } from "@/lib/format";
import type { SupervisorStudent } from "@/types";

export default function SupervisorStudents() {
  const { data, loading, error } = useApi<SupervisorStudent[]>("/supervisor/students");
  const [contact, setContact] = useState<SupervisorStudent | null>(null);
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
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No students assigned to you yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ project, ...stats }) => (
            <Card key={project.id} className="flex flex-col">
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
                  Last submission: <span className="font-medium text-slate-700">{stats.lastSubmissionTitle}</span>
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

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-outline !py-2 text-xs"
                  onClick={() => setContact({ project, ...stats })}
                >
                  <Mail size={14} /> Contact student
                </button>
                {stats.pendingSubmissions > 0 && (
                  <button
                    type="button"
                    className="btn-primary !py-2 text-xs"
                    onClick={() => navigate("/supervisor/reviews")}
                  >
                    Review ({stats.pendingSubmissions})
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
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
