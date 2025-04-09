import type { IgnorePattern, LogData } from './Data/LogBoxData';
import { type ExtendedExceptionData } from './Data/parseLogBoxLog';
export { LogData, ExtendedExceptionData, IgnorePattern };
declare const LogBox: {
    install(): void;
    uninstall(): void;
    isInstalled(): boolean;
    ignoreLogs(patterns: IgnorePattern[]): void;
    ignoreAllLogs(value?: boolean): void;
    clearAllLogs(): void;
    addLog(log: LogData): void;
    addException(error: ExtendedExceptionData): void;
};
export default LogBox;
//# sourceMappingURL=LogBox.d.ts.map