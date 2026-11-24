/** Native stand-in. Web workers only run on web. */
export function createWorker(): Worker | null {
  return null;
}

export function createAsyncImportsWorker(_options?: WorkerOptions): Worker | null {
  return null;
}
