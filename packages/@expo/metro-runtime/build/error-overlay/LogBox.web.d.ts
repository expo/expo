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
declare let LogBox: ILogBox;
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
export default LogBox;
//# sourceMappingURL=LogBox.web.d.ts.map