'use client';

import { type ComponentType } from 'react';
import { type HostComponent, NativeComponentRegistry } from 'react-native';

import { hasAriaProps, mapAriaProps } from './ariaProps';
import { addAttributeProcessing } from './nativeViewProps';
import { requireOptionalNativeModule } from './requireNativeModule';

/**
 * The host components that `createNativeViewComponent` registered, by their component name.
 */
const hostComponentsCache = new Map<string, HostComponent<any>>();

/**
 * The non-enumerable property of a module object that holds the component of the module's default view.
 * Native defines it together with a property for each view of Expo Modules v2.
 */
const DEFAULT_VIEW_PROPERTY = '__expo_default_view__';

/**
 * Marks the components that `createNativeViewComponent` creates, so that a module function or constant
 * with the name of a view is never taken for its component.
 */
const NATIVE_VIEW_COMPONENT = Symbol.for('expo.nativeViewComponent');

/**
 * What native passes to `createNativeViewComponent` for a view of Expo Modules v2.
 */
export type NativeViewComponentConfig = {
  /** The component name that native registered, e.g. `ViewManagerAdapter_Cards_CardView`. */
  name: string;
  /** The name that React DevTools and errors show, e.g. `CardView`. */
  displayName: string;
  validAttributes: Record<string, true>;
  directEventTypes: Record<string, { registrationName: string }>;
  // TODO: Add an optional `functions` object once views of Expo Modules v2 have view functions.
};

function requireHostComponent(config: NativeViewComponentConfig): HostComponent<any> {
  let component = hostComponentsCache.get(config.name);
  if (!component) {
    component = NativeComponentRegistry.get(config.name, () => ({
      uiViewClassName: config.name,
      validAttributes: addAttributeProcessing(config.validAttributes),
      directEventTypes: config.directEventTypes,
    }));
    hostComponentsCache.set(config.name, component);
  }
  return component;
}

/**
 * Creates the React component of a view of Expo Modules v2. Native calls it through
 * `expo.__createNativeViewComponent` the first time JS reads the view from its module.
 */
export function createNativeViewComponent(config: NativeViewComponentConfig) {
  const HostView = requireHostComponent(config);

  // `ref` is a regular prop in React 19, so spreading the props passes it to the host view.
  function NativeView(props: Record<string, any>) {
    return <HostView {...(hasAriaProps(props) ? mapAriaProps(props) : props)} />;
  }
  NativeView.displayName = config.displayName;
  Object.defineProperty(NativeView, NATIVE_VIEW_COMPONENT, { value: true });
  return NativeView;
}

/**
 * Returns the component that native created with `createNativeViewComponent` for a view of
 * Expo Modules v2, or `null` for other views.
 */
export function getNativeViewComponent<P>(
  moduleName: string,
  viewName?: string
): ComponentType<P> | null {
  const nativeModule = requireOptionalNativeModule(moduleName);
  if (!nativeModule) {
    return null;
  }
  const component = nativeModule[viewName ?? DEFAULT_VIEW_PROPERTY];
  return typeof component === 'function' && component[NATIVE_VIEW_COMPONENT] === true
    ? component
    : null;
}
