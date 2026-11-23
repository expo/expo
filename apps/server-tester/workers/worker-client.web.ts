export function createWorker(): Worker | null {
  return new Worker(new URL('./worker-one', window.location.href));
}
