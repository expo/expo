import React, { useEffect } from 'react';
import ExpoKeepAwake from './ExpoKeepAwake';

// NOTE(brentvatne): in tests this value won't be reset because we
// can render a component and never unmount it.
let __keepAwakeMountedCount = 0;
const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';

export default class KeepAwake extends React.PureComponent {
  static activate = (tag?: string): void => {
    console.warn(`The "KeepAwake.activate" static method has been deprecated in favor of the "activateKeepAwake" function exported from expo-keep-awake and will be removed in SDK 35`);
    activateKeepAwake(tag);
  };

  static deactivate = (tag?: string): void => {
    console.warn(`The "KeepAwake.deactivate" static method has been deprecated in favor of the "deactivateKeepAwake" function exported from expo-keep-awake and will be removed in SDK 35`);
    deactivateKeepAwake(tag);
  };

  componentDidMount() {
    console.warn(`The KeepAwake component has been deprecated in favor of the useKeepAwake hook and will be removed in SDK 35`);
    __keepAwakeMountedCount++;
    if (__keepAwakeMountedCount === 1) {
      activateKeepAwake();
    }
  }

  componentWillUnmount() {
    __keepAwakeMountedCount--;
    if (__keepAwakeMountedCount === 0) {
      deactivateKeepAwake();
    }
  }

  render() {
    return null;
  }
}

export function useKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  useEffect(() => {
    activateKeepAwake(tag);
    return () => deactivateKeepAwake(tag);
  }, [tag]);
}

export function activateKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  ExpoKeepAwake.activate(tag);
}

export function deactivateKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  ExpoKeepAwake.deactivate(tag);
}

export function activate(tag?: string): void {
  console.warn(
    `"activate" from expo-keep-awake has been deprecated in favor of "activateKeepAwake" and will be removed in SDK 35`
  );
  activateKeepAwake(tag);
}

export function deactivate(tag?: string): void {
  console.warn(
    `"deactivate" from expo-keep-awake has been deprecated in favor of "deactivateKeepAwake" and will be removed in SDK 35`
  );
  deactivateKeepAwake(tag);
}
