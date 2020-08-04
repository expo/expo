const consoleError = console.error;
export function catchErrorSilently(fn: Function) {
  try {
    console.error = () => {};
    fn();
  } catch (error) {
    return error;
  } finally {
    console.error = consoleError;
  }
}

export function withDEV(dev: boolean, fn: Function) {
  // @ts-ignore
  const prev = global.__DEV__;
  // @ts-ignore
  global.__DEV__ = dev;
  try {
    fn();
  } catch (e) {
    // @ts-ignore
    global.__DEV__ = prev;
    throw e;
  } finally {
    // @ts-ignore
    global.__DEV__ = prev;
  }
}
