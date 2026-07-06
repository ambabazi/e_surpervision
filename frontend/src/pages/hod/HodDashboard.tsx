import { Link } from "react-router-dom";
import { Users, GraduationCap, UserPlus, ArrowRight, ClipboardList, Inbox } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useApi } from "@/lib/useApi";
import {
  Avatar,
  Card,
  EmptyState,
  SectionTitle,
  Spinner,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { prettyStatus } from "@/lib/format";
import type { HodDashboard as Dash } from "@/types";

const PIE_COLORS = ["#9c1c2e", "#f7c948", "#1d4ed8", "#10b981", "#c5283c", "#94a3b8"];

export default function HodDashboard() {
  const { data, loading, error } = useApi<Dash>("/hod/dashboard");

  if (loading) return <Spinner label="Loading department analytics..." />;
  if (error || !data) return <EmptyState message={error || "Unable to load dashboard"} />;

  const pieData = Object.entries(data.projectStatusBreakdown).map(([k, v]) => ({
    name: prettyStatus(k),
    value: v,
  }));

  const workloadData = data.supervisorWorkload.map((w) => ({
    name: w.name.replace(/^(Dr|Prof)\.?\s*/, ""),
    load: w.load,
    capacity: w.capacity,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">HOD Dashboard</h1>
        <p className="text-sm text-slate-500">
          Department-wide capstone supervision performance and workload.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={data.totalStudents}
          icon={<GraduationCap size={20} />}
          accent="crimson"
        />
        <StatCard
          label="Pending Proposals"
          value={data.pendingProposals}
          icon={<ClipboardList size={20} />}
          accent="gold"
          hint="Awaiting HOD review"
        />
        <StatCard
          label="Supervisor Requests"
          value={data.pendingSupervisorRequests}
          icon={<Inbox size={20} />}
          accent="royal"
        />
        <StatCard
          label="Unassigned"
          value={data.unassignedCount}
          icon={<UserPlus size={20} />}
          accent="emerald"
          hint="Awaiting supervisor"
        />
      </div>

      {(data.pendingProposals > 0 || data.pendingSupervisorRequests > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.pendingProposals > 0 && (
            <Link
              to="/hod/proposals"
              className="flex items-center justify-between rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-900 hover:bg-gold-100"
            >
              {data.pendingProposals} topic proposal(s) to review
              <ArrowRight size={16} />
            </Link>
          )}
          {data.pendingSupervisorRequests > 0 && (
            <Link
              to="/hod/requests"
              className="flex items-center justify-between rounded-xl border border-royal-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-royal-900 hover:bg-blue-100"
            >
              {data.pendingSupervisorRequests} supervisor request(s)
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Faculty performance */}
        <Card className="flex flex-col justify-between">
          <SectionTitle title="Faculty Performance" subtitle="Avg. project completion" />
          <div className="flex flex-1 flex-col items-center justify-center py-4">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#9c1c2e"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.facultyPerformance / 100) * 326.7} 326.7`}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-extrabold text-crimson-700">
                  {data.facultyPerformance}%
                </p>
                <p className="text-xs text-slate-400">on track</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Project status breakdown */}
        <Card>
          <SectionTitle title="Project Status" subtitle="Across the department" />
          {pieData.length === 0 ? (
            <EmptyState message="No projects yet." />
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </Card>

        {/* Unassigned students */}
        <Card>
          <SectionTitle
            title="Unassigned Students"
            action={
              <Link
                to="/hod/students"
                className="flex items-center gap-1 text-sm font-semibold text-crimson-700 hover:underline"
              >
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          {data.unassignedStudents.length === 0 ? (
            <EmptyState message="All students are assigned." />
          ) : (
            <div className="space-y-2">
              {data.unassignedStudents.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                  <Avatar name={s.fullName} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{s.fullName}</p>
                    <p className="truncate text-xs text-slate-400">{s.program}</p>
                  </div>
                  <span className="chip ml-auto bg-crimson-50 text-crimson-700">Pending</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Supervisor workload */}
      <Card>
        <SectionTitle
          title="Supervisor Workload"
          subtitle="Active supervision load vs. capacity"
          action={
            <Link
              to="/hod/supervisors"
              className="flex items-center gap-1 text-sm font-semibold text-crimson-700 hover:underline"
            >
              Details <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="load" fill="#9c1c2e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {data.supervisorWorkload.map((w) => (
              <Link
                key={w.supervisorId}
                to={`/hod/supervisors/${w.supervisorId}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-campus-maroon/30 hover:bg-slate-50"
              >
                <Avatar name={w.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{w.name}</p>
                  <p className="text-xs text-slate-400">{w.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">
                    {w.load}/{w.capacity}
                  </p>
                  <StatusBadge status={w.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
