import { NativeError } from 'expo-firebase-app';
export default class SnapshotError extends NativeError {
    constructor(nativeErrorMap) {
        super(nativeErrorMap.error);
        this.path = nativeErrorMap.path;
        this.appName = nativeErrorMap.appName;
    }
}
//# sourceMappingURL=SnapshotError.js.map