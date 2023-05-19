import React from 'react';
import ReactJSXRuntime from 'react/jsx-runtime';
import { render } from './render';
export const Fragment = React.Fragment;
export function jsx(type, props, key) {
    return render(ReactJSXRuntime.jsx, type, props, key, true);
}
export function jsxs(type, props, key) {
    return render(ReactJSXRuntime.jsxs, type, props, key, true);
}
//# sourceMappingURL=jsx-runtime-experimental.js.map