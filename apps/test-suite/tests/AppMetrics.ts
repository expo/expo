import { fetch } from 'expo/fetch';
import AppMetrics, {
  type NetworkRequestCompletedEvent,
  type NetworkRequestFilter,
  type NetworkRequestObserver,
  type NetworkRequestStartedEvent,
} from 'expo-app-metrics';

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

export function test({ describe, expect, it, beforeAll }) {
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
}
