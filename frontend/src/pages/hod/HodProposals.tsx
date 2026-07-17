import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  XCircle,
} from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import {
  Card,
  EmptyState,
  SectionTitle,
  Spinner,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { timeAgo, formatDateTime } from "@/lib/format";
import type { HodProposalPipeline, ProposalStatus, PublicSupervisor, TopicProposal } from "@/types";

const FILTERS: { label: string; value: ProposalStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

function similarityClass(level: string) {
  if (level === "high") return "bg-crimson-50 text-crimson-700 border-crimson-200";
  if (level === "medium") return "bg-gold-50 text-gold-800 border-gold-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function HodProposals() {
  const [filter, setFilter] = useState<ProposalStatus | "ALL">("ALL");
  const path =
    filter === "ALL" ? "/hod/proposal-pipeline" : `/hod/proposal-pipeline?status=${filter}`;
  const { data, loading, error, reload } = useApi<HodProposalPipeline>(path);
  const [active, setActive] = useState<TopicProposal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TopicProposal | null>(null);

  if (loading) return <Spinner label="Loading applicants..." />;
  if (error || !data) return <EmptyState message={error || "Unable to load"} />;

  const pending = data.proposals.filter((p) => p.status === "PENDING");
  const approved = data.proposals.filter((p) => p.status === "APPROVED");
  const rejected = data.proposals.filter((p) => p.status === "REJECTED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Topic Applicants{data.department ? ` — ${data.department}` : ""}
        </h1>
        <p className="text-sm text-slate-500">
          Students at the topic submission stage — not yet assigned supervisors. Similarity is
          checked against approved capstone topics and the department reference library only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending review" value={data.stats.pending} icon={<Clock size={20} />} accent="gold" />
        <StatCard label="Approved" value={data.stats.approved} icon={<CheckCircle2 size={20} />} accent="emerald" />
        <StatCard label="Rejected" value={data.stats.rejected} icon={<XCircle size={20} />} accent="crimson" />
        <StatCard label="Total submissions" value={data.stats.total} icon={<FileText size={20} />} accent="royal" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === f.value
                ? "bg-crimson-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {filter === "ALL" ? (
          <>
            <ProposalSection
              title="To be reviewed"
              subtitle={`${pending.length} applicant(s) awaiting your decision`}
              emptyMessage="No pending topic submissions."
              proposals={pending}
              onApprove={setActive}
              onReject={setRejectTarget}
            />
            <ProposalSection
              title="Approved"
              subtitle={`${approved.length} applicant(s) assigned to supervisors`}
              emptyMessage="No approved submissions yet."
              proposals={approved}
            />
            <ProposalSection
              title="Rejected"
              subtitle={`${rejected.length} applicant(s) notified by email`}
              emptyMessage="No rejected submissions."
              proposals={rejected}
            />
          </>
        ) : (
          <ProposalSection
            title={
              filter === "PENDING"
                ? "To be reviewed"
                : filter === "APPROVED"
                  ? "Approved"
                  : "Rejected"
            }
            subtitle={`${data.proposals.length} record(s)`}
            emptyMessage="No submissions in this category."
            proposals={data.proposals}
            onApprove={filter === "PENDING" ? setActive : undefined}
            onReject={filter === "PENDING" ? setRejectTarget : undefined}
          />
        )}

        {pending.length > 0 && (
          <Card className="border-gold-200 bg-gold-50">
            <p className="text-sm font-semibold text-gold-900">
              {pending.length} applicant(s) awaiting supervisor assignment
            </p>
            <p className="mt-1 text-xs text-gold-800">
              A score of 100% means the proposed title matches an approved or reference topic already on record.
            </p>
          </Card>
        )}
      </div>

      {active && (
        <ApproveModal
          proposal={active}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null);
            reload();
          }}
        />
      )}

      {rejectTarget && (
        <RejectModal
          proposal={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            setRejectTarget(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ProposalSection({
  title,
  subtitle,
  emptyMessage,
  proposals,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle: string;
  emptyMessage: string;
  proposals: TopicProposal[];
  onApprove?: (proposal: TopicProposal) => void;
  onReject?: (proposal: TopicProposal) => void;
}) {
  return (
    <section className="space-y-4">
      <SectionTitle title={title} subtitle={subtitle} />
      {proposals.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        proposals.map((p) => (
          <ProposalCard
            key={p.id}
            proposal={p}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))
      )}
    </section>
  );
}

function ProposalCard({
  proposal: p,
  onApprove,
  onReject,
}: {
  proposal: TopicProposal;
  onApprove?: (proposal: TopicProposal) => void;
  onReject?: (proposal: TopicProposal) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-slate-800">{p.fullName}</p>
          <p className="flex items-center gap-1 text-sm font-mono text-crimson-700">
            <Hash size={13} /> {p.registrationNumber}
          </p>
          <p className="text-sm text-slate-500">
            {p.program} · {p.email} · {timeAgo(p.createdAt)} · {formatDateTime(p.createdAt)}
          </p>
          {p.status === "PENDING" && (
            <p className="mt-1 text-xs text-slate-400">
              Supervisors: {p.supervisorChoice1?.fullName} (1st), {p.supervisorChoice2?.fullName} (2nd)
            </p>
          )}
        </div>
        <StatusBadge status={p.status} />
      </div>

      {p.status === "PENDING" && (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {p.topics.map((t) => (
            <div
              key={t.topicIndex}
              className={`rounded-xl border p-4 ${similarityClass(t.similarityLevel)}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide">
                  Option {t.topicIndex}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold">
                  {t.similarityLevel === "high" && <AlertTriangle size={12} />}
                  {t.similarityScore}% similar
                </span>
              </div>
              <p className="text-sm font-semibold">{t.topic}</p>
              <p className="mt-2 text-xs leading-relaxed opacity-90 line-clamp-4">{t.abstract}</p>
              {t.similarTo && (
                <p className="mt-2 text-xs font-medium opacity-90">
                  Closest match: {t.similarTo}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {p.status === "APPROVED" && p.selectedTopicIndex && (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-emerald-700">
            Approved topic option {p.selectedTopicIndex}
            {p.assignedSupervisor ? ` · Supervisor: ${p.assignedSupervisor.fullName}` : ""}
          </p>
          {p.topics[p.selectedTopicIndex - 1] && (
            <p className="text-sm font-medium text-slate-700">
              {p.topics[p.selectedTopicIndex - 1].topic}
            </p>
          )}
        </div>
      )}

      {p.status === "REJECTED" && (
        <div className="mt-3 space-y-2">
          {p.rejectionReason && (
            <p className="text-sm text-slate-600">Reason: {p.rejectionReason}</p>
          )}
          <div className="grid gap-2 lg:grid-cols-3">
            {p.topics.map((t) => (
              <div key={t.topicIndex} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Option {t.topicIndex}</p>
                <p className="mt-1 text-sm text-slate-700">{t.topic}</p>
                {t.similarTo && (
                  <p className="mt-1 text-xs text-slate-500">
                    {t.similarityScore}% similar to {t.similarTo}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {p.status === "PENDING" && onApprove && onReject && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary !py-2 text-xs" onClick={() => onApprove(p)}>
            Assign & approve
          </button>
          <button
            className="btn-outline !py-2 text-xs text-crimson-700"
            onClick={() => onReject(p)}
          >
            Reject
          </button>
        </div>
      )}
    </Card>
  );
}

function ApproveModal({
  proposal,
  onClose,
  onDone,
}: {
  proposal: TopicProposal;
  onClose: () => void;
  onDone: () => void;
}) {
  const [supervisors, setSupervisors] = useState<PublicSupervisor[]>([]);
  const [loadingSup, setLoadingSup] = useState(true);
  const [reg, setReg] = useState(proposal.registrationNumber);
  const [topicIndex, setTopicIndex] = useState(1);
  const [supervisorId, setSupervisorId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoadingSup(true);
    api
      .get<PublicSupervisor[]>(`/public/supervisors?department=${proposal.department}`)
      .then((res) => {
        setSupervisors(res.data);
        const preferred =
          res.data.find((s) => s.id === proposal.supervisorChoice1?.id) || res.data[0];
        if (preferred) setSupervisorId(String(preferred.id));
      })
      .finally(() => setLoadingSup(false));
  }, [proposal.department, proposal.supervisorChoice1?.id]);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.post(`/hod/topic-proposals/${proposal.id}/approve`, {
        registrationNumber: reg.trim(),
        selectedTopicIndex: topicIndex,
        supervisorId: Number(supervisorId),
      });
      onDone();
    } catch (e: unknown) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Approval failed"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-bold text-slate-800">Approve proposal</h3>
        <p className="text-sm text-slate-500">
          Creates a student portal for {proposal.fullName}. An approval email will be sent to{" "}
          {proposal.email}.
        </p>

        <label className="mb-1 mt-4 block text-sm font-medium text-slate-700">
          Registration number
        </label>
        <input className="input font-mono uppercase" value={reg} onChange={(e) => setReg(e.target.value.toUpperCase())} />

        <label className="mb-1 mt-4 block text-sm font-medium text-slate-700">Selected topic</label>
        <div className="space-y-2">
          {proposal.topics.map((t) => (
            <label
              key={t.topicIndex}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                topicIndex === t.topicIndex ? "border-crimson-500 bg-crimson-50" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="topic"
                checked={topicIndex === t.topicIndex}
                onChange={() => setTopicIndex(t.topicIndex)}
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{t.topic}</p>
                <p className="text-xs text-slate-500">
                  {t.similarityScore}% similar
                  {t.similarTo ? ` to “${t.similarTo}”` : " to existing topics"}
                </p>
              </div>
            </label>
          ))}
        </div>

        <label className="mb-1 mt-4 block text-sm font-medium text-slate-700">Assign supervisor</label>
        <select className="input" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} disabled={loadingSup}>
          {(supervisors || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.spotsAvailable} spots left)
            </option>
          ))}
        </select>

        {err && <p className="mt-3 text-sm text-crimson-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary flex items-center gap-1"
            onClick={submit}
            disabled={busy || !reg.trim()}
          >
            <CheckCircle2 size={16} />
            {busy ? "Assigning..." : "Assign & approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  proposal,
  onClose,
  onDone,
}: {
  proposal: TopicProposal;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/hod/topic-proposals/${proposal.id}/reject`, { reason: reason.trim() || undefined });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-bold text-slate-800">Reject proposal</h3>
        <p className="text-sm text-slate-500">
          {proposal.fullName} ({proposal.registrationNumber}) will receive a rejection email at{" "}
          {proposal.email}.
        </p>
        <textarea
          className="input mt-4 min-h-[90px] resize-none"
          placeholder="Optional reason for the student..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Sending..." : "Reject & notify student"}
          </button>
        </div>
      </div>
    </div>
  );
}
