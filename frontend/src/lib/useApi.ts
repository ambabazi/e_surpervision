import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!url) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    api
      .get<T>(url)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        const data = err?.response?.data;
        const detail = data?.detail;
        const message =
          data?.message ||
          (typeof detail === "string" ? detail : null) ||
          (err?.response?.status === 404 ? "This feature is not available on the server yet. Deploy the latest backend." : null) ||
          "Failed to load data";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
