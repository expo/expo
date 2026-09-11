import type { Metrics } from 'react-native-safe-area-context';

const ZERO_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/**
 * Web has no `initialWindowMetrics`, so this measures what the web
 * `SafeAreaProvider` will measure on mount. Seeding it keeps it stable through
 * hydration; unstable values cause a re-render which drops streamed `Suspense`
 * boundaries that are still pending. Values are set to zero on the server or
 * when measuring fails.
 *
 * @privateRemarks This is pretty hacky and subject to change in the next
 * version of `react-native-safe-area-context`
 *
 * @see https://github.com/AppAndFlow/react-native-safe-area-context/blob/e0b35d24cfe72812f5d32e4576195693abbcda20/src/NativeSafeAreaProvider.web.tsx#L36
 */
export function getInitialSafeAreaMetrics(): Metrics {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !document.body) {
    return ZERO_METRICS;
  }

  try {
    const element = document.createElement('div');
    const { style } = element;
    style.position = 'fixed';
    style.left = '0';
    style.top = '0';
    style.width = '0';
    style.height = '0';
    style.zIndex = '-1';
    style.overflow = 'hidden';
    style.visibility = 'hidden';
    const env = getSupportedEnv();
    style.paddingTop = `${env}(safe-area-inset-top)`;
    style.paddingBottom = `${env}(safe-area-inset-bottom)`;
    style.paddingLeft = `${env}(safe-area-inset-left)`;
    style.paddingRight = `${env}(safe-area-inset-right)`;
    document.body.appendChild(element);
    const { paddingTop, paddingBottom, paddingLeft, paddingRight } =
      window.getComputedStyle(element);
    document.body.removeChild(element);

    return {
      insets: {
        top: paddingTop ? parseInt(paddingTop, 10) : 0,
        bottom: paddingBottom ? parseInt(paddingBottom, 10) : 0,
        left: paddingLeft ? parseInt(paddingLeft, 10) : 0,
        right: paddingRight ? parseInt(paddingRight, 10) : 0,
      },
      frame: {
        x: 0,
        y: 0,
        width: document.documentElement.offsetWidth,
        height: document.documentElement.offsetHeight,
      },
    };
  } catch {
    return ZERO_METRICS;
  }
}

function getSupportedEnv(): 'constant' | 'env' {
  const { CSS } = window;
  return CSS?.supports?.('top: constant(safe-area-inset-top)') ? 'constant' : 'env';
}
