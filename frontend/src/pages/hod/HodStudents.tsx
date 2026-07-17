import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Pencil, Phone, UserPlus, UserCheck, X } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { parseApiError } from "@/lib/errors";
import { Avatar, Card, EmptyState, Spinner, StatusBadge } from "@/components/ui";
import type { HodStudentRow, PublicSupervisor } from "@/types";

export default function HodStudents() {
  const { user } = useAuth();
  const { data: students, loading, error, reload } = useApi<HodStudentRow[]>("/hod/students");
  const supervisorUrl = user?.department
    ? `/public/supervisors?department=${encodeURIComponent(user.department)}`
    : null;
  const { data: supervisors } = useApi<PublicSupervisor[]>(supervisorUrl);
  const [showForm, setShowForm] = useState(false);
  const [assignStudent, setAssignStudent] = useState<HodStudentRow | null>(null);
  const [editStudent, setEditStudent] = useState<HodStudentRow | null>(null);

  const unassigned = useMemo(
    () => (students || []).filter((s) => !s.isAssigned),
    [students],
  );

  if (loading) return <Spinner label="Loading students..." />;
  if (error) return <EmptyState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500">
            Full student records for your department — assign supervisors and view capstone topics.
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
          Unassigned ({unassigned.length})
        </h3>
        {unassigned.length === 0 ? (
          <EmptyState message="All students have been assigned a supervisor." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {unassigned.map((s) => (
              <StudentInfoCard key={s.id} student={s} onAssign={() => setAssignStudent(s)} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-bold text-slate-800">
          All department students ({students?.length || 0})
        </h3>
        {!students || students.length === 0 ? (
          <EmptyState message="No students in your department yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Reg number</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Programme</th>
                  <th className="px-3 py-2">Topic</th>
                  <th className="px-3 py-2">Supervisor</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.fullName} size={32} />
                        <div>
                          <p className="font-semibold text-slate-800">{s.fullName}</p>
                          <p className="text-xs text-slate-400">{s.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{s.registrationNumber || "—"}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-slate-600">{s.email}</p>
                      <p className="text-xs text-slate-400">{s.phone || "No phone"}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{s.program || "—"}</td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {s.approvedTopic || s.projectTitle || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {s.supervisor?.fullName || (
                        <span className="text-crimson-600">Not assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {s.projectStatus ? (
                        <StatusBadge status={s.projectStatus} />
                      ) : (
                        <span className="chip bg-gold-50 text-gold-800">No project</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-outline !px-2.5 !py-1.5 text-xs"
                          onClick={() => setEditStudent(s)}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        {!s.isAssigned && (
                          <button
                            className="btn-primary !px-2.5 !py-1.5 text-xs"
                            onClick={() => setAssignStudent(s)}
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {assignStudent && supervisors && (
        <AssignSupervisorModal
          student={assignStudent}
          supervisors={supervisors}
          onClose={() => setAssignStudent(null)}
          onDone={() => {
            setAssignStudent(null);
            reload();
          }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onDone={() => {
            setEditStudent(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function StudentInfoCard({
  student,
  onAssign,
}: {
  student: HodStudentRow;
  onAssign: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={student.fullName} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{student.fullName}</p>
          <p className="text-xs text-slate-500">{student.program}</p>
        </div>
        <button className="btn-primary !px-2.5 !py-1.5 text-xs" onClick={onAssign}>
          <UserCheck size={14} /> Assign
        </button>
      </div>
      <dl className="mt-3 grid gap-1.5 text-xs text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Registration</dt>
          <dd className="font-mono">{student.registrationNumber || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Department</dt>
          <dd>{student.department || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Topic</dt>
          <dd className="font-medium text-slate-800">{student.approvedTopic || student.projectTitle || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-400">Email</dt>
          <dd className="flex items-center gap-1 break-all">
            <Mail size={12} /> {student.email}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-400">Phone</dt>
          <dd className="flex items-center gap-1">
            <Phone size={12} /> {student.phone || "Not provided"}
          </dd>
        </div>
      </dl>
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
      setErr(parseApiError(e, "Failed to create student"));
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
          <input className="input" placeholder="202305000100" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value.replace(/\D/g, "").slice(0, 12))} maxLength={12} inputMode="numeric" />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <input className="input" placeholder="Program" value={form.program} onChange={(e) => set("program", e.target.value)} />
          <input className="input" placeholder="Phone (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <input className="input" placeholder="Project title" value={form.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} />
          <textarea className="input min-h-[70px] resize-none" placeholder="Project description (optional)" value={form.projectDescription} onChange={(e) => set("projectDescription", e.target.value)} />
          <select className="input" value={form.supervisorId} onChange={(e) => set("supervisorId", e.target.value)}>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.spotsAvailable} spot{s.spotsAvailable !== 1 ? "s" : ""} left)
              </option>
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

function AssignSupervisorModal({
  student,
  supervisors,
  onClose,
  onDone,
}: {
  student: HodStudentRow;
  supervisors: PublicSupervisor[];
  onClose: () => void;
  onDone: () => void;
}) {
  const available = useMemo(
    () => supervisors.filter((s) => (s.spotsAvailable ?? 0) > 0),
    [supervisors],
  );
  const [supervisorId, setSupervisorId] = useState(String(available[0]?.id || ""));
  const [projectTitle, setProjectTitle] = useState(
    student.approvedTopic || student.projectTitle || student.program || "Capstone Project",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!supervisorId) {
      setErr("Select a supervisor with available capacity.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.post(`/hod/students/${student.id}/assign-supervisor`, {
        supervisorId: Number(supervisorId),
        projectTitle: projectTitle.trim() || undefined,
      });
      onDone();
    } catch (e: unknown) {
      setErr(parseApiError(e, "Failed to assign supervisor"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Assign supervisor</h3>
            <p className="text-sm text-slate-500">{student.fullName}</p>
          </div>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <dl className="mb-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
          <div><dt className="text-slate-400">Registration</dt><dd className="font-mono">{student.registrationNumber || "—"}</dd></div>
          <div><dt className="text-slate-400">Department</dt><dd>{student.department || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-400">Email</dt><dd>{student.email}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-400">Phone</dt><dd>{student.phone || "Not provided"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-400">Topic</dt><dd>{student.approvedTopic || student.projectTitle || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-400">Programme</dt><dd>{student.program || "—"}</dd></div>
        </dl>

        {available.length === 0 ? (
          <p className="text-sm text-crimson-600">No supervisors with open spots in your department.</p>
        ) : (
          <div className="space-y-3">
            <select className="input" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
              {available.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.spotsAvailable} spot{s.spotsAvailable !== 1 ? "s" : ""} left)
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Project title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </div>
        )}

        {err && <p className="mt-3 text-sm text-crimson-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy || available.length === 0}>
            {busy ? "Assigning..." : "Assign now"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStudentModal({
  student,
  onClose,
  onDone,
}: {
  student: HodStudentRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState(student.fullName);
  const [registrationNumber, setRegistrationNumber] = useState(student.registrationNumber || "");
  const [phone, setPhone] = useState(student.phone || "");
  const [program, setProgram] = useState(student.program || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!fullName.trim()) {
      setErr("Student name is required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.patch(`/hod/students/${student.id}`, {
        fullName: fullName.trim(),
        registrationNumber: registrationNumber.trim() || undefined,
        phone: phone.trim() || undefined,
        program: program.trim() || undefined,
      });
      onDone();
    } catch (e: unknown) {
      setErr(parseApiError(e, "Failed to update student"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Edit student</h3>
            <p className="text-sm text-slate-500">Correct the student&apos;s name or contact details.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input className="input" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input
            className="input font-mono"
            placeholder="Registration number"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
            maxLength={12}
          />
          <input className="input" placeholder="Programme" value={program} onChange={(e) => setProgram(e.target.value)} />
          <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {err && <p className="mt-3 text-sm text-crimson-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
