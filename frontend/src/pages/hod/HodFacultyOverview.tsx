import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useApi } from "@/lib/useApi";
import {
  Avatar,
  Card,
  EmptyState,
  SectionTitle,
  Spinner,
  StatCard,
} from "@/components/ui";
import { TrendingUp, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import type { HodFacultyOverview } from "@/types";

const BAR_COLORS = ["#7A1D2E", "#E5A000", "#1D428A", "#10b981", "#6366f1"];

export default function HodFacultyOverviewPage() {
  const { data, loading, error } = useApi<HodFacultyOverview>("/hod/faculty-overview");

  if (loading) return <Spinner label="Loading faculty overview..." />;
  if (error || !data) return <EmptyState message={error || "Unable to load faculty overview"} />;

  const supervisorChart = data.supervisorStats.map((s) => ({
    name: s.name.replace(/^(Dr|Prof)\.?\s*/, ""),
    avgProgress: s.avgProgress,
    students: s.studentCount,
  }));

  const programChart = Object.entries(data.progressByProgram).map(([name, progress]) => ({
    name: name.replace("BSc ", ""),
    progress,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Faculty Overview</h1>
        <p className="text-sm text-slate-500">
          Progress and performance for your department only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Faculty Performance"
          value={`${data.facultyPerformance}%`}
          icon={<TrendingUp size={20} />}
          accent="crimson"
        />
        <StatCard
          label="On Track"
          value={data.onTrackCount}
          icon={<CheckCircle2 size={20} />}
          accent="emerald"
          hint="In progress or under review"
        />
        <StatCard
          label="At Risk"
          value={data.atRiskCount}
          icon={<AlertTriangle size={20} />}
          accent="gold"
          hint="Revision or on hold"
        />
        <StatCard
          label="Completed"
          value={data.completedCount}
          icon={<Users size={20} />}
          accent="royal"
          hint={`of ${data.totalProjects} total projects`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Average Progress by Supervisor"
            subtitle="Student project completion rate per faculty member"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supervisorChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgProgress" fill="#7A1D2E" radius={[4, 4, 0, 0]} name="Avg. progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Progress by Program"
            subtitle="Average capstone progress across degree programs"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]} name="Avg. progress %">
                  {programChart.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Supervisor Performance Table"
          subtitle="Click a supervisor to view their students"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Supervisor</th>
                <th className="px-3 py-2">Students</th>
                <th className="px-3 py-2">Avg. Progress</th>
                <th className="px-3 py-2">Completed</th>
                <th className="px-3 py-2">At Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.supervisorStats.map((s) => (
                <tr key={s.supervisorId} className="border-b border-slate-50">
                  <td className="px-3 py-3">
                    <Link
                      to={`/hod/supervisors/${s.supervisorId}`}
                      className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-slate-50"
                    >
                      <Avatar name={s.name} size={36} />
                      <div>
                        <p className="font-medium text-campus-maroon hover:underline">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.title}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-700">{s.studentCount}</td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-campus-maroon">{s.avgProgress}%</span>
                  </td>
                  <td className="px-3 py-3 text-emerald-600">{s.completedProjects}</td>
                  <td className="px-3 py-3 text-amber-600">{s.atRiskCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
