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

  ignoreLogs(patterns: readonly IgnorePattern[]): void {
    // Do nothing.
  },

  ignoreAllLogs(value?: boolean): void {
    // Do nothing.
  },

  clearAllLogs(): void {
    // Do nothing.
  },

  addLog(log: LogData): void {
    // Do nothing.
  },

  addException(ex: ExtendedExceptionData): void {
    // Do nothing.
  },
};

export default LogBox;
