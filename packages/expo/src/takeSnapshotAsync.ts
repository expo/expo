import * as React from 'react';
import { NativeModules, findNodeHandle } from 'react-native';

const { RNViewShot } = NativeModules;

type ReactNativeNodeHandle = number;

type SnapshotOptions = {
  width?: number;
  height?: number;
  format?: 'png' | 'jpg' | 'jpeg' | 'webm';
  quality?: number;
  result?: 'file' | 'base64' | 'data-uri';
};

export default async function takeSnapshotAsync(
  node: ReactNativeNodeHandle | React.Component,
  options?: SnapshotOptions
): Promise<string> {
  let handle = typeof node === 'number' ? node : _getNodeHandle(node);
  return RNViewShot.takeSnapshot(handle, options);
}

function _getNodeHandle(component: React.Component): ReactNativeNodeHandle {
  let handle = findNodeHandle(component);
  if (handle === null) {
    throw new Error(
      `Could not find the React node handle for the component to snapshot: ${component}`
    );
  }
  return handle;
}
