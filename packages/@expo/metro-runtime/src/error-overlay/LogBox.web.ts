/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IgnorePattern, LogData } from './Data/LogBoxData';
import { ExtendedExceptionData } from './Data/parseLogBoxLog';

export { LogData, ExtendedExceptionData, IgnorePattern };

let LogBox: ILogBox;

interface ILogBox {
  install(): void;
  uninstall(): void;
  isInstalled(): boolean;
  ignoreLogs(patterns: readonly IgnorePattern[]): void;
  ignoreAllLogs(ignore?: boolean): void;
  clearAllLogs(): void;
  addLog(log: LogData): void;
  addException(error: ExtendedExceptionData): void;
}

/**
 * LogBox displays logs in the app.
 */
if (__DEV__) {
  const LogBoxData = require('./Data/LogBoxData');
  const { parseLogBoxLog, parseInterpolation } =
    require('./Data/parseLogBoxLog') as typeof import('./Data/parseLogBoxLog');

  let originalConsoleError: typeof console.error | undefined;
  let consoleErrorImpl: typeof console.error | undefined;

  let isLogBoxInstalled: boolean = false;

  LogBox = {
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

      consoleErrorImpl = registerError;

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

    isInstalled(): boolean {
      return isLogBoxInstalled;
    },

    ignoreLogs(patterns: readonly IgnorePattern[]): void {
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

  const isWarningModuleWarning = (...args: any) => {
    return typeof args[0] === 'string' && args[0].startsWith('Warning: ');
  };

  const registerError = (...args: Parameters<typeof console.error>): void => {
    // Let errors within LogBox itself fall through.
    if (LogBoxData.isLogBoxErrorMessage(args[0])) {
      originalConsoleError?.(...args);
      return;
    }

    try {
      if (!isWarningModuleWarning(...args)) {
        // Only show LogBox for the 'warning' module, otherwise pass through.
        // By passing through, this will get picked up by the React console override,
        // potentially adding the component stack. React then passes it back to the
        // React Native ExceptionsManager, which reports it to LogBox as an error.
        //
        // The 'warning' module needs to be handled here because React internally calls
        // `console.error('Warning: ')` with the component stack already included.
        originalConsoleError?.(...args);
        return;
      }

      const { category, message, componentStack } = parseLogBoxLog(args);

      if (!LogBoxData.isMessageIgnored(message.content)) {
        // Interpolate the message so they are formatted for adb and other CLIs.
        // This is different than the message.content above because it includes component stacks.
        const interpolated = parseInterpolation(args);
        originalConsoleError?.(interpolated.message.content);

        LogBoxData.addLog({
          // Always show the static rendering issues as full screen since they
          // are too confusing otherwise.
          level: /did not match\. Server:/.test(message.content) ? 'fatal' : 'error',
          category,
          message,
          componentStack,
        });
      }
    } catch (err) {
      LogBoxData.reportUnexpectedLogBoxError(err);
    }
  };
} else {
  LogBox = {
    install(): void {},
    uninstall(): void {},
    isInstalled(): boolean {
      return false;
    },
    ignoreLogs(_patterns: readonly IgnorePattern[]): void {},
    ignoreAllLogs(_value?: boolean): void {},
    clearAllLogs(): void {},
    addLog(_log: LogData): void {},
    addException(_ex: ExtendedExceptionData): void {},
  };
}

export default LogBox;
