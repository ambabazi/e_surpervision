export function parseApiError(err: unknown, fallback: string): string {
  const ax = err as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        detail?: string | { msg: string; loc?: (string | number)[] }[];
      };
    };
    message?: string;
  };

  if (!ax.response) {
    if (ax.message?.includes("timeout") || ax.code === "ECONNABORTED") {
      return "The server took too long to respond. On the free Render plan it may be waking up — wait a moment and try again.";
    }
    if (ax.message?.includes("Network Error")) {
      return "Cannot reach the server. Check VITE_API_URL ends with /api and redeploy Vercel.";
    }
    return fallback;
  }

  const { status, data } = ax.response;
  const detail = data?.detail;

  if (status === 404) {
    return (typeof detail === "string" ? detail : null) || "The requested resource was not found.";
  }

  if (typeof data?.message === "string" && data.message) {
    return data.message;
  }

  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const field = first.loc?.slice(-1)[0];
    return field ? `${field}: ${first.msg}` : first.msg;
  }

  return fallback;
}
