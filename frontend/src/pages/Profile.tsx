import { Mail, Phone, Building2, BadgeCheck, BookOpen, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Card, SectionTitle } from "@/components/ui";
import { prettyStatus } from "@/lib/format";

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const roleLabel =
    user.role === "STUDENT"
      ? "Student"
      : user.role === "SUPERVISOR"
      ? "Supervisor"
      : "Head of Department";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-800">My Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.fullName} src={user.avatarUrl} size={96} />
            <h2 className="mt-4 text-lg font-bold text-slate-800">{user.fullName}</h2>
            <p className="text-sm text-slate-500">{user.title}</p>
            <span className="chip mt-3 bg-crimson-50 text-crimson-700">
              <BadgeCheck size={14} /> {roleLabel}
            </span>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <p className="flex items-center gap-3 text-slate-600">
              <Mail size={16} className="text-slate-400" /> {user.email}
            </p>
            {user.phone && (
              <p className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-slate-400" /> {user.phone}
              </p>
            )}
            {user.department && (
              <p className="flex items-center gap-3 text-slate-600">
                <Building2 size={16} className="text-slate-400" /> {user.department}
              </p>
            )}
            {user.program && (
              <p className="flex items-center gap-3 text-slate-600">
                <BookOpen size={16} className="text-slate-400" /> {user.program}
              </p>
            )}
          </div>

          <button onClick={logout} className="btn-outline mt-6 w-full text-crimson-700">
            <LogOut size={16} /> Sign out
          </button>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle title="About" />
            <p className="text-sm leading-relaxed text-slate-600">
              {user.bio || "No bio provided yet."}
            </p>
          </Card>

          <Card>
            <SectionTitle title="Account Details" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Full Name" value={user.fullName} />
              <Detail label="Role" value={roleLabel} />
              <Detail label="Email" value={user.email} />
              <Detail label="Department" value={user.department} />
              <Detail label="Title / Specialization" value={user.title} />
              <Detail label="Program" value={user.program || "—"} />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Quick Settings" />
            <div className="space-y-3">
              <Toggle label="Email notifications" hint="Receive deadline and feedback emails" defaultOn />
              <Toggle label="Weekly summary" hint="Get a weekly progress digest" defaultOn />
              <Toggle label="In-app alerts" hint="Show alerts inside the portal" defaultOn />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-700">{value ? prettyStatus(value) === value ? value : value : "—"}</p>
    </div>
  );
}

function Toggle({
  label,
  hint,
  defaultOn,
}: {
  label: string;
  hint: string;
  defaultOn?: boolean;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
      <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-crimson-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
