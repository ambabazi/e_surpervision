import { useApi } from "@/lib/useApi";
import { Avatar, Card, EmptyState, Spinner } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { Feedback } from "@/types";

export default function StudentFeedback() {
  const { data, loading, error } = useApi<Feedback[]>("/student/feedback");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Supervisor Feedback</h1>
        <p className="text-sm text-slate-500">
          All feedback and reviews from your supervisor in one place.
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState message={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="No feedback received yet." />
      ) : (
        <div className="space-y-4">
          {data.map((fb) => (
            <Card key={fb.id}>
              <div className="flex items-start gap-4">
                <Avatar name={fb.author?.fullName} src={fb.author?.avatarUrl} size={44} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-800">{fb.title || "Feedback"}</p>
                      <p className="text-xs text-slate-500">
                        {fb.author?.fullName} · {timeAgo(fb.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{fb.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
