import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { <%- project.name %>ViewProps } from './<%- project.name %>.types';

const NativeView: React.ComponentType<<%- project.name %>ViewProps> =
  requireNativeViewManager('<%- project.name %>');

export default function <%- project.name %>View(props: <%- project.name %>ViewProps) {
  return <NativeView name={props.name} />;
}
