import HMRClient from './HMRClient';

// Sets up developer tools for React Native web.
// We assume full control over the console and send JavaScript logs to Metro.
// [
//   'trace',
//   'info',
//   'warn',
//   'error',
//   'log',
//   'group',
//   'groupCollapsed',
//   'groupEnd',
//   'debug',
// ].forEach(level => {
//   const originalFunction = console[level];
//   console[level] = function (...args: readonly any[]) {
//     HMRClient.log(
//       // @ts-expect-error
//       level, args);
//     originalFunction.apply(console, args);
//   };
// });

HMRClient.log('log', [`[web] Logs will appear in the browser console`]);

// This is called native on native platforms
HMRClient.setup({ isEnabled: true });
