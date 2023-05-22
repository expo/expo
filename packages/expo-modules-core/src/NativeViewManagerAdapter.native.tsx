import React from 'react';
import { findNodeHandle, NativeModules, requireNativeComponent, HostComponent } from 'react-native';

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
  const ReactNativeComponent = requireCachedNativeComponent(reactNativeViewName);

  class NativeComponent extends React.PureComponent<P> {
    static displayName = viewName;

    // This will be accessed from native when the prototype functions are called,
    // in order to find the associated native view.
    nativeTag: number | null = null;

    componentDidMount(): void {
      this.nativeTag = findNodeHandle(this);
    }

    render(): React.ReactNode {
      return <ReactNativeComponent {...this.props} />;
    }
  }

  try {
    const nativeModule = requireNativeModule(viewName);
    const nativeViewPrototype = nativeModule.ViewPrototype;

    if (nativeViewPrototype) {
      // Assign native view functions to the component prototype so they can be accessed from the ref.
      Object.assign(NativeComponent.prototype, nativeViewPrototype);
    }
  } catch {
    // `requireNativeModule` may throw an error when the native module cannot be found.
    // In some tests we don't mock the entire modules, but we do want to mock native views. For now,
    // until we still have to support the legacy modules proxy and don't have better ways to mock,
    // let's just gracefully skip assigning the prototype functions.
    // See: https://github.com/expo/expo/blob/main/packages/expo-modules-core/src/__tests__/NativeViewManagerAdapter-test.native.tsx
  }

  return NativeComponent;
}
