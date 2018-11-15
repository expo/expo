export default function sleepAsync(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}
