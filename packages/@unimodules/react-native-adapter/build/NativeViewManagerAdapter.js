import omit from 'lodash/omit';
import pick from 'lodash/pick';
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
            console.warn(`The native view manager required by name (${viewName}) from NativeViewManagerAdapter isn't exported by @unimodules/react-native-adapter. Views of this type may not render correctly. Exported view managers: [${exportedViewManagerNames}].`);
        }
    }
    // Set up the React Native native component, which is an adapter to the universal module's view
    // manager
    const reactNativeViewName = `ViewManagerAdapter_${viewName}`;
    const ReactNativeComponent = requireNativeComponent(reactNativeViewName);
    // @ts-ignore: UIManager.getViewManagerConfig is not declared
    const reactNativeUIConfiguration = UIManager.getViewManagerConfig(reactNativeViewName) || {
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
        // TODO: `omit` may incur a meaningful performance cost across many native components rendered
        // in the same update. Profile this and write out a partition function if this is a bottleneck.
        const nativeProps = pick(props, reactNativeComponentPropNames);
        const proxiedProps = omit(props, reactNativeComponentPropNames);
        return <ReactNativeComponent {...nativeProps} proxiedProperties={proxiedProps} ref={ref}/>;
    }
    NativeComponentAdapter.displayName = `Adapter<${viewName}>`;
    return React.forwardRef(NativeComponentAdapter);
}
//# sourceMappingURL=NativeViewManagerAdapter.js.map