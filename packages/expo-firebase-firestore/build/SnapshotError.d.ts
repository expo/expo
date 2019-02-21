import { NativeError, NativeErrorResponse } from 'expo-firebase-app';
export default class SnapshotError extends NativeError {
    path: string;
    appName: string;
    constructor(nativeErrorMap: NativeErrorResponse);
}
