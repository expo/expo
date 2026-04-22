import React from 'react';
import { Toast, ToastWrapper } from './Toast';
export function SuspenseFallback({ route }) {
    if (__DEV__) {
        return (<ToastWrapper>
        <Toast filename={route}>Bundling...</Toast>
      </ToastWrapper>);
    }
    return null;
}
//# sourceMappingURL=SuspenseFallback.js.map