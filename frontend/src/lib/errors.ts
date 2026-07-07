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
    if (ax.message?.includes("Network Error")) {
      return "Cannot reach the server. Check VITE_API_URL ends with /api and redeploy Vercel.";
    }
    return fallback;
  }

  const { status, data } = ax.response;
  if (status === 404) {
    return "API not found. Set VITE_API_URL to your Render URL with /api at the end.";
  }

  if (typeof data?.message === "string" && data.message) {
    return data.message;
  }

  const detail = data?.detail;
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
