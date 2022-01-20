import ProgressBar from 'progress';

let _bundleProgressBar: ProgressBar | null = null;
export function setProgressBar(bar: ProgressBar | null) {
  _bundleProgressBar = bar;
}

export function getProgressBar(): ProgressBar | null {
  return _bundleProgressBar;
}
