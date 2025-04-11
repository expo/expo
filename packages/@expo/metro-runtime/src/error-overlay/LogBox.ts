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

const LogBox: ILogBox = {
  install(): void {
    // Do nothing.
  },

  uninstall(): void {
    // Do nothing.
  },

  isInstalled(): boolean {
    return false;
  },

  ignoreLogs(_patterns: readonly IgnorePattern[]): void {
    // Do nothing.
  },

  ignoreAllLogs(_value?: boolean): void {
    // Do nothing.
  },

  clearAllLogs(): void {
    // Do nothing.
  },

  addLog(_log: LogData): void {
    // Do nothing.
  },

  addException(_ex: ExtendedExceptionData): void {
    // Do nothing.
  },
};

export default LogBox;
