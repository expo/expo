import { NativeError } from 'expo-firebase-app';
import { NativeErrorResponse } from 'expo-firebase-app';
import { SnapshotErrorInterface } from './firestoreTypes.flow';

export default class SnapshotError extends NativeError implements SnapshotErrorInterface {
  constructor(nativeErrorMap: NativeErrorResponse) {
    super(nativeErrorMap.error);
    this.path = nativeErrorMap.path;
    this.appName = nativeErrorMap.appName;
  }
}
