import React from 'react';

import ExponentKeepAwake from './ExponentKeepAwake';

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

export function activate() {
  ExponentKeepAwake.activate();
}

export function deactivate() {
  ExponentKeepAwake.deactivate();
}
