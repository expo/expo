export function createWorker(): Worker | null {
  return new Worker(new URL('./worker-one', window.location.href));
}

export function createAsyncImportsWorker(): Worker | null {
  return new Worker(new URL('./worker-async', window.location.href));
}
