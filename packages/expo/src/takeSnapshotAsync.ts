import * as React from 'react';
import { captureRef } from 'react-native-view-shot';

type ReactNativeNodeHandle = number;

type SnapshotOptions = {
  width?: number;
  height?: number;
  format: 'png' | 'jpg' | 'raw' | 'webm';
  quality: number;
  snapshotContentContainer: boolean;
  result: "tmpfile" | "base64" | "data-uri" | "zip-base64";
};

export default async function takeSnapshotAsync(
  node: ReactNativeNodeHandle | React.Component,
  options?: SnapshotOptions
): Promise<string> {
  return captureRef(node, options);
}
