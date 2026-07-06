import { useState } from "react";
import { CalendarClock, Flag, GraduationCap, ShieldCheck } from "lucide-react";
import { useApi } from "@/lib/useApi";
import {
  Card,
  EmptyState,
  ProgressBar,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { TaskBoard, TaskStatus } from "@/types";

const TABS: { key: "ALL" | TaskStatus; label: string }[] = [
  { key: "ALL", label: "All Tasks" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "OVERDUE", label: "Overdue" },
];

const STANDARDS = [
  { label: "Plagiarism Policy", detail: "All submissions checked for academic integrity (max 15% similarity)." },
  { label: "APA 7th Edition", detail: "All references and citations must follow APA 7th edition." },
  { label: "Bi-weekly Meetings", detail: "Meet your supervisor at least once every two weeks." },
];

export default function StudentTasks() {
  const { data, loading, error } = useApi<TaskBoard>("/student/tasks");
  const [tab, setTab] = useState<"ALL" | TaskStatus>("ALL");

  if (loading) return <Spinner label="Loading tasks..." />;
  if (error || !data) return <EmptyState message={error || "Unable to load tasks"} />;

  const tasks =
    tab === "ALL" ? data.tasks : data.tasks.filter((t) => t.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Tasks & Milestones</h1>
        <p className="text-sm text-slate-500">
          Track your project progress, manage upcoming deliverables, and stay aligned
          with your supervisor's expectations.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Overall Progress</p>
          <p className="mt-1 text-3xl font-extrabold text-crimson-700">
            {data.overallProgress}%
          </p>
          <div className="mt-3">
            <ProgressBar value={data.overallProgress} />
          </div>
        </Card>
        <Card className="!p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <Flag size={16} /> <span className="text-sm">Next Milestone</span>
          </div>
          <p className="mt-1 text-base font-bold text-slate-800">
            {data.nextMilestone?.title || "—"}
          </p>
          {data.nextMilestone?.dueDate && (
            <p className="text-xs text-slate-400">{formatDate(data.nextMilestone.dueDate)}</p>
          )}
        </Card>
        <Card className="!p-5 bg-royal-700 text-white">
          <div className="flex items-center gap-2 text-white/80">
            <CalendarClock size={16} /> <span className="text-sm">Days Remaining</span>
          </div>
          <p className="mt-1 text-3xl font-extrabold">{data.daysToMilestone ?? "—"}</p>
          <p className="text-xs text-white/70">until next milestone</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => {
          const count =
            t.key === "ALL" ? data.tasks.length : data.statusCounts[t.key] || 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-crimson-700 text-crimson-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-slate-400">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks list */}
        <div className="lg:col-span-2">
          {tasks.length === 0 ? (
            <EmptyState message="No tasks in this category." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tasks.map((task) => (
                <Card key={task.id} className="!p-5">
                  <div className="flex items-center justify-between">
                    <span className="chip bg-slate-100 text-slate-600">
                      {task.category || "TASK"}
                    </span>
                    {task.milestone && (
                      <span className="chip bg-gold-100 text-gold-800">
                        <Flag size={12} /> Milestone
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-bold text-slate-800">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Due {formatDate(task.dueDate)}</span>
                      <span>{task.progress}%</span>
                    </div>
                    <ProgressBar
                      value={task.progress}
                      color={task.status === "COMPLETED" ? "emerald" : "crimson"}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={task.status} />
                    {task.priority && <StatusBadge status={task.priority} />}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Academic standards */}
        <div className="space-y-6">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-crimson-700" />
              <h3 className="font-bold text-slate-800">Academic Standards</h3>
            </div>
            <div className="space-y-3">
              {STANDARDS.map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-700">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-crimson-900 text-white">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-gold-400" />
              <h3 className="font-bold">Need help?</h3>
            </div>
            <p className="mt-2 text-sm text-white/80">
              Reach out to academic support or schedule a meeting with your supervisor
              for guidance on your milestones.
            </p>
            <button
              type="button"
              className="btn-gold mt-4 w-full"
              onClick={() => window.open("mailto:academic.support@uok.ac.rw?subject=Capstone%20Support", "_blank")}
            >
              Chat with Academic Support
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
