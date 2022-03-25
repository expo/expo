import ProgressBar from 'progress';

let currentProgress: ProgressBar | null = null;

export function setProgressBar(bar: ProgressBar | null): void {
  currentProgress = bar;
}

export function getProgressBar(): ProgressBar | null {
  return currentProgress;
}
