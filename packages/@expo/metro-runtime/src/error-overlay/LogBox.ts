/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IgnorePattern, LogData } from './Data/LogBoxData';
import * as LogBoxData from './Data/LogBoxData';
import { type ExtendedExceptionData } from './Data/parseLogBoxLog';
import { parseLogBoxLog } from './Data/parseLogBoxLog';

export { ExtendedExceptionData, IgnorePattern, LogData };

/**
 * LogBox displays logs in the app.
 */

let originalConsoleError: typeof console.error | undefined;
let consoleErrorImpl: typeof console.error | undefined;

let isLogBoxInstalled: boolean = false;

const LogBox = {
  install(): void {
    if (isLogBoxInstalled) {
      return;
    }

    isLogBoxInstalled = true;

    // Trigger lazy initialization of module.
    // require("../NativeModules/specs/NativeLogBox");

    // IMPORTANT: we only overwrite `console.error` and `console.warn` once.
    // When we uninstall we keep the same reference and only change its
    // internal implementation
    const isFirstInstall = originalConsoleError == null;
    if (isFirstInstall) {
      originalConsoleError = console.error.bind(console);

      console.error = (...args) => {
        consoleErrorImpl?.(...args);
      };
    }

    consoleErrorImpl = consoleErrorMiddleware;

    if (process.env.NODE_ENV === 'test') {
      LogBoxData.setDisabled(true);
    }
  },

  uninstall(): void {
    if (!isLogBoxInstalled) {
      return;
    }

    isLogBoxInstalled = false;

    // IMPORTANT: we don't re-assign to `console` in case the method has been
    // decorated again after installing LogBox. E.g.:
    // Before uninstalling: original > LogBox > OtherErrorHandler
    // After uninstalling:  original > LogBox (noop) > OtherErrorHandler
    consoleErrorImpl = originalConsoleError;
    delete (console as any).disableLogBox;
  },

  ignoreLogs(patterns: IgnorePattern[]): void {
    LogBoxData.addIgnorePatterns(patterns);
  },

  ignoreAllLogs(value?: boolean): void {
    LogBoxData.setDisabled(value == null ? true : value);
  },

  clearAllLogs(): void {
    LogBoxData.clear();
  },

  addLog(log: LogData): void {
    if (isLogBoxInstalled) {
      LogBoxData.addLog(log);
    }
  },

  addException(error: ExtendedExceptionData): void {
    if (isLogBoxInstalled) {
      LogBoxData.addException(error);
    }
  },
};

function consoleErrorMiddleware(...args: Parameters<typeof console.error>): void {
  // Let errors within LogBox itself fall through.
  // TODO: Drop this in favor of a more generalized tagging solution.
  if (LogBoxData.isLogBoxErrorMessage(args[0])) {
    originalConsoleError?.(...args);
    return;
  }

  const { category, message, componentStack } = parseLogBoxLog(args);

  if (LogBoxData.isMessageIgnored(message.content)) {
    return;
  }

  // NOTE: Unlike React Native, we'll just pass the logs directly to the console
  originalConsoleError?.(...args);

  // Interpolate the message so they are formatted for adb and other CLIs.
  // This is different than the message.content above because it includes component stacks.
  // const interpolated = parseInterpolation(args);
  // originalConsoleError?.(interpolated.message.content);

  LogBoxData.addLog({
    // Always show the static rendering issues as full screen since they
    // are too confusing otherwise.
    // TODO: We can change this with a collection of improvements from React 19.1.
    level: /did not match\. Server:/.test(message.content) ? 'fatal' : 'error',
    category,
    message,
    componentStack,
  });
}

export default LogBox;
