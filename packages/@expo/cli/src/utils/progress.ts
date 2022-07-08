import ProgressBar from 'progress';

let currentProgress: ProgressBar | null = null;

export function setProgressBar(bar: ProgressBar | null): void {
  currentProgress = bar;
}

export function getProgressBar(): ProgressBar | null {
  return currentProgress;
}

export function createProgressBar(barFormat: string, options: ProgressBar.ProgressBarOptions) {
  if (process.stderr.clearLine == null) {
    return null;
  }

  const bar = new ProgressBar(barFormat, options);

  const logReal = console.log;
  const infoReal = console.info;
  const warnReal = console.warn;
  const errorReal = console.error;

  const wrapNativeLogs = (): void => {
    // @ts-expect-error
    console.log = (...args: any) => bar.interrupt(...args);
    // @ts-expect-error
    console.info = (...args: any) => bar.interrupt(...args);
    // @ts-expect-error
    console.warn = (...args: any) => bar.interrupt(...args);
    // @ts-expect-error
    console.error = (...args: any) => bar.interrupt(...args);
  };

  const resetNativeLogs = (): void => {
    console.log = logReal;
    console.info = infoReal;
    console.warn = warnReal;
    console.error = errorReal;
  };

  const originalTerminate = bar.terminate.bind(bar);
  bar.terminate = () => {
    resetNativeLogs();
    setProgressBar(null);
    originalTerminate();
  };

  wrapNativeLogs();
  setProgressBar(bar);
  return bar;
}
