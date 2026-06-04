import HMRClient from './hmr';

if (typeof window !== 'undefined') {
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

  window.addEventListener('error', (event) => {
    HMRClient.log('error', [event.error]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    HMRClient.log('error', [event.reason]);
  });
}

// This is called native on native platforms
HMRClient.setup({ isEnabled: true });
