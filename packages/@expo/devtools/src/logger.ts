let enableLogging = false;

export function log(...params: Parameters<typeof console.log>) {
  if (enableLogging) {
    console.log(...params);
  }
}

export function debug(...params: Parameters<typeof console.debug>) {
  if (enableLogging) {
    console.debug(...params);
  }
}

export function info(...params: Parameters<typeof console.info>) {
  if (enableLogging) {
    console.info(...params);
  }
}

export function warn(...params: Parameters<typeof console.info>) {
  if (enableLogging) {
    console.warn(...params);
  }
}

export function setEnableLogging(enabled: boolean) {
  enableLogging = enabled;
}
