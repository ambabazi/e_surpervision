import { useState } from "react";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { Avatar, Card, EmptyState, Spinner, StatusBadge } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { HodStudentRequest } from "@/types";

export default function HodRequests() {
  const { data, loading, error, reload } = useApi<HodStudentRequest[]>("/hod/student-requests");
  const [active, setActive] = useState<HodStudentRequest | null>(null);

  if (loading) return <Spinner label="Loading requests..." />;
  if (error) return <EmptyState message={error} />;

  const requests = data || [];
  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Supervisor Requests</h1>
        <p className="text-sm text-slate-500">
          Supervisors requesting additional students from the department.
        </p>
      </div>

      {pending.length === 0 && requests.length === 0 ? (
        <EmptyState message="No supervisor requests yet." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-start gap-4">
              <Avatar name={r.supervisor?.fullName} size={44} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{r.supervisor?.fullName}</p>
                <p className="text-xs text-slate-400">{timeAgo(r.createdAt)}</p>
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <MessageSquare size={14} className="mt-0.5 shrink-0 text-crimson-600" />
                  {r.message}
                </p>
                {r.hodResponse && (
                  <p className="mt-2 text-xs text-slate-500">Response: {r.hodResponse}</p>
                )}
              </div>
              <StatusBadge status={r.status} />
              {r.status === "PENDING" && (
                <button className="btn-primary !py-2 text-xs" onClick={() => setActive(r)}>
                  Respond
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {active && (
        <RespondModal
          request={active}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function RespondModal({
  request,
  onClose,
  onDone,
}: {
  request: HodStudentRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);

  const respond = async (status: "APPROVED" | "REJECTED") => {
    setBusy(true);
    try {
      await api.post(`/hod/student-requests/${request.id}/respond`, { status, response });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-bold text-slate-800">Respond to request</h3>
        <p className="text-sm text-slate-500">{request.supervisor?.fullName}</p>
        <textarea
          className="input mt-4 min-h-[90px] resize-none"
          placeholder="Optional message to the supervisor..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-outline flex items-center gap-1 !text-crimson-700"
            disabled={busy}
            onClick={() => respond("REJECTED")}
          >
            <XCircle size={16} /> Reject
          </button>
          <button
            className="btn-primary flex items-center gap-1"
            disabled={busy}
            onClick={() => respond("APPROVED")}
          >
            <CheckCircle2 size={16} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}
