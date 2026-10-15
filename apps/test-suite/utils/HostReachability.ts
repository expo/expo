import type { JasmineInterface } from '../types';

export type HostReachabilityOptions = {
  /**
   * How long a single probe request may take before it is aborted.
   */
  timeoutMs?: number;
  /**
   * How many times the probe is attempted before the host is considered unreachable.
   */
  attempts?: number;
};

/**
 * The subset of the Jasmine interface the gate needs. Callers that destructure `describe` and `it`
 * out of the interface can pass them back in together with `pending`.
 */
export type HostGateJasmine = Pick<JasmineInterface, 'describe' | 'it' | 'pending'>;

/**
 * `describe` and `it` replacements that register the real specs when the probed host answered,
 * and a single pending spec naming the host when it did not.
 */
export type HostGate = {
  reachable: boolean;
  describe: JasmineInterface['describe'];
  it: JasmineInterface['it'];
};

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_ATTEMPTS = 2;

const reachabilityByProbeUrl = new Map<string, Promise<boolean>>();

/**
 * Probes `probeUrl` with a GET request and resolves to `true` when it answers with a 2xx status.
 * The result is cached per URL for the lifetime of the JS context, so several test modules that
 * depend on the same host share one probe. Unreachable hosts are reported once with `console.warn`.
 */
export function isHostReachableAsync(
  probeUrl: string,
  options: HostReachabilityOptions = {}
): Promise<boolean> {
  let pending = reachabilityByProbeUrl.get(probeUrl);
  if (!pending) {
    pending = probeAsync(probeUrl, options);
    reachabilityByProbeUrl.set(probeUrl, pending);
  }
  return pending;
}

/**
 * Probes the host behind `probeUrl` and returns `describe` and `it` to register specs that need
 * it. When the host is unreachable, gated blocks collapse into one pending spec so the run still
 * completes and the skip stays visible in the report.
 */
export async function gateOnHostAsync(
  t: HostGateJasmine,
  probeUrl: string,
  options: HostReachabilityOptions = {}
): Promise<HostGate> {
  const reachable = await isHostReachableAsync(probeUrl, options);
  if (reachable) {
    return { reachable, describe: t.describe, it: t.it };
  }
  const host = hostOf(probeUrl);
  const reason = `${host} is unreachable, skipping specs that depend on it`;
  const pendingSpec = () => {
    t.pending(reason);
  };
  return {
    reachable,
    describe(description) {
      t.describe(description, () => {
        t.it(`skipped: ${host} is unreachable`, pendingSpec);
      });
    },
    it(expectation) {
      t.it(expectation, pendingSpec);
    },
  };
}

/**
 * Clears the cached probe results. Only meant for unit tests of this module.
 */
export function resetHostReachabilityCache() {
  reachabilityByProbeUrl.clear();
}

async function probeAsync(probeUrl: string, options: HostReachabilityOptions): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
  let lastFailure = 'no response';
  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(probeUrl, { method: 'GET', signal: controller.signal });
      if (response.ok) {
        return true;
      }
      lastFailure = `HTTP ${response.status}`;
    } catch (error) {
      lastFailure = controller.signal.aborted
        ? `no response within ${timeoutMs}ms`
        : String((error as Error)?.message ?? error);
    } finally {
      clearTimeout(timer);
    }
  }
  console.warn(
    `[test-suite] ${hostOf(probeUrl)} is unreachable (${lastFailure} after ${attempts} attempt(s)), skipping specs that depend on it.`
  );
  return false;
}

function hostOf(url: string): string {
  const match = url.match(/^[a-z]+:\/\/([^/?#]+)/i);
  return match ? match[1] : url;
}
