import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  MessageSquareText,
  Upload,
  Star,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import { useApi } from "@/lib/useApi";
import {
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  SectionTitle,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { formatDate, timeAgo } from "@/lib/format";
import type { StudentDashboard as Dash } from "@/types";

export default function StudentDashboard() {
  const { data, loading, error } = useApi<Dash>("/student/dashboard");

  if (loading) return <Spinner label="Loading your dashboard..." />;
  if (error || !data)
    return <EmptyState message={error || "Unable to load dashboard"} />;

  const { student, project, supervisor, upcomingTasks, recentFeedback, nextMilestone } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Welcome back, {student.fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500">
            Here's how your capstone project is progressing.
          </p>
        </div>
        <Link to="/student/submissions" className="btn-primary">
          <Upload size={18} /> New Submission
        </Link>
      </div>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Overall Progress</p>
          <p className="mt-1 text-3xl font-extrabold text-crimson-700">
            {project.progress}%
          </p>
          <div className="mt-3">
            <ProgressBar value={project.progress} />
          </div>
        </Card>
        <Card className="!p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarClock size={16} /> <span className="text-sm">Days Remaining</span>
          </div>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            {project.daysRemaining ?? "—"}
          </p>
          <p className="text-xs text-slate-400">Due {formatDate(project.dueDate)}</p>
        </Card>
        <Card className="!p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={16} /> <span className="text-sm">Current Phase</span>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-800">
            {project.currentPhase || "—"}
          </p>
          <div className="mt-2">
            <StatusBadge status={project.status} />
          </div>
        </Card>
        <Card className="!p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <CheckCircle2 size={16} /> <span className="text-sm">Next Milestone</span>
          </div>
          <p className="mt-1 text-base font-bold text-slate-800 line-clamp-2">
            {nextMilestone?.title || "All milestones complete"}
          </p>
          {nextMilestone?.dueDate && (
            <p className="text-xs text-slate-400">Due {formatDate(nextMilestone.dueDate)}</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: project + tasks */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle
              title="Capstone Project"
              subtitle={project.title}
              action={<StatusBadge status={project.status} />}
            />
            <p className="text-sm leading-relaxed text-slate-600">
              {project.description}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-slate-400">Started</p>
                <p className="font-semibold text-slate-700">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <p className="text-slate-400">Due</p>
                <p className="font-semibold text-slate-700">{formatDate(project.dueDate)}</p>
              </div>
              <div>
                <p className="text-slate-400">Phase</p>
                <p className="font-semibold text-slate-700">{project.currentPhase}</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Upcoming Tasks"
              action={
                <Link
                  to="/student/tasks"
                  className="flex items-center gap-1 text-sm font-semibold text-crimson-700 hover:underline"
                >
                  View all <ArrowRight size={14} />
                </Link>
              }
            />
            {upcomingTasks.length === 0 ? (
              <EmptyState message="No upcoming tasks. Great job!" />
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-royal-50 text-royal-700">
                      <ListIcon category={task.category} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-slate-800">{task.title}</p>
                        {task.milestone && (
                          <span className="chip bg-gold-100 text-gold-800">Milestone</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Due {formatDate(task.dueDate)}</p>
                      <div className="mt-1.5">
                        <ProgressBar value={task.progress} color="royal" />
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: supervisor + feedback */}
        <div className="space-y-6">
          <Card>
            <SectionTitle title="My Supervisor" />
            {supervisor ? (
              <div>
                <div className="flex items-center gap-3">
                  <Avatar name={supervisor.fullName} src={supervisor.avatarUrl} size={48} />
                  <div>
                    <p className="font-bold text-slate-800">{supervisor.fullName}</p>
                    <p className="text-xs text-slate-500">{supervisor.title}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-slate-600">
                    <Mail size={15} className="text-slate-400" /> {supervisor.email}
                  </p>
                  {supervisor.phone && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Phone size={15} className="text-slate-400" /> {supervisor.phone}
                    </p>
                  )}
                </div>
                <Link to="/student/feedback" className="btn-outline mt-4 w-full">
                  <MessageSquareText size={16} /> View Feedback
                </Link>
              </div>
            ) : (
              <EmptyState message="No supervisor assigned yet." />
            )}
          </Card>

          <Card>
            <SectionTitle title="Recent Feedback" />
            {recentFeedback.length === 0 ? (
              <EmptyState message="No feedback yet." />
            ) : (
              <div className="space-y-4">
                {recentFeedback.slice(0, 3).map((fb) => (
                  <div key={fb.id} className="border-l-2 border-crimson-200 pl-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">
                        {fb.title || "Feedback"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-3">
                      {fb.content}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {fb.author?.fullName} · {timeAgo(fb.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ListIcon({ category }: { category?: string }) {
  const c = (category || "").toUpperCase();
  if (c === "DESIGN") return <span className="text-sm font-bold">D</span>;
  if (c === "RESEARCH") return <span className="text-sm font-bold">R</span>;
  if (c === "MILESTONE") return <Star size={16} />;
  return <CheckCircle2 size={16} />;
}
