import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApi } from "@/lib/useApi";
import {
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Project } from "@/types";

export default function HodSupervisorDetail() {
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const { data, loading, error } = useApi<Project[]>(
    `/hod/supervisors/${supervisorId}/students`
  );

  if (loading) return <Spinner label="Loading students..." />;
  if (error) return <EmptyState message={error} />;

  const projects = data || [];
  const supervisor = projects[0]?.supervisor;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/hod/supervisors"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-campus-maroon hover:underline"
        >
          <ArrowLeft size={16} /> Back to Supervisors
        </Link>
        <div className="flex items-center gap-4">
          {supervisor && <Avatar name={supervisor.fullName} size={56} />}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              {supervisor?.fullName || "Supervisor"}
            </h1>
            <p className="text-sm text-slate-500">
              {supervisor?.title} · {projects.length} student
              {projects.length === 1 ? "" : "s"} under supervision
            </p>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState message="No students assigned to this supervisor yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center gap-3">
                <Avatar name={p.student?.fullName} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-800">{p.student?.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{p.student?.program}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">{p.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-slate-400">Phase</p>
                  <p className="font-medium text-slate-700">{p.currentPhase || "—"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-slate-400">Due date</p>
                  <p className="font-medium text-slate-700">{formatDate(p.dueDate)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-slate-400">Email</p>
                  <p className="truncate font-medium text-slate-700">{p.student?.email || "—"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-slate-400">Phone</p>
                  <p className="font-medium text-slate-700">{p.student?.phone || "—"}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <ProgressBar value={p.progress} />
                <span className="text-xs font-semibold text-slate-500">{p.progress}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
