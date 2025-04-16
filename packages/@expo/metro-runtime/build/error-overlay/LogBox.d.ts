/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { IgnorePattern, LogData } from './Data/LogBoxData';
import { type ExtendedExceptionData } from './Data/parseLogBoxLog';
export { ExtendedExceptionData, IgnorePattern, LogData };
declare const LogBox: {
    install(): void;
    uninstall(): void;
    ignoreLogs(patterns: IgnorePattern[]): void;
    ignoreAllLogs(value?: boolean): void;
    clearAllLogs(): void;
    addLog(log: LogData): void;
    addException(error: ExtendedExceptionData): void;
};
export default LogBox;
//# sourceMappingURL=LogBox.d.ts.map