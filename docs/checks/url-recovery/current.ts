import { randomUUID } from 'node:crypto';

import type { recoverNotFoundAsync } from '../../worker/url-recovery.ts';
import type { EvalCase, EvalResult } from './report.ts';

export type Page = { path: string; title: string; description: string };
type Environment = Parameters<typeof recoverNotFoundAsync>[1];
type Call = {
  input: unknown;
  response?: unknown;
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  model: string | null;
  error?: string;
};

function tokenCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

export async function evaluateCurrentAsync(
  testCase: EvalCase,
  pages: Page[],
  gatewayUrl: string,
  prices: { input: number; output: number } | null
): Promise<EvalResult> {
  // A fresh module prevents the production cache and failure backoff from contaminating other cases.
  const { recoverNotFoundAsync: recover } = (await import(
    `${new URL('../../worker/url-recovery.ts', import.meta.url).href}?eval=${randomUUID()}`
  )) as typeof import('../../worker/url-recovery.ts');
  const paths = new Set(pages.map(page => page.path));
  const calls: Call[] = [];
  const errors: string[] = [];
  let deadline: number | undefined;
  const env: Environment = {
    ASSETS: {
      async fetch(input) {
        const pathname = new URL(input instanceof Request ? input.url : input).pathname;
        if (pathname === '/_url-recovery.json') {
          return Response.json(pages);
        }
        return new Response(null, {
          status: paths.has(pathname) ? 200 : 404,
          headers: { 'Content-Type': 'text/html' },
        });
      },
    },
    AI: {
      async run(model, input, options) {
        deadline ??= Date.now() + 3000;
        const start = performance.now();
        const call: Call = {
          input,
          durationMs: 0,
          inputTokens: null,
          outputTokens: null,
          model: null,
        };
        calls.push(call);
        try {
          const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              input,
              gateway: options.gateway,
              timeoutMs: Math.max(1, deadline - Date.now()),
            }),
            signal: options.signal,
          });
          const body = (await response.json()) as {
            result?: { state?: string; result?: unknown; model?: unknown; usage?: unknown };
            error?: string;
          };
          if (!response.ok) {
            throw new Error(body.error ?? `AI request returned ${response.status}`);
          }
          call.response = body.result;
          const provider = (
            body.result?.state === 'Completed' ? body.result.result : body.result
          ) as {
            model?: unknown;
            usage?: { input_tokens?: unknown; output_tokens?: unknown };
          } | null;
          call.inputTokens = tokenCount(provider?.usage?.input_tokens);
          call.outputTokens = tokenCount(provider?.usage?.output_tokens);
          call.model = typeof provider?.model === 'string' ? provider.model : null;
          return body.result;
        } catch (error) {
          call.error = error instanceof Error ? error.message : String(error);
          errors.push(call.error);
          throw error;
        } finally {
          call.durationMs = performance.now() - start;
        }
      },
    },
  };
  const warn = console.warn;
  // Production deliberately swallows failures. Capture its diagnostic while this serial case runs.
  console.warn = (...args: unknown[]) => {
    if (args[0] === 'URL recovery failed:') {
      errors.push(args.slice(1).join(' '));
    } else {
      warn(...args);
    }
  };
  const start = performance.now();
  let predictedPath: string | null = null;
  try {
    const response = await recover(
      new Request(`https://docs.expo.dev${testCase.path}`),
      env,
      false
    );
    const location = response?.headers.get('Location');
    if (location) {
      predictedPath = new URL(location).pathname;
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    console.warn = warn;
  }
  const durationMs = performance.now() - start;
  const sum = (key: 'inputTokens' | 'outputTokens') =>
    calls.every(call => call[key] !== null)
      ? calls.reduce((total, call) => total + (call[key] ?? 0), 0)
      : null;
  const inputTokens = sum('inputTokens');
  const outputTokens = sum('outputTokens');
  return {
    ...testCase,
    predictedPath,
    status: errors.length ? 'error' : 'ok',
    durationMs,
    calls: calls.length,
    inputTokens,
    outputTokens,
    cost:
      prices && inputTokens !== null && outputTokens !== null
        ? (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000
        : null,
    model: [...new Set(calls.map(call => call.model).filter(Boolean))].join(', ') || null,
    ...(errors.length ? { error: [...new Set(errors)].join('; ') } : {}),
    trace: calls,
  };
}
