import React from 'react';
import { Toast, ToastWrapper } from './Toast';
import { useRouteNode } from '../Route';
export function EmptyRoute() {
    const route = useRouteNode();
    return (React.createElement(ToastWrapper, null,
        React.createElement(Toast, { warning: true, filename: route?.contextKey }, "Missing default export")));
}
//# sourceMappingURL=EmptyRoute.js.map