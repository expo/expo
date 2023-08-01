import React from 'react';
import { Toast, ToastWrapper } from './Toast';
export function SuspenseFallback({ route }) {
    return (React.createElement(ToastWrapper, null,
        React.createElement(Toast, { filename: route?.contextKey }, "Bundling...")));
}
//# sourceMappingURL=SuspenseFallback.js.map