import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Lock, Mail, GraduationCap, UserCog, Building2, Hash } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UokLogo from "@/components/UokLogo";
import { EXAMPLE_REG_NUMBER, formatRegNumberInput } from "@/lib/regNumber";

const STAFF_DEFAULT_PASSWORD = "Password@123";
import type { Role } from "@/types";

const PORTAL_CONFIG: Record<
  Role,
  {
    label: string;
    icon: typeof GraduationCap;
    identifier: string;
    password: string;
    hint: string;
    identifierLabel: string;
    identifierType: "text" | "email";
    tagline: string;
    home: string;
  }
> = {
  STUDENT: {
    label: "Student",
    icon: GraduationCap,
    identifier: EXAMPLE_REG_NUMBER,
    password: EXAMPLE_REG_NUMBER,
    hint: "13-digit registration number (YYYYTTNNNNNN). Your password is the same as your reg number.",
    identifierLabel: "Registration Number",
    identifierType: "text",
    tagline: "Track your capstone project, submit work, and receive supervisor feedback.",
    home: "/student",
  },
  SUPERVISOR: {
    label: "Supervisor",
    icon: UserCog,
    identifier: "jean.bosco@uok.ac.rw",
    password: STAFF_DEFAULT_PASSWORD,
    hint: "Use your official University of Kigali email (@uok.ac.rw) only — not Gmail or other providers.",
    identifierLabel: "University Email",
    identifierType: "email",
    tagline: "Review submissions, monitor student progress, and manage your supervision workload.",
    home: "/supervisor",
  },
  HOD: {
    label: "Head of Department",
    icon: Building2,
    identifier: "hod.it@uok.ac.rw",
    password: STAFF_DEFAULT_PASSWORD,
    hint: "Use your @uok.ac.rw email. Default password is Password@123 until you change it.",
    identifierLabel: "University Email",
    identifierType: "email",
    tagline: "Oversee department-wide supervision, assign supervisors, and monitor faculty performance.",
    home: "/hod",
  },
};

interface LoginProps {
  role: Role;
}

export default function Login({ role }: LoginProps) {
  const config = PORTAL_CONFIG[role];
  const Icon = config.icon;
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(config.identifier);
  const [password, setPassword] = useState(config.password);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isStaff = role === "SUPERVISOR" || role === "HOD";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (isStaff && !identifier.trim().toLowerCase().endsWith("@uok.ac.rw")) {
      setError("Please use your official University of Kigali email (@uok.ac.rw). Gmail and other personal emails are not accepted.");
      setBusy(false);
      return;
    }

    try {
      const user = await login(identifier.trim(), password, role);
      if (user.role !== role) {
        setError(`This account is not a ${config.label.toLowerCase()} account. Use the correct portal.`);
        return;
      }
      navigate(config.home);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full">
      <div className="relative hidden w-1/2 flex-col justify-between bg-campus-maroon p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold-300 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-campus-sky blur-3xl" />
        </div>
        <div className="relative">
          <UokLogo variant="light" />
          <p className="mt-3 text-sm text-white/70">{config.label} Portal</p>
        </div>
        <div className="relative">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Icon size={28} className="text-gold-300" />
          </div>
          <h1 className="text-4xl font-extrabold leading-tight">
            {config.label}
            <br />
            <span className="text-gold-300">Portal</span>
          </h1>
          <p className="mt-4 max-w-md text-white/70">{config.tagline}</p>
        </div>
        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} University of Kigali. All rights reserved.
        </p>
      </div>

      <div className="flex w-full items-center justify-center bg-campus-page p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <UokLogo />
            <p className="mt-2 text-xs text-slate-500">{config.label} Portal</p>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <Icon size={22} className="text-campus-maroon" />
            <h2 className="text-2xl font-extrabold text-slate-800">{config.label} Sign in</h2>
          </div>
          <p className="text-sm text-slate-500">Sign in with your {config.label.toLowerCase()} credentials.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {config.identifierLabel}
              </label>
              <div className="relative">
                {role === "STUDENT" ? (
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                ) : (
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                )}
                <input
                  type={config.identifierType}
                  className="input pl-9"
                  value={identifier}
                  onChange={(e) =>
                    setIdentifier(
                      role === "STUDENT" ? formatRegNumberInput(e.target.value) : e.target.value,
                    )
                  }
                  required
                  autoComplete={role === "STUDENT" ? "username" : "email"}
                  placeholder={role === "STUDENT" ? "202305000078" : "name@uok.ac.rw"}
                  maxLength={role === "STUDENT" ? 13 : undefined}
                  inputMode={role === "STUDENT" ? "numeric" : undefined}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">{config.hint}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  className="input pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-crimson-50 px-4 py-2.5 text-sm text-crimson-700">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              <LogIn size={18} />
              {busy ? "Signing in..." : `Sign in to ${config.label} Portal`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function LoginPortalPicker() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-campus-maroon p-6 text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold-300 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-campus-sky blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center">
        <UokLogo variant="light" />
        <h1 className="mt-6 text-2xl font-extrabold text-white">Capstone E-Supervision Portal</h1>
        <p className="mt-2 text-sm text-white/70">Choose your portal to sign in</p>
        <div className="mt-8 grid w-full max-w-md gap-3">
          {(Object.keys(PORTAL_CONFIG) as Role[]).map((role) => {
            const c = PORTAL_CONFIG[role];
            const Icon = c.icon;
            return (
              <Link
                key={role}
                to={`/login/${role.toLowerCase()}`}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white p-4 shadow-soft transition hover:border-gold-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-campus-maroon/10 text-campus-maroon">
                  <Icon size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{c.label} Portal</p>
                  <p className="text-xs text-slate-500">{c.tagline.slice(0, 60)}…</p>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-white/70">
          New student?{" "}
          <Link to="/apply" className="font-semibold text-campus-gold hover:underline">
            Submit a topic proposal
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-white/50">
          Student accounts are created by the HOD after proposal approval.
        </p>
      </div>
    </div>
  );
}
