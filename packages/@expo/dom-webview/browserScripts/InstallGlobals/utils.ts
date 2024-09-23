export function serializeArgs(args: any[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'object' && arg.sharedObjectId != null) {
        return `globalThis.expo.sharedObjectRegistry.get(${arg.sharedObjectId})`;
      }
      return JSON.stringify(arg);
    })
    .join(',');
}
