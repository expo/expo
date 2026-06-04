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
      HMRClient.log(level, level === 'error' ? addErrorStacks(args) : args);
      originalFunction.apply(console, args);
    };
  });

  window.addEventListener('error', (event) => {
    HMRClient.log('error', addErrorStacks([event.error]));
  });

  window.addEventListener('unhandledrejection', (event) => {
    HMRClient.log('error', addErrorStacks([event.reason]));
  });
}

// This is called native on native platforms
HMRClient.setup({ isEnabled: true });

function addErrorStacks(data: unknown[]) {
  const dataWithStacks = [...data];
  let hasStack = false;
  data.forEach((item) => {
    if (hasStringKey(item, 'stack')) {
      hasStack = true;
      dataWithStacks.push(item.stack);
    }
  });

  const stack = captureCurrentStack();
  if (!hasStack && typeof stack === 'string') {
    dataWithStacks.push(stack);
  }

  const react = require('react') as typeof React;
  const componentStack = react.captureOwnerStack?.();
  if (componentStack) {
    dataWithStacks.push(componentStack);
  }

  return dataWithStacks;
}

function hasStringKey(obj: unknown, key: string): obj is { [key: string]: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    key in obj &&
    typeof (obj as Record<string, unknown>)[key] === 'string'
  );
}

class NamelessError extends Error {
  name = '';
}

function captureCurrentStack() {
  return new NamelessError().stack;
}
