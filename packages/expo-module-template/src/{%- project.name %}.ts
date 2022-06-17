import { requireNativeModule, NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

import <%- project.name %>View, { <%- project.name %>ViewProps } from './<%- project.name %>View'

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const <%- project.name %> = requireNativeModule(<%- project.name %>);

// Get the native constant value.
export const PI = <%- project.name %>.PI;

export async function setValueAsync(value: string) {
  return await <%- project.name %>.setValueAsync(value);
}

// For now the events are not going through the JSI, so we have to use its bridge equivalent.
// This will be fixed in the stable release and built into the module object.
const emitter = new EventEmitter(NativeModulesProxy.<%- project.name %>);

export type ChangeEventPayload = {
  value: string;
};

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export {
  <%- project.name %>View,
  <%- project.name %>ViewProps
};
