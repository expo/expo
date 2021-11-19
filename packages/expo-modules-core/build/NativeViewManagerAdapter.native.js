import React from 'react';
import { NativeModules, UIManager, ViewPropTypes, requireNativeComponent } from 'react-native';
// To make the transition from React Native's `requireNativeComponent` to Expo's
// `requireNativeViewManager` as easy as possible, `requireNativeViewManager` is a drop-in
// replacement for `requireNativeComponent`.
//
// For each view manager, we create a wrapper component that accepts all of the props available to
// the author of the universal module. This wrapper component splits the props into two sets: props
// passed to React Native's View (ex: style, testID) and custom view props, which are passed to the
// adapter view component in a prop called `proxiedProperties`.
// NOTE: React Native is moving away from runtime PropTypes and may remove ViewPropTypes, in which
// case we will need another way to separate standard React Native view props from other props,
// which we proxy through the adapter
const ViewPropTypesKeys = Object.keys(ViewPropTypes);
/**
 * A drop-in replacement for `requireNativeComponent`.
 */
export function requireNativeViewManager(viewName) {
    if (__DEV__) {
        const { NativeUnimoduleProxy } = NativeModules;
        if (!NativeUnimoduleProxy.viewManagersNames.includes(viewName)) {
            const exportedViewManagerNames = NativeUnimoduleProxy.viewManagersNames.join(', ');
            console.warn(`The native view manager required by name (${viewName}) from NativeViewManagerAdapter isn't exported by expo-modules-core. Views of this type may not render correctly. Exported view managers: [${exportedViewManagerNames}].`);
        }
    }
    // Set up the React Native native component, which is an adapter to the universal module's view
    // manager
    const reactNativeViewName = `ViewManagerAdapter_${viewName}`;
    const ReactNativeComponent = requireNativeComponent(reactNativeViewName);
    const reactNativeUIConfiguration = (UIManager.getViewManagerConfig
        ? UIManager.getViewManagerConfig(reactNativeViewName)
        : UIManager[reactNativeViewName]) || {
        NativeProps: {},
        directEventTypes: {},
    };
    const reactNativeComponentPropNames = [
        'children',
        ...ViewPropTypesKeys,
        ...Object.keys(reactNativeUIConfiguration.NativeProps),
        ...Object.keys(reactNativeUIConfiguration.directEventTypes),
    ];
    // Define a component for universal-module authors to access their native view manager
    function NativeComponentAdapter(props, ref) {
        const nativeProps = pick(props, reactNativeComponentPropNames);
        const proxiedProps = omit(props, reactNativeComponentPropNames);
        return React.createElement(ReactNativeComponent, { ...nativeProps, proxiedProperties: proxiedProps, ref: ref });
    }
    NativeComponentAdapter.displayName = `Adapter<${viewName}>`;
    return React.forwardRef(NativeComponentAdapter);
}
function omit(props, propNames) {
    const copied = { ...props };
    for (const propName of propNames) {
        delete copied[propName];
    }
    return copied;
}
function pick(props, propNames) {
    return propNames.reduce((prev, curr) => {
        if (curr in props) {
            prev[curr] = props[curr];
        }
        return prev;
    }, {});
}
//# sourceMappingURL=NativeViewManagerAdapter.native.js.map