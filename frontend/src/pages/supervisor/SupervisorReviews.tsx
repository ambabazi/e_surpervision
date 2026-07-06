import { useState } from "react";
import { FileText, X } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import {
  Avatar,
  Card,
  EmptyState,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { formatDate, timeAgo } from "@/lib/format";
import type { Submission, SubmissionStatus } from "@/types";

const DECISIONS: { value: SubmissionStatus; label: string }[] = [
  { value: "APPROVED", label: "Approve" },
  { value: "NEEDS_REVISION", label: "Request Revision" },
  { value: "UNDER_REVIEW", label: "Mark Under Review" },
];

export default function SupervisorReviews() {
  const { data, loading, error, reload } = useApi<Submission[]>("/supervisor/reviews");
  const [active, setActive] = useState<Submission | null>(null);

  if (loading) return <Spinner label="Loading submissions..." />;
  if (error) return <EmptyState message={error} />;

  const submissions = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Submission Reviews</h1>
        <p className="text-sm text-slate-500">
          Review and provide feedback on student submissions.
        </p>
      </div>

      {submissions.length === 0 ? (
        <EmptyState message="No submissions yet." />
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center gap-4">
              <Avatar name={s.student?.fullName} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-crimson-600" />
                  <p className="truncate font-semibold text-slate-800">{s.title}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {s.student?.fullName} · submitted {timeAgo(s.submittedAt)}
                </p>
              </div>
              <StatusBadge status={s.status} />
              <button className="btn-primary !py-2 text-xs" onClick={() => setActive(s)}>
                Review
              </button>
            </Card>
          ))}
        </div>
      )}

      {active && (
        <ReviewModal
          submission={active}
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

function ReviewModal({
  submission,
  onClose,
  onDone,
}: {
  submission: Submission;
  onClose: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<SubmissionStatus>("APPROVED");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/supervisor/submissions/${submission.id}/review`, {
        status,
        feedback,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Review Submission</h3>
            <p className="text-sm text-slate-500">
              {submission.title} · {submission.student?.fullName}
            </p>
            <p className="text-xs text-slate-400">
              Submitted {formatDate(submission.submittedAt)}
            </p>
          </div>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <label className="mb-1.5 block text-sm font-medium text-slate-700">Decision</label>
        <div className="grid grid-cols-3 gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setStatus(d.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                status === d.value
                  ? "border-crimson-600 bg-crimson-50 text-crimson-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <label className="mb-1.5 mt-4 block text-sm font-medium text-slate-700">
          Feedback
        </label>
        <textarea
          className="input min-h-[110px] resize-none"
          placeholder="Write constructive feedback for the student..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
