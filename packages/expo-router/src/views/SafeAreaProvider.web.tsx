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

const ZERO_INSETS: EdgeInsets = { top: 0, left: 0, right: 0, bottom: 0 };
const ZERO_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Web replacement for `SafeAreaProvider` from `react-native-safe-area-context`.
 *
 * The upstream provider seeds its state from `initialMetrics`, measures the DOM
 * in an effect, then calls `setState` with what it measured. On web that
 * measurement always differs from the SSR seed, because the server cannot know
 * the viewport, so both safe area context values change right after hydration.
 *
 * That change is destructive while the page is still streaming. When React
 * bails out of a subtree it calls `propagateParentContextChanges`, which walks
 * to the root, collects every provider whose value changed, then walks back
 * down and schedules work on every dehydrated `Suspense` boundary it finds.
 * `updateDehydratedSuspenseComponent` responds by calling
 * `retrySuspenseComponentWithoutHydrating`, which throws away the streamed HTML
 * and re-renders the boundary on the client. Anything the server streamed is
 * lost, and a promise that only resolves on the server never resolves again.
 *
 * Shadowing the upstream contexts with deferred copies does not help. React
 * collects changed providers by walking to the root, and ignores intermediate
 * providers that shadow the same context, so the upstream state change still
 * reaches the boundaries. The state has to live here instead.
 *
 * So this owns the metrics state, holds the SSR values through hydration, and
 * applies the first measurement only once the document has finished streaming.
 * `SafeAreaListener` renders the same `NativeSafeAreaProvider` wrapper the
 * upstream provider does, so the server markup is unchanged.
 */
export function SafeAreaProvider({ children, initialMetrics, style }: SafeAreaProviderProps) {
  // Matches the upstream provider, which falls back to a parent provider's
  // values before its own defaults.
  const parentInsets = useContext(SafeAreaInsetsContext);
  const parentFrame = useContext(SafeAreaFrameContext);

  const [insets, setInsets] = useState<EdgeInsets>(
    initialMetrics?.insets ?? parentInsets ?? ZERO_INSETS
  );
  const [frame, setFrame] = useState<Rect>(initialMetrics?.frame ?? parentFrame ?? ZERO_FRAME);

  // Set once the document has finished streaming and React has finished
  // hydrating. Until then measurements are buffered rather than applied.
  const settled = useRef(false);
  const buffered = useRef<Metrics | null>(null);

  const apply = useCallback((metrics: Metrics) => {
    setInsets((current) => (isSameInsets(current, metrics.insets) ? current : metrics.insets));
    setFrame((current) => (isSameFrame(current, metrics.frame) ? current : metrics.frame));
  }, []);

  const onChange = useCallback(
    (metrics: Metrics) => {
      if (settled.current) {
        apply(metrics);
      } else {
        buffered.current = metrics;
      }
    },
    [apply]
  );

  useEffect(() => {
    let cancelled = false;
    let handle: number | undefined;

    const settle = () => {
      // Idle work runs after React has flushed its hydration render, so the
      // context update lands once every streamed boundary has hydrated.
      handle = requestIdle(() => {
        if (cancelled) {
          return;
        }
        settled.current = true;
        const pending = buffered.current;
        buffered.current = null;
        if (pending) {
          apply(pending);
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
  }, [apply]);

  return (
    <SafeAreaListener style={style} onChange={onChange}>
      <SafeAreaFrameContext.Provider value={frame}>
        <SafeAreaInsetsContext.Provider value={insets}>{children}</SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    </SafeAreaListener>
  );
}

function isSameInsets(a: EdgeInsets, b: EdgeInsets) {
  return a.top === b.top && a.bottom === b.bottom && a.left === b.left && a.right === b.right;
}

function isSameFrame(a: Rect, b: Rect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// Give up waiting for an idle period on a permanently busy page, rather than
// leaving the insets at zero forever.
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
