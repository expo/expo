import React from 'react';
import { NativeModules, requireNativeComponent } from 'react-native';
/**
 * A map that caches registered native components.
 */
const nativeComponentsCache = new Map();
/**
 * Requires a React Native component from cache if possible. This prevents
 * "Tried to register two views with the same name" errors on fast refresh, but
 * also when there are multiple versions of the same package with native component.
 */
function requireCachedNativeComponent(viewName) {
    const cachedNativeComponent = nativeComponentsCache.get(viewName);
    if (!cachedNativeComponent) {
        const nativeComponent = requireNativeComponent(viewName);
        nativeComponentsCache.set(viewName, nativeComponent);
        return nativeComponent;
    }
    return cachedNativeComponent;
}
/**
 * A drop-in replacement for `requireNativeComponent`.
 */
export function requireNativeViewManager(viewName) {
    const { viewManagersMetadata } = NativeModules.NativeUnimoduleProxy;
    const viewManagerConfig = viewManagersMetadata?.[viewName];
    if (__DEV__ && !viewManagerConfig) {
        const exportedViewManagerNames = Object.keys(viewManagersMetadata).join(', ');
        console.warn(`The native view manager required by name (${viewName}) from NativeViewManagerAdapter isn't exported by expo-modules-core. Views of this type may not render correctly. Exported view managers: [${exportedViewManagerNames}].`);
    }
    // Set up the React Native native component, which is an adapter to the universal module's view
    // manager
    const reactNativeViewName = `ViewManagerAdapter_${viewName}`;
    const ReactNativeComponent = requireCachedNativeComponent(reactNativeViewName);
    const proxiedPropsNames = viewManagerConfig?.propsNames ?? [];
    // Define a component for universal-module authors to access their native view manager
    const NativeComponentAdapter = React.forwardRef((props, ref) => {
        const nativeProps = omit(props, proxiedPropsNames);
        const proxiedProps = pick(props, proxiedPropsNames);
        return React.createElement(ReactNativeComponent, { ...nativeProps, proxiedProperties: proxiedProps, ref: ref });
    });
    NativeComponentAdapter.displayName = `Adapter<${viewName}>`;
    return NativeComponentAdapter;
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