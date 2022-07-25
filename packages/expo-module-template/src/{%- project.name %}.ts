import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to <%- project.name %>.web.ts
// and on native platforms to <%- project.name %>.ts
import <%- project.name %> from './<%- project.name %>Module';
import <%- project.name %>View from './<%- project.name %>View';
import { ChangeEventPayload, <%- project.name %>ViewProps } from './<%- project.name %>.types';

// Get the native constant value.
export const PI = <%- project.name %>.PI;

export function hello(): string {
  return <%- project.name %>.hello();
}

export async function setValueAsync(value: string) {
  return await <%- project.name %>.setValueAsync(value);
}

// For now the events are not going through the JSI, so we have to use its bridge equivalent.
// This will be fixed in the stable release and built into the module object.
// Note: On web, NativeModulesProxy.<%- project.name %> is undefined, so we fall back to the directly imported implementation
const emitter = new EventEmitter(NativeModulesProxy.<%- project.name %> ?? <%- project.name %>);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { <%- project.name %>View, <%- project.name %>ViewProps, ChangeEventPayload };
