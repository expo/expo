import HMRClient from './HMRClient';

if (
  typeof window !== 'undefined' &&
  // @ts-expect-error: Added via react-native-webview
  typeof window.ReactNativeWebView !== 'undefined'
) {
  // Sets up developer tools for web platforms when running in a webview. This ensures that logs are visible in the terminal.
  // We assume full control over the console and send JavaScript logs to Metro.
  ['trace', 'info', 'warn', 'error', 'log', 'group', 'groupCollapsed', 'groupEnd', 'debug'].forEach(
    (level) => {
      const originalFunction = console[level];
      console[level] = function (...args: readonly any[]) {
        HMRClient.log(
          // @ts-expect-error
          level,
          args
        );
        originalFunction.apply(console, args);
      };
    }
  );
} else {
  HMRClient.log('log', [`[web] Logs will appear in the browser console`]);
}

// This is called native on native platforms
HMRClient.setup({ isEnabled: true });
