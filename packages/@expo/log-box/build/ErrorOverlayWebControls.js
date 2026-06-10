import React from 'react';
import { withActions } from './ContextActions';
import * as LogBoxData from './Data/LogBoxData';
import { renderInShadowRoot } from './utils/renderInShadowRoot';
let currentRoot = null;
export function presentGlobalErrorOverlay() {
    if (currentRoot) {
        return;
    }
    const { LogBoxInspectorContainer } = require('./overlay/Overlay');
    const ErrorOverlay = LogBoxData.withSubscription(withActions(LogBoxInspectorContainer, {
        onMinimize: () => {
            LogBoxData.setSelectedLog(-1);
            LogBoxData.setSelectedLog(-1);
        },
        onReload: () => {
            window.location.reload();
        },
        onCopyText: (text) => {
            navigator.clipboard.writeText(text);
        },
    }));
    currentRoot = renderInShadowRoot('error-overlay', React.createElement(ErrorOverlay));
}
export function dismissGlobalErrorOverlay() {
    currentRoot?.unmount();
    currentRoot = null;
}
//# sourceMappingURL=ErrorOverlayWebControls.js.map