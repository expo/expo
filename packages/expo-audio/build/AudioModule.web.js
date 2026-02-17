import { PermissionStatus } from 'expo-modules-core';
import { getUserMedia } from './AudioUtils.web';
export { AudioPlayerWeb } from './AudioPlayer.web';
export { AudioRecorderWeb } from './AudioRecorder.web';
async function getPermissionWithQueryAsync(name) {
    if (!navigator || !navigator.permissions || !navigator.permissions.query)
        return null;
    try {
        const { state } = await navigator.permissions.query({ name });
        switch (state) {
            case 'granted':
                return PermissionStatus.GRANTED;
            case 'denied':
                return PermissionStatus.DENIED;
            default:
                return PermissionStatus.UNDETERMINED;
        }
    }
    catch {
        // Firefox - TypeError: 'microphone' (value of 'name' member of PermissionDescriptor) is not a valid value for enumeration PermissionName.
        return PermissionStatus.UNDETERMINED;
    }
}
export async function setAudioModeAsync(mode) { }
export async function setIsAudioActiveAsync(active) { }
export async function getRecordingPermissionsAsync() {
    const maybeStatus = await getPermissionWithQueryAsync('microphone');
    switch (maybeStatus) {
        case PermissionStatus.GRANTED:
            return {
                status: PermissionStatus.GRANTED,
                expires: 'never',
                canAskAgain: true,
                granted: true,
            };
        case PermissionStatus.DENIED:
            return {
                status: PermissionStatus.DENIED,
                expires: 'never',
                canAskAgain: true,
                granted: false,
            };
        default:
            return await requestRecordingPermissionsAsync();
    }
}
export async function requestRecordingPermissionsAsync() {
    try {
        const stream = await getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return {
            status: PermissionStatus.GRANTED,
            expires: 'never',
            canAskAgain: true,
            granted: true,
        };
    }
    catch {
        return {
            status: PermissionStatus.DENIED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
        };
    }
}
//# sourceMappingURL=AudioModule.web.js.map