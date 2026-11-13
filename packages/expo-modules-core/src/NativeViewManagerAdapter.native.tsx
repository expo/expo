// Copyright © 2024 650 Industries.

'use client';

import { type Component, type ComponentType, createRef, PureComponent } from 'react';
import {
  type ReactNativeElement,
  findNodeHandle,
  type HostComponent,
  NativeComponentRegistry,
} from 'react-native';

import { getNativeViewComponent } from './NativeViewComponent';
import { mapAriaProps } from './ariaProps';
import { addAttributeProcessing } from './nativeViewProps';
import { requireNativeModule } from './requireNativeModule';

// To make the transition from React Native's `requireNativeComponent` to Expo's
// `requireNativeViewManager` as easy as possible, `requireNativeViewManager` is a drop-in
// replacement for `requireNativeComponent`.
//
// For each view manager, we create a wrapper component that accepts all the props available to
// the author of the universal module. This wrapper component splits the props into two sets: props
// passed to React Native's View (ex: style, testID) and custom view props, which are passed to the
// adapter view component in a prop called `proxiedProperties`.

/**
 * A map that caches registered native components.
 */
const nativeComponentsCache = new Map<string, HostComponent<any>>();

// TODO(@kitten): Optimally, this is defined on ExpoGlobal
declare namespace globalThis {
  const expo:
    | undefined
    | {
        getViewConfig(
          moduleName: string,
          viewName?: string
        ): {
          validAttributes: Record<string, any>;
          directEventTypes: Record<string, { registrationName: string }>;
        } | null;
      };
}

/**
 * Requires a React Native component using the static view config from an Expo module.
 */
function requireNativeComponent<Props extends object>(
  moduleName: string,
  viewName?: string
): HostComponent<Props> {
  const nativeViewName = viewName
    ? `ViewManagerAdapter_${moduleName}_${viewName}`
    : `ViewManagerAdapter_${moduleName}`;

  return NativeComponentRegistry.get<Props>(nativeViewName, () => {
    const expoViewConfig = globalThis.expo?.getViewConfig(moduleName, viewName);

    if (!expoViewConfig) {
      console.warn(
        'Unable to get the view config for %s from module %s',
        viewName ?? 'default view',
        moduleName
      );
      return { uiViewClassName: nativeViewName };
    }

    return {
      uiViewClassName: nativeViewName,
      directEventTypes: expoViewConfig.directEventTypes,
      validAttributes: addAttributeProcessing(expoViewConfig.validAttributes),
    };
  });
}

/**
 * Requires a React Native component from cache if possible. This prevents
 * "Tried to register two views with the same name" errors on fast refresh, but
 * also when there are multiple versions of the same package with native component.
 */
function requireCachedNativeComponent<Props extends object>(
  moduleName: string,
  viewName?: string
): HostComponent<Props> {
  const cacheKey = `${moduleName}_${viewName}`;
  const cachedNativeComponent = nativeComponentsCache.get(cacheKey);

  if (!cachedNativeComponent) {
    const nativeComponent = requireNativeComponent<Props>(moduleName, viewName);
    nativeComponentsCache.set(cacheKey, nativeComponent);
    return nativeComponent;
  }
  return cachedNativeComponent;
}

/**
 * A drop-in replacement for `requireNativeComponent`.
 */
export function requireNativeViewManager<P extends object>(
  moduleName: string,
  viewName?: string
): ComponentType<P> {
  const nativeViewComponent = getNativeViewComponent<P>(moduleName, viewName);
  if (nativeViewComponent) {
    return nativeViewComponent;
  }
  const ReactNativeComponent = requireCachedNativeComponent(moduleName, viewName);

  class NativeComponent extends PureComponent<P> {
    static displayName = viewName ? viewName : moduleName;

    nativeRef = createRef<Component & ReactNativeElement>();

    // This will be accessed from native when the prototype functions are called,
    // in order to find the associated native view.
    nativeTag: number | null = null;

    componentDidMount(): void {
      this.nativeTag = findNodeHandle(this.nativeRef.current);
    }

    /**
     * The underlying host component
     */
    getNativeRef(): (Component & ReactNativeElement) | null {
      return this.nativeRef.current;
    }

    render() {
      return <ReactNativeComponent {...mapAriaProps(this.props)} ref={this.nativeRef} />;
    }
  }

  try {
    const nativeModule = requireNativeModule(moduleName);
    const nativeViewPrototype =
      nativeModule.ViewPrototypes[viewName ? `${moduleName}_${viewName}` : moduleName];
    if (nativeViewPrototype) {
      // Assign native view functions to the component prototype, so they can be accessed from the ref.
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
