import { fetch } from 'expo/fetch';
import AppMetrics, {
  type NetworkRequestCompletedEvent,
  type NetworkRequestObserver,
  type NetworkRequestStartedEvent,
} from 'expo-app-metrics';

export const name = 'AppMetrics';

const TEST_HOST = 'https://httpbin.io';
const EVENT_TIMEOUT_MS = 5_000;

type EventCapture = {
  started: NetworkRequestStartedEvent[];
  completed: NetworkRequestCompletedEvent[];
};

/**
 * Subscribes to a fresh `NetworkRequestObserver` and returns the capture buffer plus a teardown
 * function. The buffer is populated as events fire on the native side. Filters by URL so tests
 * don't see events from unrelated background traffic.
 */
function captureEvents(filterUrl: (url: string) => boolean): {
  capture: EventCapture;
  observer: NetworkRequestObserver;
  release: () => void;
} {
  const observer = new AppMetrics.NetworkRequestObserver();
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

async function waitForCompletion(
  capture: EventCapture,
  timeoutMs = EVENT_TIMEOUT_MS
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (capture.completed.length > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for requestCompleted event`);
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
  });
}
