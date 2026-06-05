import type * as React from 'react';

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
      HMRClient.log(level, level === 'error' ? addErrorStacks(args, true) : args);
      originalFunction.apply(console, args);
    };
  });

  window.addEventListener('error', (event) => {
    // Not capturing current stack as it would only point to this function,
    // the stack chain is preserved by the browser.
    HMRClient.log('error', addErrorStacks([event.error]));
  });

  window.addEventListener('unhandledrejection', (event) => {
    // Not capturing current stack as it would only point to this function,
    // the stack chain is preserved by the browser.
    HMRClient.log('error', addErrorStacks([event.reason]));
  });
}

// This is called native on native platforms
HMRClient.setup({ isEnabled: true });

function addErrorStacks(data: unknown[], shouldCaptureCurrentStack = false) {
  const dataWithStacks = [...data];
  let hasStack = false;
  data.forEach((item) => {
    // on native handled in packages/@expo/metro-runtime/src/metroServerLogs.native.ts
    // https://github.com/expo/expo/blob/118528654c982b6df2f4b3e73bbf2ae0b78d84a2/packages/%40expo/metro-runtime/src/metroServerLogs.native.ts#L30
    // this differs from native implementation where error from native modules
    // would not pass instanceof Error check
    if (item instanceof Error && item.stack) {
      hasStack = true;
      dataWithStacks.push(item.stack);
    }
  });

  if (!hasStack && shouldCaptureCurrentStack) {
    // for console.* to point to the call site
    const stack = captureCurrentStack();
    if (typeof stack === 'string') {
      dataWithStacks.push(stack);
    }
  }

  const react = require('react') as typeof React;
  const componentStack = react.captureOwnerStack?.();
  if (componentStack) {
    dataWithStacks.push(componentStack);
  }

  return dataWithStacks;
}

class NamelessError extends Error {
  name = '';
}

function captureCurrentStack() {
  // If you're reading this, look deeper into the call stack to find the actual error source.
  return new NamelessError().stack;
}
