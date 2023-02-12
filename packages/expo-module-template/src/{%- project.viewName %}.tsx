import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { <%- project.viewName %>Props } from './<%- project.name %>.types';

const NativeView: React.ComponentType<<%- project.viewName %>Props> =
  requireNativeViewManager('<%- project.name %>');

export default function <%- project.viewName %>(props: <%- project.viewName %>Props) {
  return <NativeView {...props} />;
}
