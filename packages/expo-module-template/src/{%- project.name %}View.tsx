import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

export type <%- project.name %>ViewProps = {
  name: string;
};

const NativeView: React.ComponentType<<%- project.name %>ViewProps> =
  requireNativeViewManager('<%- project.name %>');

export default function <%- project.name %>View(props: <%- project.name %>ViewProps) {
  return <NativeView name={props.name} />;
}
