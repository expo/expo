export function createWorker() {
  return new Worker(new URL('./worker-one', window.location.href));
}
