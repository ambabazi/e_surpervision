import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useApi } from "@/lib/useApi";
import {
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import type { HodDashboard as Dash } from "@/types";

export default function HodSupervisors() {
  const { data, loading, error } = useApi<Dash>("/hod/dashboard");

  if (loading) return <Spinner label="Loading supervisors..." />;
  if (error || !data) return <EmptyState message={error || "Unable to load"} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Supervisors</h1>
        <p className="text-sm text-slate-500">
          {data.totalSupervisors} faculty supervisors — click a row to view their students.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Supervisor</th>
                <th className="px-3 py-2">Specialization</th>
                <th className="px-3 py-2 w-48">Load</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {data.supervisorWorkload.map((w) => (
                <tr key={w.supervisorId} className="border-b border-slate-50">
                  <td className="px-3 py-3">
                    <Link
                      to={`/hod/supervisors/${w.supervisorId}`}
                      className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-slate-50"
                    >
                      <Avatar name={w.name} size={36} />
                      <span className="font-medium text-campus-maroon hover:underline">
                        {w.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{w.title}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={(w.load / w.capacity) * 100}
                        color={w.load >= w.capacity ? "crimson" : "royal"}
                      />
                      <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
                        {w.load}/{w.capacity}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      to={`/hod/supervisors/${w.supervisorId}`}
                      className="text-slate-400 hover:text-campus-maroon"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
