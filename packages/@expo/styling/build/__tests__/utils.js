import React from 'react';
import { View } from 'react-native';
import { cssToReactNativeRuntime } from '../css-to-rn';
import { defaultCSSInterop } from '../runtime/native/css-interop';
import { StyleSheet } from '../runtime/native/stylesheet';
export function registerCSS(css, options) {
    StyleSheet.register(cssToReactNativeRuntime(Buffer.from(css), options));
}
export function createMockComponent(Component = View) {
    const component = Object.assign(jest.fn((props, ref) => React.createElement(Component, { ref: ref, ...props })));
    const b = React.forwardRef(component);
    const componentWithRef = React.forwardRef((props, ref) => {
        return defaultCSSInterop((ComponentType, props, key) => {
            return React.createElement(ComponentType, { ref: ref, ...props, key: key });
        }, b, props, 'key', true);
    });
    Object.assign(componentWithRef, {
        component,
    });
    return componentWithRef;
}
//# sourceMappingURL=utils.js.map