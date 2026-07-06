import { useApi } from "@/lib/useApi";
import {
  Card,
  EmptyState,
  ProgressBar,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { StudentDashboard, TaskBoard, TaskStatus } from "@/types";
import { CheckCircle2, Circle, Flag, TrendingUp } from "lucide-react";

const PHASES = [
  { key: "PROPOSAL", label: "Proposal", chapter: "Chapter 1" },
  { key: "IN_PROGRESS", label: "Design & Development", chapter: "Chapters 2–3" },
  { key: "UNDER_REVIEW", label: "Review", chapter: "Chapter 4" },
  { key: "REVISION", label: "Revision", chapter: "Corrections" },
  { key: "COMPLETED", label: "Completed", chapter: "Final submission" },
];

const STATUS_ORDER: TaskStatus[] = ["COMPLETED", "IN_PROGRESS", "UPCOMING", "OVERDUE"];

export default function StudentProgress() {
  const dash = useApi<StudentDashboard>("/student/dashboard");
  const board = useApi<TaskBoard>("/student/tasks");

  if (dash.loading || board.loading) return <Spinner label="Loading progress..." />;
  if (dash.error || board.error || !dash.data || !board.data) {
    return <EmptyState message={dash.error || board.error || "Unable to load progress"} />;
  }

  const { project } = dash.data;
  const milestones = board.data.tasks.filter((t) => t.milestone);
  const categories = [...new Set(board.data.tasks.map((t) => t.category || "GENERAL"))];
  const currentPhaseIndex = PHASES.findIndex((p) => p.key === project.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Progress Tracker</h1>
        <p className="text-sm text-slate-500">
          Follow your capstone journey from proposal to completion.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Overall Progress</p>
          <p className="mt-1 text-3xl font-extrabold text-campus-maroon">{project.progress}%</p>
          <ProgressBar value={project.progress} />
        </Card>
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Current Phase</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{project.currentPhase || "—"}</p>
          <StatusBadge status={project.status} />
        </Card>
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Days Remaining</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            {project.daysRemaining ?? "—"}
          </p>
          <p className="text-xs text-slate-400">until project deadline</p>
        </Card>
        <Card className="!p-5 bg-royal-700 text-white">
          <div className="flex items-center gap-2 text-white/80">
            <TrendingUp size={16} />
            <span className="text-sm">Milestones</span>
          </div>
          <p className="mt-1 text-3xl font-extrabold">
            {milestones.filter((m) => m.status === "COMPLETED").length}/{milestones.length}
          </p>
          <p className="text-xs text-white/70">completed</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-bold text-slate-800">Project Timeline</h3>
          <div className="space-y-4">
            {PHASES.map((phase, index) => {
              const done = currentPhaseIndex >= index;
              const active = currentPhaseIndex === index;
              return (
                <div key={phase.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        done ? "bg-emerald-500 text-white" : active ? "bg-campus-gold text-campus-maroon" : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    {index < PHASES.length - 1 && (
                      <div className={`mt-1 h-full min-h-[24px] w-0.5 ${done ? "bg-emerald-300" : "bg-slate-200"}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-slate-800">{phase.label}</p>
                    <p className="text-sm text-slate-500">{phase.chapter}</p>
                    {active && (
                      <span className="chip mt-2 bg-gold-100 text-gold-800">You are here</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-3 font-bold text-slate-800">Milestone Tracker</h3>
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Flag size={14} className="text-gold-600" />
                    <p className="text-sm font-semibold text-slate-700">{m.title}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Due {formatDate(m.dueDate)}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <ProgressBar value={m.progress} color={m.status === "COMPLETED" ? "emerald" : "crimson"} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-bold text-slate-800">Work by Category</h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const items = board.data!.tasks.filter((t) => (t.category || "GENERAL") === cat);
                const avg = Math.round(items.reduce((s, t) => s + t.progress, 0) / items.length);
                return (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="text-slate-500">{avg}%</span>
                    </div>
                    <ProgressBar value={avg} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="mb-4 font-bold text-slate-800">Task Status Summary</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-campus-maroon">
                {board.data!.statusCounts[status] || 0}
              </p>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
