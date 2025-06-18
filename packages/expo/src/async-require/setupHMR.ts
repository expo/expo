import HMRClient from './hmr';

if (
  typeof window !== 'undefined' &&
  // @ts-expect-error: Added via react-native-webview
  typeof window.ReactNativeWebView !== 'undefined'
) {
  // Sets up developer tools for web platforms when running in a webview. This ensures that logs are visible in the terminal.
  // We assume full control over the console and send JavaScript logs to Metro.
  const LEVELS = [
    'trace',
    'info',
    'warn',
    'error',
    'log',
    'group',
    'groupCollapsed',
    'groupEnd',
    'debug',
  ] as const;
  LEVELS.forEach((level) => {
    const originalFunction = console[level];
    console[level] = function (...args: any[]) {
      HMRClient.log(level, args);
      originalFunction.apply(console, args);
    };
  });
  HMRClient.log('log', [`[webview] Logs will also appear in the Safari/Chrome debug console`]);
} else {
  HMRClient.log('log', [`[web] Logs will appear in the browser console`]);
}

// This is called native on native platforms
HMRClient.setup({ isEnabled: true });
