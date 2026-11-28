/** Native stand-in. Web workers only run on web. */
export function createWorker(): Worker | null {
  return null;
}
