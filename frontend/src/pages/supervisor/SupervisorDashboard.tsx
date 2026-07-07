import { Link } from "react-router-dom";
import { useState } from "react";
import { AlertTriangle, ClipboardCheck, FileText, Users, CheckCircle2, ArrowRight, Activity, Clock, UserPlus } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import {
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  SectionTitle,
  Spinner,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import {
  formatCountdown,
  formatDateTime,
  reviewCountdownTone,
  timeAgo,
} from "@/lib/format";
import type { SupervisorDashboard as Dash } from "@/types";

export default function SupervisorDashboard() {
  const { data, loading, error } = useApi<Dash>("/supervisor/dashboard");
  const [requestMsg, setRequestMsg] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const submitRequest = async () => {
    if (!requestMsg.trim()) return;
    setRequestBusy(true);
    try {
      await api.post("/supervisor/student-requests", { message: requestMsg.trim() });
      setRequestMsg("");
      setRequestSent(true);
    } finally {
      setRequestBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error || !data) return <EmptyState message={error || "Unable to load dashboard"} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Academic Supervision Overview
        </h1>
        <p className="text-sm text-slate-500">
          Welcome, {data.supervisor.fullName}. Pending reviews are sorted by submission hour (morning first).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Students" value={data.totalStudents} icon={<Users size={20} />} accent="crimson" />
        <StatCard label="Pending Reviews" value={data.pendingReviews} icon={<ClipboardCheck size={20} />} accent="gold" />
        <StatCard label="Active Projects" value={data.activeProjects} icon={<Activity size={20} />} accent="royal" />
        <StatCard label="Completed" value={data.completedProjects} icon={<CheckCircle2 size={20} />} accent="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending reviews */}
        <div className="lg:col-span-2">
          <Card>
            <SectionTitle
              title="Pending Student Reviews"
              action={
                <Link
                  to="/supervisor/reviews"
                  className="flex items-center gap-1 text-sm font-semibold text-crimson-700 hover:underline"
                >
                  All reviews <ArrowRight size={14} />
                </Link>
              }
            />
            {data.pendingThesisReviews.length === 0 ? (
              <EmptyState message="No submissions awaiting review." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.pendingThesisReviews.slice(0, 4).map((s) => {
                  const tone = reviewCountdownTone(s.isOverdue, s.hoursUntilDeadline);
                  const countdownText = s.isOverdue
                    ? `Overdue — ${s.hoursWaiting}h waiting for review`
                    : formatCountdown(s.hoursUntilDeadline);
                  return (
                  <div key={s.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.student?.fullName} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {s.student?.fullName || "Student"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Submitted {timeAgo(s.submittedAt)} · {formatDateTime(s.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <FileText size={14} className="text-crimson-600" />
                      {s.title}
                    </p>
                    <div
                      className={`mt-3 rounded-xl px-4 py-3 text-center ${tone.box} ${tone.text}`}
                    >
                      <Clock size={22} className="mx-auto mb-1 opacity-80" />
                      <p className="text-lg font-extrabold leading-tight">
                        {s.isOverdue ? "Review overdue" : "Time left to review"}
                      </p>
                      <p className="mt-1 text-2xl font-black tracking-tight">{countdownText}</p>
                    </div>
                    {s.priorityLabel && (
                      <p className="mt-2 text-center text-xs font-medium text-slate-500">{s.priorityLabel}</p>
                    )}
                    <Link to="/supervisor/reviews" className="btn-outline mt-3 w-full !py-2 text-xs">
                      Review now
                    </Link>
                  </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Critical alerts */}
        <Card>
          <SectionTitle title="Critical Alerts" />
          {data.criticalAlerts.length === 0 ? (
            <EmptyState message="No alerts." />
          ) : (
            <div className="space-y-3">
              {data.criticalAlerts.slice(0, 5).map((a) => (
                <div key={a.id} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                  <AlertTriangle
                    size={18}
                    className={
                      a.severity === "HIGH" ? "text-crimson-600" : "text-gold-500"
                    }
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Request a Student from HOD"
          subtitle="Ask the Head of Department to assign you an additional student"
        />
        {requestSent ? (
          <p className="text-sm text-emerald-700">Your request was sent to the HOD.</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="input flex-1"
              placeholder="Briefly explain your capacity and research area..."
              value={requestMsg}
              onChange={(e) => setRequestMsg(e.target.value)}
            />
            <button
              className="btn-primary flex shrink-0 items-center gap-1 !py-2"
              onClick={submitRequest}
              disabled={requestBusy || !requestMsg.trim()}
            >
              <UserPlus size={16} />
              {requestBusy ? "Sending..." : "Send request"}
            </button>
          </div>
        )}
      </Card>

      {/* Research pipeline */}
      <Card>
        <SectionTitle title="Department Research Pipeline" subtitle="Progress across all your supervised projects" />
        {data.researchPipeline.length === 0 ? (
          <EmptyState message="No projects assigned." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Project Title</th>
                  <th className="px-3 py-2">Phase</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-40">Progress</th>
                </tr>
              </thead>
              <tbody>
                {data.researchPipeline.map((row) => (
                  <tr key={row.projectId} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-800">{row.studentName}</td>
                    <td className="px-3 py-3 text-slate-600">{row.projectTitle}</td>
                    <td className="px-3 py-3 text-slate-500">{row.currentPhase}</td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={row.progress} />
                        <span className="text-xs text-slate-400">{row.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
