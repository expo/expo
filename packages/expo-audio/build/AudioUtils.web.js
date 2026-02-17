import { Asset } from 'expo-asset';
export const nextId = (() => {
    let id = 0;
    return () => id++;
})();
let audioContext = null;
export function getAudioContext() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
}
export function getUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    // First get ahold of the legacy getUserMedia, if present
    const getUserMedia = 
    // TODO: this method is deprecated, migrate to https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        function () {
            const error = new Error('Permission unimplemented');
            error.code = 0;
            error.name = 'NotAllowedError';
            throw error;
        };
    return new Promise((resolve, reject) => {
        // TODO(@kitten): The types indicates that this is incorrect.
        // Please check whether this is correct!
        // @ts-expect-error: The `successCallback` doesn't match a `resolve` function
        getUserMedia.call(navigator, constraints, resolve, reject);
    });
}
export function getStatusFromMedia(media, id) {
    const isPlaying = !!(media.currentTime > 0 &&
        !media.paused &&
        !media.ended &&
        media.readyState > 2);
    const status = {
        id,
        isLoaded: true,
        duration: media.duration,
        currentTime: media.currentTime,
        playbackState: '',
        timeControlStatus: isPlaying ? 'playing' : 'paused',
        reasonForWaitingToPlay: '',
        playing: isPlaying,
        didJustFinish: media.ended,
        isBuffering: false,
        playbackRate: media.playbackRate,
        shouldCorrectPitch: true,
        mute: media.muted,
        loop: media.loop,
    };
    return status;
}
export function getSourceUri(source) {
    if (typeof source === 'string') {
        return source;
    }
    if (typeof source === 'number') {
        const asset = Asset.fromModule(source);
        return asset.uri;
    }
    if (typeof source?.assetId === 'number' && !source?.uri) {
        const asset = Asset.fromModule(source.assetId);
        return asset.uri;
    }
    return source?.uri ?? undefined;
}
//# sourceMappingURL=AudioUtils.web.js.map