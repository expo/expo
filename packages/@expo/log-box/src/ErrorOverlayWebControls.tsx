import React from 'react';

import { withActions } from './ContextActions';
import * as LogBoxData from './Data/LogBoxData';
import { renderInShadowRoot } from './utils/renderInShadowRoot';

let currentRoot: ReturnType<typeof renderInShadowRoot> | null = null;

export function presentGlobalErrorOverlay() {
  if (currentRoot) {
    return;
  }

  const { LogBoxInspectorContainer } =
    require('./overlay/Overlay') as typeof import('./overlay/Overlay');
  const ErrorOverlay = LogBoxData.withSubscription(
    withActions(LogBoxInspectorContainer, {
      onMinimize: () => {
        LogBoxData.setSelectedLog(-1);
        LogBoxData.setSelectedLog(-1);
      },
      onReload: () => {
        window.location.reload();
      },
      onCopyText: (text: string) => {
        navigator.clipboard.writeText(text);
      },
    })
  );

  currentRoot = renderInShadowRoot('error-overlay', React.createElement(ErrorOverlay));
}

export function dismissGlobalErrorOverlay() {
  currentRoot?.unmount();
  currentRoot = null;
}
