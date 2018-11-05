import React from 'react';
import { NativeModules } from 'react-native';

const { ExponentKeepAwake } = NativeModules;

export default class KeepAwake extends React.PureComponent {
  static activate = activate;
  static deactivate = deactivate;

  componentDidMount() {
    ExponentKeepAwake.activate();
  }

  componentWillUnmount() {
    ExponentKeepAwake.deactivate();
  }

  render() {
    return null;
  }
}

export function activate(): void {
  ExponentKeepAwake.activate();
}

export function deactivate(): void {
  ExponentKeepAwake.deactivate();
}
