import React from 'react';
import { NativeModules, requireNativeComponent, HostComponent } from 'react-native';

// To make the transition from React Native's `requireNativeComponent` to Expo's
// `requireNativeViewManager` as easy as possible, `requireNativeViewManager` is a drop-in
// replacement for `requireNativeComponent`.
//
// For each view manager, we create a wrapper component that accepts all of the props available to
// the author of the universal module. This wrapper component splits the props into two sets: props
// passed to React Native's View (ex: style, testID) and custom view props, which are passed to the
// adapter view component in a prop called `proxiedProperties`.

type NativeExpoComponentProps = {
  proxiedProperties: object;
};

/**
 * A map that caches registered native components.
 */
const nativeComponentsCache = new Map<string, HostComponent<any>>();

/**
 * Requires a React Native component from cache if possible. This prevents
 * "Tried to register two views with the same name" errors on fast refresh, but
 * also when there are multiple versions of the same package with native component.
 */
function requireCachedNativeComponent<Props>(viewName: string): HostComponent<Props> {
  const cachedNativeComponent = nativeComponentsCache.get(viewName);

  if (!cachedNativeComponent) {
    const nativeComponent = requireNativeComponent<Props>(viewName);
    nativeComponentsCache.set(viewName, nativeComponent);
    return nativeComponent;
  }
  return cachedNativeComponent;
}

/**
 * A drop-in replacement for `requireNativeComponent`.
 */
export function requireNativeViewManager<P>(viewName: string): React.ComponentType<P> {
  const { viewManagersMetadata } = NativeModules.NativeUnimoduleProxy;
  const viewManagerConfig = viewManagersMetadata?.[viewName];

  if (__DEV__ && !viewManagerConfig) {
    const exportedViewManagerNames = Object.keys(viewManagersMetadata).join(', ');
    console.warn(
      `The native view manager required by name (${viewName}) from NativeViewManagerAdapter isn't exported by expo-modules-core. Views of this type may not render correctly. Exported view managers: [${exportedViewManagerNames}].`
    );
  }

  // Set up the React Native native component, which is an adapter to the universal module's view
  // manager
  const reactNativeViewName = `ViewManagerAdapter_${viewName}`;
  const ReactNativeComponent =
    requireCachedNativeComponent<NativeExpoComponentProps>(reactNativeViewName);
  const proxiedPropsNames = viewManagerConfig?.propsNames ?? [];

  // Define a component for universal-module authors to access their native view manager
  const NativeComponentAdapter = React.forwardRef<any>((props, ref) => {
    const nativeProps = omit(props, proxiedPropsNames);
    const proxiedProps = pick(props, proxiedPropsNames);
    return <ReactNativeComponent {...nativeProps} proxiedProperties={proxiedProps} ref={ref} />;
  }) as React.ComponentType<P>;
  NativeComponentAdapter.displayName = `Adapter<${viewName}>`;
  return NativeComponentAdapter;
}

function omit(props: Record<string, any>, propNames: string[]) {
  const copied = { ...props };
  for (const propName of propNames) {
    delete copied[propName];
  }
  return copied;
}

function pick(props: Record<string, any>, propNames: string[]) {
  return propNames.reduce((prev, curr) => {
    if (curr in props) {
      prev[curr] = props[curr];
    }
    return prev;
  }, {});
}
