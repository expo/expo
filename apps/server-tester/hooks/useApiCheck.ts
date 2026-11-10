import { useEffect, useState } from 'react';

export interface ApiRequest {
  method: string;
  path: string;
  body?: unknown;
}

export type ApiCheckResult = { status: number; body: unknown } | { error: string };

export function useApiCheck(request: ApiRequest): ApiCheckResult | null {
  const [result, setResult] = useState<ApiCheckResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    sendApiRequest(request).then((value) => {
      if (!cancelled) setResult(value);
    });
    return () => {
      cancelled = true;
    };
  }, [request]);

  return result;
}

async function sendApiRequest(request: ApiRequest): Promise<ApiCheckResult> {
  try {
    const response = await fetch(request.path, {
      method: request.method,
      headers: request.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
    });
    return { status: response.status, body: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
