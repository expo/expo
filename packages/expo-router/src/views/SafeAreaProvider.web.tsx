'use client';

import {
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaListener,
  type EdgeInsets,
  type Metrics,
  type Rect,
} from 'react-native-safe-area-context';

export type SafeAreaProviderProps = PropsWithChildren<{
  initialMetrics?: Metrics | null;
  style?: StyleProp<ViewStyle>;
}>;

const ZERO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const ZERO_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Web replacement for `SafeAreaProvider` from `react-native-safe-area-context`.
 *
 * The upstream provider seeds its state from `initialMetrics`, measures the DOM
 * in an effect, then calls `setState` with what it measured. Because the server
 * cannot know the viewport, `initialMetrics` on web is all zeros and the
 * measurement never matches it, so both safe area context values change right
 * after hydration.
 *
 * That is fatal to a page that streamed. React discards a `Suspense` boundary
 * it has not finished hydrating as soon as an ancestor context value changes:
 * `bailoutOnAlreadyFinishedWork` walks up, collects the changed providers,
 * walks back down and schedules the dehydrated boundary, and
 * `updateDehydratedSuspenseComponent` answers by calling
 * `retrySuspenseComponentWithoutHydrating`. The streamed HTML is thrown away
 * and re-rendered on the client, so anything only the server could produce is
 * lost. Deferring the change does not help, because expo emits the bootstrap
 * script with `defer` and hydration therefore starts after the stream has
 * already ended. The values have to be stable, not merely late.
 *
 * So the two values are handled differently:
 *
 * - The frame is measured from the window during the first client render, so
 *   it is correct before hydration begins and never changes afterwards. This
 *   is the value that always differed, since the SSR seed is a zero rect.
 *   Seeding it cannot cause a hydration mismatch because nothing renders it
 *   during SSR; expo-router has no `useSafeAreaFrame` callers.
 * - The insets keep the SSR value through hydration, because SSR markup does
 *   depend on them and a different first render would be a mismatch. A browser
 *   with no safe area measures zero, which is what the server rendered, so
 *   there is no change at all. A browser that does have one changes once,
 *   after the stream, which is both necessary and correct.
 */
export function SafeAreaProvider({ children, initialMetrics, style }: SafeAreaProviderProps) {
  // Matches the upstream provider, which falls back to a parent provider's
  // values before its own defaults.
  const parentInsets = useContext(SafeAreaInsetsContext);
  const parentFrame = useContext(SafeAreaFrameContext);

  const [insets, setInsets] = useState<EdgeInsets>(
    initialMetrics?.insets ?? parentInsets ?? ZERO_INSETS
  );
  const [frame, setFrame] = useState<Rect>(
    () => measureFrame() ?? initialMetrics?.frame ?? parentFrame ?? ZERO_FRAME
  );

  // Set once the document has finished streaming and React has finished
  // hydrating. Until then, measured insets are buffered rather than applied.
  const settled = useRef(false);
  const buffered = useRef<EdgeInsets | null>(null);

  const applyInsets = useCallback((next: EdgeInsets) => {
    setInsets((current) => (isSameInsets(current, next) ? current : next));
  }, []);

  // The library reports a frame measured from its own wrapper view, which is
  // not the value seeded above. Only the insets are taken from it.
  const onChange = useCallback(
    (metrics: Metrics) => {
      if (settled.current) {
        applyInsets(metrics.insets);
      } else {
        buffered.current = metrics.insets;
      }
    },
    [applyInsets]
  );

  useEffect(() => {
    const onResize = () => {
      const next = measureFrame();
      if (next) {
        setFrame((current) => (isSameFrame(current, next) ? current : next));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let handle: number | undefined;

    const settle = () => {
      // Idle work runs after React has flushed its hydration render, so a
      // change lands once every streamed boundary has hydrated.
      handle = requestIdle(() => {
        if (cancelled) {
          return;
        }
        settled.current = true;
        const pending = buffered.current;
        buffered.current = null;
        if (pending) {
          applyInsets(pending);
        }
      });
    };

    // `loading` means the HTML stream is still open, so boundaries may still be
    // dehydrated. Leaving it is the stream ending, which is earlier than `load`
    // and does not wait on images or other subresources.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', settle, { once: true });
    } else {
      settle();
    }

    return () => {
      cancelled = true;
      document.removeEventListener('DOMContentLoaded', settle);
      cancelIdle(handle);
    };
  }, [applyInsets]);

  return (
    <SafeAreaListener style={style} onChange={onChange}>
      <SafeAreaFrameContext.Provider value={frame}>
        <SafeAreaInsetsContext.Provider value={insets}>{children}</SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    </SafeAreaListener>
  );
}

/**
 * The window-sized frame the library reports when it cannot measure its own
 * wrapper view. Returns `null` on the server, where there is nothing to measure.
 */
function measureFrame(): Rect | null {
  if (typeof document === 'undefined' || !document.documentElement) {
    return null;
  }
  return {
    x: 0,
    y: 0,
    width: document.documentElement.offsetWidth,
    height: document.documentElement.offsetHeight,
  };
}

function isSameInsets(a: EdgeInsets, b: EdgeInsets) {
  return a.top === b.top && a.bottom === b.bottom && a.left === b.left && a.right === b.right;
}

function isSameFrame(a: Rect, b: Rect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// Give up waiting for an idle period on a permanently busy page, rather than
// leaving the insets at the server's values forever.
const IDLE_TIMEOUT_MS = 2000;

function requestIdle(callback: () => void): number {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
  }
  return setTimeout(callback, 0) as unknown as number;
}

function cancelIdle(handle: number | undefined) {
  if (handle === undefined) {
    return;
  }
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}
