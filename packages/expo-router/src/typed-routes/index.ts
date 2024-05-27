import { EXPO_ROUTER_CTX_IGNORE } from 'expo-router/_ctx-shared';
import fs from 'node:fs';
import path from 'node:path';

import { getTypedRoutesDeclarationFile } from './generate';
import { isTypedRoute } from '../matchers';
import requireContext, {
  RequireContextPonyFill,
} from '../testing-library/require-context-ponyfill';

const defaultCtx = requireContext(process.env.EXPO_ROUTER_APP_ROOT, true, EXPO_ROUTER_CTX_IGNORE);

export type { RequireContextPonyFill } from '../testing-library/require-context-ponyfill';

/**
 * Generate a Metro watch handler that regenerates the typed routes declaration file
 */
export function getWatchHandler(
  outputDir: string,
  { ctx = defaultCtx, regenerateFn = regenerateDeclarations } = {} // Exposed for testing
) {
  const routeFiles = new Set(ctx.keys().filter((key) => isTypedRoute(key)));

  return async function callback({ filePath, type }: { filePath: string; type: string }) {
    // Sanity check that we are in an Expo Router project
    if (!process.env.EXPO_ROUTER_APP_ROOT) return;

    let shouldRegenerate = false;
    let relativePath = path.relative(process.env.EXPO_ROUTER_APP_ROOT, filePath);
    const isInsideAppRoot = !relativePath.startsWith('../');
    const basename = path.basename(relativePath);

    if (!isInsideAppRoot) return;

    // require.context paths always start with './' when relative to the root
    relativePath = `./${relativePath}`;

    if (type === 'delete') {
      ctx.__delete(relativePath);
      if (routeFiles.has(relativePath)) {
        routeFiles.delete(relativePath);
        shouldRegenerate = true;
      }
    } else if (type === 'add') {
      ctx.__add(relativePath);
      if (isTypedRoute(basename)) {
        routeFiles.add(relativePath);
        shouldRegenerate = true;
      }
    } else {
      shouldRegenerate = routeFiles.has(relativePath);
    }

    if (shouldRegenerate) {
      regenerateFn(outputDir, ctx);
    }
  };
}

/**
 * A throttled function that regenerates the typed routes declaration file
 */
export const regenerateDeclarations = throttle(
  (outputDir: string, ctx: RequireContextPonyFill = defaultCtx) => {
    const file = getTypedRoutesDeclarationFile(ctx);
    if (!file) return;
    fs.writeFileSync(path.resolve(outputDir, './router.d.ts'), file);
  },
  100
);

/**
 * Throttles a function to only run once every `internal` milliseconds.
 * If called while waiting, it will run again after the timer has elapsed.
 */
function throttle<T extends (...args: any[]) => any>(fn: T, interval: number) {
  let timerId;
  let shouldRunAgain = false;
  return function run(...args: Parameters<T>) {
    if (timerId) {
      shouldRunAgain = true;
    } else {
      fn(...args);
      timerId = setTimeout(() => {
        timerId = null; // reset the timer so next call will be executed
        if (shouldRunAgain) {
          run(...args); // call the function again
        }
      }, interval);
    }
  };
}
