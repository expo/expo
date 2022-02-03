import { NativeModulesProxy } from 'expo-modules-core';

import <%- project.name %>View, { <%- project.name %>ViewProps } from './<%- project.name %>View'

const { <%- project.name %> } = NativeModulesProxy;

export async function helloAsync(options: Record<string, string>) {
  return await <%- project.name %>.helloAsync(options);
}

export {
  <%- project.name %>View,
  <%- project.name %>ViewProps
};
