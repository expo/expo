import React from 'react';

import { renderInShadowRoot } from './utils/renderInShadowRoot';

if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
  // Stack traces are big with React Navigation
  // TODO: Can this be part of the `setupLogBox` hook? Or do we need install early?
  require('./LogBox').default.install();
}

let isInstalled = false;

export function setupLogBox(): void {
  if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
    if (isInstalled) {
      return undefined;
    }

    const ErrorToast = require('./toast/ErrorToast')
      .default as typeof import('./toast/ErrorToast').default;

    renderInShadowRoot('error-toast', React.createElement(ErrorToast));
    isInstalled = true;
  }
}
