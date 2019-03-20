import React from 'react';
import ExpoKeepAwake from './ExpoKeepAwake';

// NOTE(brentvatne): in tests this value won't be reset because we
// can render a component and never unmount it.
let __keepAwakeMountedCount = 0;
const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';

export default class KeepAwake extends React.PureComponent {
  static activate = activate;
  static deactivate = deactivate;

  componentDidMount() {
    __keepAwakeMountedCount = __keepAwakeMountedCount + 1;
    if (__keepAwakeMountedCount === 1) {
      ExpoKeepAwake.activate();
    }
  }

  componentWillUnmount() {
    __keepAwakeMountedCount = __keepAwakeMountedCount - 1;
    if (__keepAwakeMountedCount == 0) {
      ExpoKeepAwake.deactivate();
    }
  }

  render() {
    return null;
  }
}

export function activate(tag?: string) {
  ExpoKeepAwake.activate(tag || ExpoKeepAwakeTag);
}

export function deactivate(tag?: string) {
  ExpoKeepAwake.deactivate(tag || ExpoKeepAwakeTag);
}
