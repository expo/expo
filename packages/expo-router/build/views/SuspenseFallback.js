import React from 'react';
import { Toast, ToastWrapper } from './Toast';
export function SuspenseFallback({ route }) {
    if (__DEV__) {
        return (<ToastWrapper>
        <Toast filename={route?.contextKey}>Bundling...</Toast>
      </ToastWrapper>);
    }
    // TODO: Support user's customizing the fallback.
    return null;
}
//# sourceMappingURL=SuspenseFallback.js.map