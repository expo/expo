import fs from 'node:fs';
import path from 'node:path';

import { getTypedRoutesDeclarationFile } from './generate';
import { ctx } from '../../_ctx';
import { isTypedRoutesFilename } from '../matchers';

export function getWatchHandler(outputDir: string) {
  const routeFiles = new Set(ctx.keys().filter((key) => isTypedRoutesFilename(key)));

  return async function callback({ filePath, type }: { filePath: string; type: string }) {
    let shouldRegenerate = false;

    if (type === 'delete') {
      if (routeFiles.has(filePath)) {
        routeFiles.delete(filePath);
        shouldRegenerate = true;
      }
    } else if (type === 'add') {
      shouldRegenerate = isTypedRoutesFilename(filePath);
    } else {
      shouldRegenerate = routeFiles.has(filePath);
    }

    if (shouldRegenerate) {
      regenerateDeclarations(outputDir);
    }
  };
}

export const regenerateDeclarations = throttle((outputDir: string) => {
  const file = getTypedRoutesDeclarationFile(ctx);
  if (!file) return;
  fs.writeFileSync(path.resolve(outputDir, './router.d.ts'), file);
}, 100);

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
