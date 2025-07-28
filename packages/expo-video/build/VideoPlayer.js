import { useReleasingSharedObject } from 'expo-modules-core';
import NativeVideoModule from './NativeVideoModule';
import resolveAssetSource from './resolveAssetSource';
// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const replace = NativeVideoModule.VideoPlayer.prototype.replace;
NativeVideoModule.VideoPlayer.prototype.replace = function (source, disableWarning = false) {
    if (!disableWarning) {
        console.warn('On iOS `VideoPlayer.replace` loads the asset data synchronously on the main thread, which can lead to UI freezes and will be deprecated in a future release. Switch to `replaceAsync` for better user experience.');
    }
    return replace.call(this, parseSource(source));
};
const replaceAsync = NativeVideoModule.VideoPlayer.prototype.replaceAsync;
NativeVideoModule.VideoPlayer.prototype.replaceAsync = function (source) {
    return replaceAsync.call(this, parseSource(source));
};
// Add PIP restoration callback management methods to the native VideoPlayer prototype
NativeVideoModule.VideoPlayer.prototype.setPipRestoreCallbacks = function (callbacks) {
    // Store callbacks on the instance for JavaScript-side access
    this._pipRestoreCallbacks = callbacks;
    // Set up event listeners for PIP restoration events
    this.addListener('onBeforePipRestore', async (event) => {
        const { context, callbackId } = event;
        if (callbacks.onBeforePipRestore) {
            try {
                const decision = await callbacks.onBeforePipRestore(context);
                // Send response back to native
                const nativeModule = NativeVideoModule;
                if (nativeModule.respondToPipRestore) {
                    nativeModule.respondToPipRestore(this, callbackId, decision);
                }
            }
            catch (error) {
                console.error('Error in onBeforePipRestore callback:', error);
                // Send rejection response on error
                const nativeModule = NativeVideoModule;
                if (nativeModule.respondToPipRestore) {
                    nativeModule.respondToPipRestore(this, callbackId, {
                        allowRestore: false,
                        metadata: { error: error.message },
                    });
                }
            }
        }
    });
    this.addListener('onAfterPipRestore', (event) => {
        if (callbacks.onAfterPipRestore) {
            callbacks.onAfterPipRestore(event.context);
        }
    });
    this.addListener('onPipRestoreFailed', (event) => {
        if (callbacks.onPipRestoreFailed) {
            callbacks.onPipRestoreFailed(event.error);
        }
    });
    // Call native method to register callbacks if platform supports it
    const nativeModule = NativeVideoModule;
    if (nativeModule.setPipRestoreCallbacks) {
        return nativeModule.setPipRestoreCallbacks(this, callbacks);
    }
};
NativeVideoModule.VideoPlayer.prototype.clearPipRestoreCallbacks = function () {
    this._pipRestoreCallbacks = null;
    // Call native method to clear callbacks if platform supports it
    const nativeModule = NativeVideoModule;
    if (nativeModule.clearPipRestoreCallbacks) {
        return nativeModule.clearPipRestoreCallbacks(this);
    }
};
NativeVideoModule.VideoPlayer.prototype.getPipRestoreCallbacks = function () {
    return this._pipRestoreCallbacks || null;
};
/**
 * Creates a direct instance of `VideoPlayer` that doesn't release automatically.
 *
 * > **info** For most use cases you should use the [`useVideoPlayer`](#usevideoplayer) hook instead. See the [Using the VideoPlayer Directly](#using-the-videoplayer-directly) section for more details.
 * @param source
 */
export function createVideoPlayer(source) {
    return new NativeVideoModule.VideoPlayer(parseSource(source));
}
/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export function useVideoPlayer(source, setup) {
    const parsedSource = parseSource(source);
    return useReleasingSharedObject(() => {
        const player = new NativeVideoModule.VideoPlayer(parsedSource);
        setup?.(player);
        return player;
    }, [JSON.stringify(parsedSource)]);
}
function parseSource(source) {
    if (typeof source === 'number') {
        // TODO(@kitten): This seems to not handle the `null` case. Is this correct?
        return { uri: resolveAssetSource(source).uri };
    }
    else if (typeof source === 'string') {
        return { uri: source };
    }
    if (typeof source?.assetId === 'number' && !source.uri) {
        // TODO(@kitten): This seems to not handle the `null` case. Is this correct?
        return { ...source, uri: resolveAssetSource(source.assetId).uri };
    }
    return source;
}
//# sourceMappingURL=VideoPlayer.js.map