import * as React from 'react';
import { CaptureOptions } from 'react-native-view-shot';
import captureRef from './captureRef';
type ReactNativeNodeHandle = number;

export default async function takeSnapshotAsync<T>(
  node?: ReactNativeNodeHandle | React.Component | React.RefObject<T>,
  options?: CaptureOptions
): Promise<string> {
  if (node && typeof node === 'object' && 'current' in node && node.current) {
    // React.RefObject
    // @ts-ignore: captureRef's type doesn't include node handles
    return captureRef(node.current, options);
  }

  // @ts-ignore: captureRef's type doesn't include node handles
  return captureRef(node, options);
}
