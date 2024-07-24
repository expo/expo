import { IgnorePattern, LogData } from './Data/LogBoxData';
import { ExtendedExceptionData } from './Data/parseLogBoxLog';
export { LogData, ExtendedExceptionData, IgnorePattern };
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
declare const LogBox: ILogBox;
export default LogBox;
//# sourceMappingURL=LogBox.d.ts.map