export async function withTiming<T>(timerName: string, action: () => Promise<T>) {
  console.time(timerName);
  await action();
  console.timeEnd(timerName);
}
