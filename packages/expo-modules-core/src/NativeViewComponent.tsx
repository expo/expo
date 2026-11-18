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

function requireHostComponent(
  name: string,
  validAttributes: Record<string, true>,
  directEventTypes: Record<string, { registrationName: string }>
): HostComponent<any> {
  let component = hostComponentsCache.get(name);
  if (!component) {
    component = NativeComponentRegistry.get(name, () => ({
      uiViewClassName: name,
      validAttributes: addAttributeProcessing(validAttributes),
      directEventTypes,
    }));
    hostComponentsCache.set(name, component);
  }
  return component;
}

/**
 * Creates the React component of a view of Expo Modules v2. Native calls it through
 * `expo.__createNativeViewComponent` the first time JS reads the view from its module or package.
 *
 * @param name The component name that native registered, e.g. `ViewManagerAdapter_Cards_CardView`.
 * @param displayName The name that React DevTools and errors show, e.g. `CardView`.
 * @param validAttributes The names of the view's props.
 * @param directEventTypes The view's events, keyed by the normalized event name.
 */
// TODO: Add an optional `functions` argument once views of Expo Modules v2 have view functions.
export function createNativeViewComponent(
  name: string,
  displayName: string,
  validAttributes: Record<string, true>,
  directEventTypes: Record<string, { registrationName: string }>
) {
  const HostView = requireHostComponent(name, validAttributes, directEventTypes);

  // `ref` is a regular prop in React 19, so spreading the props passes it to the host view.
  function NativeView(props: Record<string, any>) {
    return <HostView {...(hasAriaProps(props) ? mapAriaProps(props) : props)} />;
  }
  NativeView.displayName = displayName;
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
