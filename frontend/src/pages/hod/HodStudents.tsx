import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, UserPlus, X } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { Avatar, Card, EmptyState, Spinner } from "@/components/ui";
import type { HodDashboard as Dash, PublicSupervisor } from "@/types";

export default function HodStudents() {
  const { data, loading, error, reload } = useApi<Dash>("/hod/dashboard");
  const { data: supervisors } = useApi<PublicSupervisor[]>("/public/supervisors");
  const [showForm, setShowForm] = useState(false);

  if (loading) return <Spinner label="Loading students..." />;
  if (error || !data) return <EmptyState message={error || "Unable to load"} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500">
            {data.totalStudents} students · {data.unassignedCount} awaiting supervisor allocation.
            Student accounts are created by the HOD only.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/hod/proposals" className="btn-outline !py-2 text-xs">
            View topic proposals
          </Link>
          <button className="btn-primary flex items-center gap-1 !py-2 text-xs" onClick={() => setShowForm(true)}>
            <UserPlus size={14} /> Create student
          </button>
        </div>
      </div>

      <Card>
        <h3 className="mb-4 text-base font-bold text-slate-800">
          Unassigned Students ({data.unassignedStudents.length})
        </h3>
        {data.unassignedStudents.length === 0 ? (
          <EmptyState message="All students have been assigned a supervisor." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.unassignedStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <Avatar name={s.fullName} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{s.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{s.program}</p>
                  {s.registrationNumber && (
                    <p className="text-xs text-slate-400">{s.registrationNumber}</p>
                  )}
                </div>
                <a
                  href={`mailto:${s.email}`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  title={s.email}
                >
                  <Mail size={16} />
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && supervisors && (
        <CreateStudentModal
          supervisors={supervisors}
          onClose={() => setShowForm(false)}
          onDone={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function CreateStudentModal({
  supervisors,
  onClose,
  onDone,
}: {
  supervisors: PublicSupervisor[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    registrationNumber: "",
    email: "",
    program: "BSc Software Engineering",
    phone: "",
    supervisorId: String(supervisors[0]?.id || ""),
    projectTitle: "",
    projectDescription: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.post("/hod/students", {
        fullName: form.fullName,
        registrationNumber: form.registrationNumber,
        email: form.email,
        program: form.program,
        phone: form.phone || undefined,
        supervisorId: Number(form.supervisorId),
        projectTitle: form.projectTitle,
        projectDescription: form.projectDescription || undefined,
      });
      onDone();
    } catch (e: unknown) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to create student"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Create student account</h3>
            <p className="text-sm text-slate-500">Password defaults to registration number.</p>
          </div>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input className="input" placeholder="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          <input className="input" placeholder="202305000100" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value.replace(/\D/g, "").slice(0, 13))} maxLength={13} inputMode="numeric" />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <input className="input" placeholder="Program" value={form.program} onChange={(e) => set("program", e.target.value)} />
          <input className="input" placeholder="Phone (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <input className="input" placeholder="Project title" value={form.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} />
          <textarea className="input min-h-[70px] resize-none" placeholder="Project description (optional)" value={form.projectDescription} onChange={(e) => set("projectDescription", e.target.value)} />
          <select className="input" value={form.supervisorId} onChange={(e) => set("supervisorId", e.target.value)}>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        </div>

        {err && <p className="mt-3 text-sm text-crimson-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>Create</button>
        </div>
      </div>
    </div>
  );
}
