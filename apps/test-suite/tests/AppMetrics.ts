import AppMetrics, {
  type LogRecord,
  type Metric,
  type NetworkRequestCompletedEvent,
  type NetworkRequestFilter,
  type NetworkRequestObserver,
  type NetworkRequestStartedEvent,
} from 'expo-app-metrics';
import { fetch } from 'expo/fetch';

export const name = 'AppMetrics';

const TEST_HOST = 'https://httpbin.io';
const TEST_HOSTNAME = 'httpbin.io';
const EVENT_TIMEOUT_MS = 5_000;

type EventCapture = {
  started: NetworkRequestStartedEvent[];
  completed: NetworkRequestCompletedEvent[];
};

/**
 * Subscribes to a fresh `NetworkRequestObserver` and returns the capture buffer plus a teardown
 * function. The buffer is populated as events fire on the native side. Filters by URL so tests
 * don't see events from unrelated background traffic. Pass a native `filter` to exercise the
 * native-side filtering; it is applied on top of (before) the JS `filterUrl` predicate.
 */
function captureEvents(
  filterUrl: (url: string) => boolean,
  filter?: NetworkRequestFilter | null
): {
  capture: EventCapture;
  observer: NetworkRequestObserver;
  release: () => void;
} {
  const observer = new AppMetrics.NetworkRequestObserver(filter);
  const capture: EventCapture = { started: [], completed: [] };

  const startedSub = observer.addListener('requestStarted', (event) => {
    if (filterUrl(event.url)) {
      capture.started.push(event);
    }
  });
  const completedSub = observer.addListener('requestCompleted', (event) => {
    if (filterUrl(event.url)) {
      capture.completed.push(event);
    }
  });

  return {
    capture,
    observer,
    release: () => {
      startedSub.remove();
      completedSub.remove();
      // Drop the SharedObject too so the native delegate slot is reclaimed deterministically
      // — otherwise we'd leak one observer instance per test until JS GC eventually fires
      // `sharedObjectWillRelease`.
      observer.release();
    },
  };
}

/**
 * Waits until a `requestCompleted` event lands in the capture buffer. With a `url`, waits for a
 * completion matching that URL specifically; otherwise waits for any completion.
 */
async function waitForCompletion(
  capture: EventCapture,
  url?: string,
  timeoutMs = EVENT_TIMEOUT_MS
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (url ? capture.completed.some((event) => event.url === url) : capture.completed.length > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const target = url ? `requestCompleted for ${url}` : 'requestCompleted event';
  throw new Error(`Timed out after ${timeoutMs}ms waiting for ${target}`);
}

/**
 * Polls `read` until `predicate` is satisfied or the timeout elapses, returning the value that
 * satisfied it. `logEvent` and `addMetric` are fire-and-forget on the JS side — the native write
 * lands on a background actor/coroutine before the SQLite store reflects it — so reads have to be
 * retried rather than asserted immediately after the write.
 */
async function pollUntil<T>(
  read: () => Promise<T>,
  predicate: (value: T) => boolean,
  description: string,
  timeoutMs = EVENT_TIMEOUT_MS
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: T;
  do {
    last = await read();
    if (predicate(last)) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  throw new Error(`Timed out after ${timeoutMs}ms waiting for ${description}`);
}

/**
 * Generates a label unique to this test run so a query can pick out the records it just wrote,
 * ignoring anything left in the on-device store from earlier runs or background activity. The
 * store is shared and not cleared between tests (`clearStoredEntries` is a no-op on iOS), so every
 * assertion has to be scoped this way.
 */
function uniqueLabel(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function test({ describe, expect, it, afterEach }) {
  describe('getMainSession', () => {
    it('returns a non-null main session with the documented shape', () => {
      const session = AppMetrics.getMainSession();
      expect(session).toBeDefined();
      expect(typeof session.id).toBe('string');
      expect(session.id.length).toBeGreaterThan(0);
      expect(session.type).toBe('main');
      expect(session.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('returns the same shared object on repeated calls', () => {
      // The native side hands back the process-lifetime singleton, so the JS handles must be
      // identity-equal while the object stays referenced.
      expect(AppMetrics.getMainSession()).toBe(AppMetrics.getMainSession());
    });

    it('reports the main session as active', async () => {
      const session = AppMetrics.getMainSession();
      expect(await session.isActive()).toBe(true);
      // An active session has no end date yet.
      expect(await session.getEndDate()).toBeNull();
    });
  });

  describe('addMetric', () => {
    it('records a custom metric and reads it back with the session id filled in', async () => {
      const session = AppMetrics.getMainSession();
      const name = uniqueLabel('custom-metric');

      // `category` is a closed enum on the native side; an unknown string is dropped to `null`
      // (see `SessionMetricInput` native tests). `navigation` is one of the categories supported on
      // both iOS and Android.
      await session.addMetric({
        timestamp: new Date().toISOString(),
        category: 'navigation',
        name,
        value: 42,
      });

      // `addMetric` resolves only after the native write completes, so a plain read sees it — no
      // polling needed (unlike `logEvent`, which is fire-and-forget).
      const metrics = await session.getMetrics();
      const recorded = metrics.find((metric) => metric.name === name) as Metric;
      expect(recorded).toBeDefined();
      expect(recorded.value).toBe(42);
      expect(recorded.category).toBe('navigation');
      // `MetricInput` omits `sessionId`; the receiver supplies it.
      expect(recorded.sessionId).toBe(session.id);
    });

    it('preserves custom params on the recorded metric', async () => {
      const session = AppMetrics.getMainSession();
      const name = uniqueLabel('custom-metric-params');

      await session.addMetric({
        timestamp: new Date().toISOString(),
        category: 'navigation',
        name,
        value: 1,
        params: { screen: 'home', count: 3 },
      });

      const metrics = await session.getMetrics();
      const recorded = metrics.find((metric) => metric.name === name) as Metric;
      expect(recorded).toBeDefined();
      expect(recorded.params).toBeDefined();
      expect(recorded.params!.screen).toBe('home');
      expect(recorded.params!.count).toBe(3);
    });
  });

  describe('logEvent', () => {
    /** Reads back the log this run wrote, polling until the async store reflects it. */
    async function readBackLog(name: string): Promise<LogRecord> {
      const session = AppMetrics.getMainSession();
      const logs = await pollUntil(
        () => session.getLogs(),
        (all) => all.some((log) => log.name === name),
        `log "${name}" to appear in getLogs()`
      );
      return logs.find((log) => log.name === name) as LogRecord;
    }

    it('records a log event and reads it back with all documented fields', async () => {
      const name = uniqueLabel('log');
      AppMetrics.logEvent(name, {
        body: 'hello from test-suite',
        severity: 'warn',
        attributes: { feature: 'app-metrics', retries: 2, enabled: true },
      });

      const log = await readBackLog(name);
      expect(log.name).toBe(name);
      expect(log.body).toBe('hello from test-suite');
      expect(log.severity).toBe('warn');
      expect(typeof log.timestamp).toBe('string');
      expect(log.attributes).toBeDefined();
      expect(log.attributes!.feature).toBe('app-metrics');
      expect(log.attributes!.retries).toBe(2);
      expect(log.attributes!.enabled).toBe(true);
    });

    it('defaults severity to "info" when none is provided', async () => {
      const name = uniqueLabel('log-default-severity');
      AppMetrics.logEvent(name);

      const log = await readBackLog(name);
      expect(log.severity).toBe('info');
    });
  });

  describe('setGlobalAttributes', () => {
    // Globals are process-wide; clear them after each case so one test can't leak into the next.
    afterEach(() => {
      AppMetrics.setGlobalAttributes(null);
    });

    async function readBackLog(name: string): Promise<LogRecord> {
      const session = AppMetrics.getMainSession();
      const logs = await pollUntil(
        () => session.getLogs(),
        (all) => all.some((log) => log.name === name),
        `log "${name}" to appear in getLogs()`
      );
      return logs.find((log) => log.name === name) as LogRecord;
    }

    it('merges global attributes into a subsequently logged event', async () => {
      AppMetrics.setGlobalAttributes({ subscription_tier: 'pro', experiment_variant: 'B' });
      const name = uniqueLabel('log-globals');
      AppMetrics.logEvent(name, { attributes: { local_key: 'local_value' } });

      const log = await readBackLog(name);
      expect(log.attributes).toBeDefined();
      expect(log.attributes!.subscription_tier).toBe('pro');
      expect(log.attributes!.experiment_variant).toBe('B');
      // Per-record attributes coexist with the globals.
      expect(log.attributes!.local_key).toBe('local_value');
    });

    it('lets a per-record attribute win over a global with the same key', async () => {
      AppMetrics.setGlobalAttributes({ source: 'global' });
      const name = uniqueLabel('log-globals-collision');
      AppMetrics.logEvent(name, { attributes: { source: 'local' } });

      const log = await readBackLog(name);
      expect(log.attributes!.source).toBe('local');
    });

    it('stops applying globals after they are cleared', async () => {
      AppMetrics.setGlobalAttributes({ cleared_key: 'present' });
      AppMetrics.setGlobalAttributes(null);

      const name = uniqueLabel('log-globals-cleared');
      AppMetrics.logEvent(name);

      const log = await readBackLog(name);
      expect(log.attributes?.cleared_key).toBeUndefined();
    });
  });

  describe('NetworkRequestObserver', () => {
    it('emits requestStarted with the documented field shape', async () => {
      const url = `${TEST_HOST}/get?case=started-shape`;
      const { capture, release } = captureEvents((u) => u === url);
      try {
        await fetch(url);
        await waitForCompletion(capture);

        expect(capture.started.length).toBe(1);
        const started = capture.started[0];
        expect(typeof started.id).toBe('string');
        expect(started.url).toBe(url);
        expect(started.method).toBe('GET');
        expect(typeof started.startedAt).toBe('string');
        // ISO 8601 in UTC, truncated to whole seconds.
        expect(started.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      } finally {
        release();
      }
    });

    it('emits requestCompleted with all documented fields and a matching id', async () => {
      const url = `${TEST_HOST}/get?case=completed-shape`;
      const { capture, release } = captureEvents((u) => u === url);
      try {
        await fetch(url);
        await waitForCompletion(capture);

        expect(capture.completed.length).toBe(1);
        const completed = capture.completed[0];
        const started = capture.started[0];

        expect(completed.id).toBe(started.id);
        expect(completed.url).toBe(url);
        expect(completed.method).toBe('GET');
        expect(completed.statusCode).toBe(200);
        // Wire protocol is platform-dependent — assert non-null/string only.
        expect(
          typeof completed.networkProtocol === 'string' || completed.networkProtocol === null
        ).toBe(true);
        expect(typeof completed.requestBytesSent).toBe('number');
        expect(typeof completed.responseBytesReceived).toBe('number');
        expect(completed.errorDescription).toBeNull();
        expect(completed.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(completed.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(typeof completed.totalDuration).toBe('number');
        expect(completed.totalDuration).toBeGreaterThan(0);
        expect(Array.isArray(completed.redirects)).toBe(true);
        expect(completed.redirects.length).toBe(0);
      } finally {
        release();
      }
    });

    it('captures the redirect chain on the completed event', async () => {
      // httpbin.io's `/redirect-to?url=...` returns a single 302 to the target URL.
      const target = `${TEST_HOST}/get?case=redirect-target`;
      const url = `${TEST_HOST}/redirect-to?url=${encodeURIComponent(target)}`;
      const { capture, release } = captureEvents((u) => u === url || u === target);
      try {
        await fetch(url);
        await waitForCompletion(capture);

        // One logical fetch → one completion event observed at the caller-supplied URL.
        const completed = capture.completed.find((event) => event.url === url);
        expect(completed).toBeDefined();
        expect(completed!.statusCode).toBe(200);
        expect(completed!.redirects.length).toBe(1);
        expect(completed!.redirects[0].fromUrl).toBe(url);
        expect(completed!.redirects[0].toUrl).toBe(target);
        expect(completed!.redirects[0].statusCode).toBeGreaterThanOrEqual(300);
        expect(completed!.redirects[0].statusCode).toBeLessThan(400);
      } finally {
        release();
      }
    });

    it('does not emit events after the observer is released', async () => {
      const beforeUrl = `${TEST_HOST}/get?case=before-release`;
      const afterUrl = `${TEST_HOST}/get?case=after-release`;
      const { capture, release } = captureEvents((u) => u === beforeUrl || u === afterUrl);

      await fetch(beforeUrl);
      await waitForCompletion(capture);
      expect(capture.completed.length).toBe(1);

      // Tears down both the JS listeners and the SharedObject itself. After this, the native
      // monitor must drop its weak delegate slot and no further events should reach our buffer.
      release();

      await fetch(afterUrl);
      // Give a stray event time to land if cleanup is broken.
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      expect(capture.completed.filter((event) => event.url === afterUrl).length).toBe(0);
      expect(capture.started.filter((event) => event.url === afterUrl).length).toBe(0);
    });

    it('skips requests that opt out via the Expo-AppMetrics-Skip header', async () => {
      const url = `${TEST_HOST}/get?case=opt-out`;
      const { capture, release } = captureEvents((u) => u === url);
      try {
        await fetch(url, { headers: { 'Expo-AppMetrics-Skip': '1' } });
        // No deterministic event to wait for — give the native side a window to (incorrectly)
        // record before asserting the buffer is empty.
        await new Promise((resolve) => setTimeout(resolve, 1_500));
        expect(capture.started.length).toBe(0);
        expect(capture.completed.length).toBe(0);
      } finally {
        release();
      }
    });

    describe('filtering', () => {
      it('emits only requests matching the hosts filter', async () => {
        const matchingUrl = `${TEST_HOST}/get?case=hosts-match`;
        const { capture, release } = captureEvents((u) => u === matchingUrl, {
          hosts: [TEST_HOSTNAME],
        });
        try {
          await fetch(matchingUrl);
          await waitForCompletion(capture);
          expect(capture.completed.length).toBe(1);
          expect(capture.completed[0].url).toBe(matchingUrl);
          expect(capture.started.length).toBe(1);
        } finally {
          release();
        }
      });

      it('drops requests whose host is not in the hosts filter', async () => {
        const url = `${TEST_HOST}/get?case=hosts-miss`;
        const { capture, release } = captureEvents((u) => u === url, {
          hosts: ['some-other-host.example.com'],
        });
        try {
          await fetch(url);
          // No matching event will ever arrive — wait a window, then assert nothing leaked through.
          await new Promise((resolve) => setTimeout(resolve, 1_500));
          expect(capture.started.length).toBe(0);
          expect(capture.completed.length).toBe(0);
        } finally {
          release();
        }
      });

      it('emits only requests matching the methods filter', async () => {
        const postUrl = `${TEST_HOST}/post?case=methods-post`;
        const getUrl = `${TEST_HOST}/get?case=methods-get`;
        const { capture, release } = captureEvents((u) => u === postUrl || u === getUrl, {
          methods: ['POST'],
        });
        try {
          await fetch(getUrl);
          await fetch(postUrl, { method: 'POST' });
          await waitForCompletion(capture, postUrl);
          // Only the POST passes the filter; the GET is dropped natively.
          expect(capture.completed.map((event) => event.url)).toEqual([postUrl]);
          expect(capture.completed.every((event) => event.method === 'POST')).toBe(true);
        } finally {
          release();
        }
      });

      it('combines hosts and methods with AND', async () => {
        const postUrl = `${TEST_HOST}/post?case=combined-post`;
        const getUrl = `${TEST_HOST}/get?case=combined-get`;
        const { capture, release } = captureEvents((u) => u === postUrl || u === getUrl, {
          hosts: [TEST_HOSTNAME],
          methods: ['POST'],
        });
        try {
          await fetch(getUrl);
          await fetch(postUrl, { method: 'POST' });
          await waitForCompletion(capture, postUrl);
          // Host matches both, but only the POST satisfies the method constraint.
          expect(capture.completed.map((event) => event.url)).toEqual([postUrl]);
        } finally {
          release();
        }
      });

      it('emits every request when the filter is empty', async () => {
        const url = `${TEST_HOST}/get?case=empty-filter`;
        const { capture, release } = captureEvents((u) => u === url, {});
        try {
          await fetch(url);
          await waitForCompletion(capture);
          expect(capture.completed.length).toBe(1);
        } finally {
          release();
        }
      });

      it('applies a filter set at runtime via setFilter', async () => {
        const beforeUrl = `${TEST_HOST}/get?case=set-filter-before`;
        const afterUrl = `${TEST_HOST}/get?case=set-filter-after`;
        const { capture, observer, release } = captureEvents(
          (u) => u === beforeUrl || u === afterUrl
        );
        try {
          // Starts unfiltered: the first request is observed.
          await fetch(beforeUrl);
          await waitForCompletion(capture);
          expect(capture.completed.length).toBe(1);

          // Narrow to a host that doesn't match; the next request must be dropped. `setFilter` is
          // applied before the fetch is issued, and the request's full network round-trip dwarfs
          // the time the native side needs to apply the filter, so it's in effect by the time the
          // request is recorded.
          observer.setFilter({ hosts: ['some-other-host.example.com'] });
          await fetch(afterUrl);
          await new Promise((resolve) => setTimeout(resolve, 1_500));
          expect(capture.completed.filter((event) => event.url === afterUrl).length).toBe(0);

          // Clearing the filter resumes observing everything.
          observer.setFilter(null);
          const lastUrl = `${TEST_HOST}/get?case=set-filter-cleared`;
          const cleared = captureEvents((u) => u === lastUrl);
          try {
            await fetch(lastUrl);
            await waitForCompletion(cleared.capture);
            expect(cleared.capture.completed.length).toBe(1);
          } finally {
            cleared.release();
          }
        } finally {
          release();
        }
      });
    });
  });

  describe('error handler', () => {
    // `installErrorHandler` ran on import, wrapping `global.ErrorUtils`. The end-to-end test drives
    // the native `reportError` path with a non-fatal error and reads the recorded `exception` log
    // event back from the main session. (A fatal error can't be round-tripped in-process: it goes to
    // the file sink and is ingested on the next launch — see the native `PendingErrorStore` tests.)
    // A separate test drives the installed global handler to cover the JS wrapper's forwarding logic.
    //
    // The event follows OpenTelemetry's exception-in-logs convention: event name `exception`, with
    // `exception.type` / `exception.message` / `exception.stacktrace` attributes, plus `expo.error.*`
    // for the bits OTel has no field for (capture source, fatal flag).
    async function waitForExceptionLog(
      predicate: (log: LogRecord) => boolean,
      timeoutMs = EVENT_TIMEOUT_MS
    ): Promise<LogRecord> {
      const session = AppMetrics.getMainSession();
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const logs = await session.getLogs();
        const match = logs.find((log) => log.name === 'exception' && predicate(log));
        if (match) {
          return match;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error(`Timed out after ${timeoutMs}ms waiting for the exception log event`);
    }

    it('installs by wrapping the global ErrorUtils handler', () => {
      // The handler is installed when expo-app-metrics is imported, so a global handler is present.
      expect(typeof ErrorUtils.getGlobalHandler()).toBe('function');
    });

    // Only non-fatal errors are readable via `getLogs` in-process: the fatal path writes to the file
    // sink and is ingested on the next launch, so it can't be round-tripped here. Fatal persistence is
    // covered by the native `PendingErrorStore` write/drain tests.
    it('records a non-fatal error as an exception log event with OTel attributes', async () => {
      const message = `test-suite error ${Date.now()}`;
      AppMetrics.reportError({
        source: 'global',
        type: 'TypeError',
        message,
        stacktrace: 'onPress@index.bundle:42:7',
        isFatal: false,
      });

      const log = await waitForExceptionLog(
        (entry) => (entry.attributes ?? {})['exception.message'] === message
      );
      expect(log.severity).toBe('error');

      const attributes = log.attributes ?? {};
      expect(attributes['exception.type']).toBe('TypeError');
      expect(attributes['exception.message']).toBe(message);
      expect(attributes['exception.stacktrace']).toBe('onPress@index.bundle:42:7');
      expect(attributes['expo.error.source']).toBe('global');
      expect(attributes['expo.error.is_fatal']).toBe(false);
    });

    it('forwards an error from the installed global handler', () => {
      // Exercise the JS wrapper itself (forward + raw stack) by driving the handler that
      // `installErrorHandler` registered on import, with `reportError` stubbed to capture what it
      // forwards. A non-fatal error is used so chaining to React Native's real handler only surfaces
      // a dev console warning rather than a red box.
      const installedHandler = ErrorUtils.getGlobalHandler();
      const originalReportError = AppMetrics.reportError;
      const reported: Parameters<typeof AppMetrics.reportError>[0][] = [];
      AppMetrics.reportError = (error) => {
        reported.push(error);
      };
      try {
        const error = new Error('installed-handler forward');
        installedHandler(error, false);

        expect(reported.length).toBe(1);
        expect(reported[0].source).toBe('global');
        expect(reported[0].type).toBe('Error');
        expect(reported[0].message).toBe('installed-handler forward');
        expect(reported[0].isFatal).toBe(false);
        // The wrapper forwards the raw engine stack string unchanged.
        expect(reported[0].stacktrace).toBe(error.stack);
      } finally {
        AppMetrics.reportError = originalReportError;
      }
    });
  });
}
