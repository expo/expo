import { requireNativeView } from 'expo';
import * as React from 'react';

import { <%- project.viewName %>Props } from './<%- project.name %>.types';

const NativeView: React.ComponentType<<%- project.viewName %>Props> =
  requireNativeView('<%- project.name %>');

export default function <%- project.viewName %>(props: <%- project.viewName %>Props) {
  return <NativeView {...props} />;
}
