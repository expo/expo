export function createDebug(prefix: string) {
  return function debug(message: string, ...args: unknown[]) {
    if (process.env.EXPO_DEBUG === '1' || process.env.EXPO_DEBUG === 'true') {
      console.log(`${prefix} ${message}`, ...args);
    }
  };
}
