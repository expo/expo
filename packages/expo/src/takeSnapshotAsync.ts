import * as React from 'react';
import { captureRef } from 'react-native-view-shot';

type ReactNativeNodeHandle = number;

type SnapshotOptions = {
  width?: number;
  height?: number;
  format: 'png' | 'jpg' | 'raw' | 'webm';
  quality: number;
  snapshotContentContainer: boolean;
  result: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
};

export default async function takeSnapshotAsync<T>(
  node: ReactNativeNodeHandle | React.Component | React.RefObject<T>,
  options?: SnapshotOptions
): Promise<string> {
  if (typeof node === 'object' && 'current' in node && node.current) {
    // React.RefObject
    // @ts-ignore: captureRef's type doesn't include node handles
    return captureRef(node.current, options);
  }

  // @ts-ignore: captureRef's type doesn't include node handles
  return captureRef(node, options);
}
