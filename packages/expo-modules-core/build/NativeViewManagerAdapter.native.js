// Copyright © 2024 650 Industries.
'use client';
import React from 'react';
import { findNodeHandle, NativeModules } from 'react-native';
import * as NativeComponentRegistry from 'react-native/Libraries/NativeComponent/NativeComponentRegistry';
import { requireNativeModule } from './requireNativeModule';
// To make the transition from React Native's `requireNativeComponent` to Expo's
// `requireNativeViewManager` as easy as possible, `requireNativeViewManager` is a drop-in
// replacement for `requireNativeComponent`.
//
// For each view manager, we create a wrapper component that accepts all of the props available to
// the author of the universal module. This wrapper component splits the props into two sets: props
// passed to React Native's View (ex: style, testID) and custom view props, which are passed to the
// adapter view component in a prop called `proxiedProperties`.
/**
 * A map that caches registered native components.
 */
const nativeComponentsCache = new Map();
/**
 * Requires a React Native component using the static view config from an Expo module.
 */
function requireNativeComponent(viewName) {
    return NativeComponentRegistry.get(viewName, () => {
        const viewModuleName = viewName.replace('ViewManagerAdapter_', '');
        const expoViewConfig = globalThis.expo?.getViewConfig(viewModuleName);
        if (!expoViewConfig) {
            console.warn('Unable to get the view config for %s', viewModuleName);
        }
        return {
            uiViewClassName: viewName,
            ...expoViewConfig,
        };
    });
}
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
    class NativeComponent extends React.PureComponent {
        static displayName = viewName;
        // This will be accessed from native when the prototype functions are called,
        // in order to find the associated native view.
        nativeTag = null;
        componentDidMount() {
            this.nativeTag = findNodeHandle(this);
        }
        render() {
            return <ReactNativeComponent {...this.props}/>;
        }
    }
    try {
        const nativeModule = requireNativeModule(viewName);
        const nativeViewPrototype = nativeModule.ViewPrototype;
        if (nativeViewPrototype) {
            // Assign native view functions to the component prototype so they can be accessed from the ref.
            Object.assign(NativeComponent.prototype, nativeViewPrototype);
        }
    }
    catch {
        // `requireNativeModule` may throw an error when the native module cannot be found.
        // In some tests we don't mock the entire modules, but we do want to mock native views. For now,
        // until we still have to support the legacy modules proxy and don't have better ways to mock,
        // let's just gracefully skip assigning the prototype functions.
        // See: https://github.com/expo/expo/blob/main/packages/expo-modules-core/src/__tests__/NativeViewManagerAdapter-test.native.tsx
    }
    return NativeComponent;
}
//# sourceMappingURL=NativeViewManagerAdapter.native.js.map