import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to <%- project.name %>.web.ts
// and on native platforms to <%- project.name %>.ts
import <%- project.moduleName %> from './src/<%- project.moduleName %>';
import <%- project.viewName %> from './src/<%- project.viewName %>';
import { ChangeEventPayload, <%- project.viewName %>Props } from './src/<%- project.name %>.types';

// Get the native constant value.
export const PI = <%- project.moduleName %>.PI;

export function hello(): string {
  return <%- project.moduleName %>.hello();
}

export async function setValueAsync(value: string) {
  return await <%- project.moduleName %>.setValueAsync(value);
}

const emitter = new EventEmitter(<%- project.moduleName %> ?? NativeModulesProxy.<%- project.name %>);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { <%- project.viewName %>, <%- project.viewName %>Props, ChangeEventPayload };
