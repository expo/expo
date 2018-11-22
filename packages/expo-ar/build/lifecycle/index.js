import { findNodeHandle } from 'react-native';
import { NativeAR } from '../NativeAR';
/**
 * Starts AR session
 *
 * @param node Handler for GLView component
 * @param configuration {@only iOS}. Defines motion and scene tracking behaviors for the session. {@link https://developer.apple.com/documentation/arkit/arsession/2865608-runwithconfiguration}
 */
export async function startAsync(node, configuration) {
    if (typeof node === 'number') {
        return NativeAR.startAsync(node, configuration);
    }
    else {
        const handle = findNodeHandle(node);
        if (handle === null) {
            throw new Error(`Could not find the React node handle for the AR component: ${node}`);
        }
        return NativeAR.startAsync(handle, configuration);
    }
}
/**
 * Pauses native session. No new AR data would be provided. Preview would be stopped as well.
 */
export async function pauseAsync() {
    return NativeAR.pause();
}
/**
 * Resumes previously paused session. That would restore any AR data provision. Preview would be restored as well.
 */
export async function resumeAsync() {
    return NativeAR.resume();
}
/**
 * Tears down current session and starts it up again with previous configuration.
 */
export async function resetAsync() {
    return NativeAR.reset();
}
/**
 * Stops current session. That would clean up native side. You can start another session after calling this.
 */
export async function stopAsync() {
    return NativeAR.stopAsync();
}
//# sourceMappingURL=index.js.map