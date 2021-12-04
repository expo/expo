import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

export type <%- project.name %>ViewProps = {
  name: number;
};

type <%- project.name %>ViewState = {}

const NativeView: React.ComponentType<<%- project.name %>ViewProps> =
  requireNativeViewManager('<%- project.name %>');

export default class <%- project.name %>View extends React.Component<<%- project.name %>ViewProps, <%- project.name %>ViewState> {
  render() {
    return <NativeView name={this.props.name} />;
  }
}
