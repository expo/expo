/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const currentSrc =
  typeof document !== 'undefined' && document.currentScript
    ? ('src' in document.currentScript && document.currentScript.src) || null
    : null;

// Basically `__webpack_require__.l`.
export function fetchThenEvalAsync(
  url: string,
  {
    scriptType,
    nonce,
    crossOrigin,
  }: { scriptType?: string; nonce?: string; crossOrigin?: string } = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    return require('./fetchThenEvalJs').fetchThenEvalAsync(url);
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    if (scriptType) script.type = scriptType;
    if (nonce) script.setAttribute('nonce', nonce);
    // script.setAttribute('data-expo-metro', ...);
    script.src = url;

    if (crossOrigin && script.src.indexOf(window.location.origin + '/') !== 0) {
      script.crossOrigin = crossOrigin;
    }

    script.onload = () => {
      script.parentNode && script.parentNode.removeChild(script);
      resolve();
    };
    // Create a new error object to preserve the original stack trace.
    const error = new AsyncRequireError();

    // Server error or network error.
    script.onerror = (ev) => {
      let event: Event;
      if (typeof ev === 'string') {
        event = {
          type: 'error',
          target: {
            // @ts-expect-error
            src: event,
          },
        };
      } else {
        event = ev;
      }

      const errorType = event && (event.type === 'load' ? 'missing' : event.type);
      // @ts-expect-error
      const realSrc = event?.target?.src;
      error.message = 'Loading module ' + url + ' failed.\n(' + errorType + ': ' + realSrc + ')';
      error.type = errorType;
      error.request = realSrc;

      script.parentNode && script.parentNode.removeChild(script);
      reject(error);
    };

    if (script.src === currentSrc) {
      // NOTE(kitten): We always prevent `fetchThenEval` from loading the "current script".
      // This points at our entrypoint bundle, and we should never reload and reevaluate the
      // entrypoint bundle
      resolve();
    } else {
      document.head.appendChild(script);
    }
  });
}

class AsyncRequireError extends Error {
  readonly name = 'AsyncRequireError';
  type?: string;
  request?: string;
}
