// @flow

import { NativeError } from 'expo-firebase-app';
import type { NativeErrorResponse } from 'expo-firebase-app';
import type { SnapshotErrorInterface } from './firestoreTypes.flow';

export default class SnapshotError extends NativeError implements SnapshotErrorInterface {
  constructor(nativeErrorMap: NativeErrorResponse) {
    super(nativeErrorMap.error);
    this.path = nativeErrorMap.path;
    this.appName = nativeErrorMap.appName;
  }
}
