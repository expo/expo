import { NativeError, NativeErrorResponse } from 'expo-firebase-app';

export default class SnapshotError extends NativeError {
  path: string;
  appName: string;

  constructor(nativeErrorMap: NativeErrorResponse) {
    super(nativeErrorMap.error);
    this.path = nativeErrorMap.path;
    this.appName = nativeErrorMap.appName;
  }
}
