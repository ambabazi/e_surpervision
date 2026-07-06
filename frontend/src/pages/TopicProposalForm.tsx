import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Send, GraduationCap, BookOpen, Users } from "lucide-react";
import { api } from "@/lib/api";
import { formatRegNumberInput } from "@/lib/regNumber";
import UokLogo from "@/components/UokLogo";
import { Toast } from "@/components/Toast";
import type { DeptPrograms, PublicSupervisor } from "@/types";

export default function TopicProposalForm() {
  const [departments, setDepartments] = useState<DeptPrograms[]>([]);
  const [supervisors, setSupervisors] = useState<PublicSupervisor[]>([]);
  const [loadingSup, setLoadingSup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    registrationNumber: "",
    email: "",
    phone: "",
    program: "",
    topic1: "",
    abstract1: "",
    topic2: "",
    abstract2: "",
    topic3: "",
    abstract3: "",
    supervisorChoice1Id: "",
    supervisorChoice2Id: "",
  });

  useEffect(() => {
    api
      .get<{ departments: DeptPrograms[] }>("/public/programs")
      .then((res) => {
        setDepartments(res.data.departments);
        const first = res.data.departments[0]?.programs[0] || "";
        setForm((f) => ({ ...f, program: first }));
      })
      .catch(() => setToast({ kind: "error", message: "Could not load programmes." }));
  }, []);

  const selectedDept = useMemo(() => {
    for (const dept of departments) {
      if (dept.programs.includes(form.program)) return dept;
    }
    return null;
  }, [departments, form.program]);

  useEffect(() => {
    if (!selectedDept) {
      setSupervisors([]);
      return;
    }
    setLoadingSup(true);
    setForm((f) => ({ ...f, supervisorChoice1Id: "", supervisorChoice2Id: "" }));
    api
      .get<PublicSupervisor[]>(`/public/supervisors?department=${selectedDept.code}`)
      .then((res) => setSupervisors(res.data))
      .catch(() => setToast({ kind: "error", message: "Could not load available supervisors." }))
      .finally(() => setLoadingSup(false));
  }, [selectedDept?.code]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.supervisorChoice1Id === form.supervisorChoice2Id) {
      setToast({ kind: "error", message: "Please choose two different supervisors." });
      return;
    }
    if (supervisors.length < 2) {
      setToast({
        kind: "error",
        message: "Not enough supervisors with open spots in your department. Contact the HOD office.",
      });
      return;
    }
    setBusy(true);
    try {
      await api.post("/public/topic-proposals", {
        fullName: form.fullName,
        registrationNumber: formatRegNumberInput(form.registrationNumber),
        email: form.email,
        phone: form.phone || undefined,
        program: form.program,
        topic1: form.topic1,
        abstract1: form.abstract1,
        topic2: form.topic2,
        abstract2: form.abstract2,
        topic3: form.topic3,
        abstract3: form.abstract3,
        supervisorChoice1Id: Number(form.supervisorChoice1Id),
        supervisorChoice2Id: Number(form.supervisorChoice2Id),
      });
      setToast({
        kind: "success",
        message: `Proposal sent to the ${selectedDept?.label || "department"} Head of Department. You will be emailed when reviewed.`,
      });
      setForm((f) => ({
        ...f,
        fullName: "",
        registrationNumber: "",
        email: "",
        phone: "",
        topic1: "",
        abstract1: "",
        topic2: "",
        abstract2: "",
        topic3: "",
        abstract3: "",
        supervisorChoice1Id: "",
        supervisorChoice2Id: "",
      }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Submission failed. Please try again.";
      setToast({ kind: "error", message: msg });
    } finally {
      setBusy(false);
    }
  };

  const topicBlock = (n: 1 | 2 | 3) => {
    const topicKey = `topic${n}` as "topic1" | "topic2" | "topic3";
    const abstractKey = `abstract${n}` as "abstract1" | "abstract2" | "abstract3";
    return (
      <div key={n} className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-crimson-700">
          <BookOpen size={16} /> Topic option {n}
        </h3>
        <label className="mb-1 block text-xs font-medium text-slate-600">Proposed title</label>
        <input
          className="input mb-3"
          required
          value={form[topicKey]}
          onChange={(e) => set(topicKey, e.target.value)}
          placeholder="e.g. Smart Irrigation System using IoT"
        />
        <label className="mb-1 block text-xs font-medium text-slate-600">Abstract</label>
        <textarea
          className="input min-h-[90px] resize-none"
          required
          value={form[abstractKey]}
          onChange={(e) => set(abstractKey, e.target.value)}
          placeholder="Brief description of the problem, approach, and expected outcomes..."
        />
      </div>
    );
  };

  return (
    <div className="min-h-full bg-campus-maroon">
      {toast && <Toast kind={toast.kind} message={toast.message} onClose={() => setToast(null)} />}

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center text-white">
          <Link to="/login" className="inline-block">
            <UokLogo variant="light" />
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold">Capstone Topic Proposal</h1>
          <p className="mt-2 text-sm text-white/80">
            Submit three proposed topics with abstracts and your preferred supervisors. Your
            department Head will review your application.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-6 rounded-2xl bg-campus-page p-6 shadow-soft sm:p-8"
        >
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
              <GraduationCap size={18} className="text-crimson-600" /> Personal details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Full name</label>
                <input
                  className="input"
                  required
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Registration number
                </label>
                <input
                  className="input font-mono uppercase"
                  required
                  placeholder="202305000078"
                  value={form.registrationNumber}
                  onChange={(e) => set("registrationNumber", formatRegNumberInput(e.target.value))}
                  maxLength={12}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Programme</label>
                <select
                  className="input"
                  required
                  value={form.program}
                  onChange={(e) => set("program", e.target.value)}
                >
                  {departments.map((dept) => (
                    <optgroup key={dept.code} label={dept.label}>
                      {dept.programs.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedDept && (
                  <p className="mt-1 text-xs text-slate-500">
                    Routed to the <strong>{selectedDept.label}</strong> Head of Department
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-base font-bold text-slate-800">Three proposed topics</h2>
            <div className="space-y-4">
              {topicBlock(1)}
              {topicBlock(2)}
              {topicBlock(3)}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
              <Users size={18} className="text-crimson-600" /> Preferred supervisors
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Only supervisors in your department with available spots are listed.
            </p>
            {loadingSup ? (
              <p className="text-sm text-slate-500">Loading available supervisors...</p>
            ) : supervisors.length === 0 ? (
              <p className="rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-900">
                No supervisors with open spots in {selectedDept?.label || "this department"} right
                now. Please try again later or contact your HOD.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    1st choice supervisor
                  </label>
                  <select
                    className="input"
                    required
                    value={form.supervisorChoice1Id}
                    onChange={(e) => set("supervisorChoice1Id", e.target.value)}
                  >
                    <option value="">Select supervisor</option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.spotsAvailable} spot{s.spotsAvailable !== 1 ? "s" : ""}{" "}
                        left)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    2nd choice supervisor
                  </label>
                  <select
                    className="input"
                    required
                    value={form.supervisorChoice2Id}
                    onChange={(e) => set("supervisorChoice2Id", e.target.value)}
                  >
                    <option value="">Select supervisor</option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.spotsAvailable} spot{s.spotsAvailable !== 1 ? "s" : ""}{" "}
                        left)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <p className="text-xs text-slate-500">
              You will receive an email when your proposal is approved or rejected.
            </p>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={busy || supervisors.length < 2}
            >
              <Send size={16} />
              {busy ? "Submitting..." : "Submit proposal"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link to="/login/student" className="font-semibold text-campus-gold hover:underline">
            Sign in to student portal
          </Link>
        </p>
      </div>
    </div>
  );
}
