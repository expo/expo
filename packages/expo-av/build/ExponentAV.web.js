import { PermissionStatus, SyntheticPlatformEmitter } from 'expo-modules-core';
import { RECORDING_OPTIONS_PRESET_HIGH_QUALITY } from './Audio/RecordingConstants';
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
    catch (error) {
        // FireFox - TypeError: 'microphone' (value of 'name' member of PermissionDescriptor) is not a valid value for enumeration PermissionName.
        return PermissionStatus.UNDETERMINED;
    }
}
function getUserMedia(constraints) {
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
        getUserMedia.call(navigator, constraints, resolve, reject);
    });
}
function getStatusFromMedia(media) {
    if (!media) {
        return {
            isLoaded: false,
            error: undefined,
        };
    }
    const isPlaying = !!(media.currentTime > 0 &&
        !media.paused &&
        !media.ended &&
        media.readyState > 2);
    const status = {
        isLoaded: true,
        uri: media.src,
        progressUpdateIntervalMillis: 100,
        durationMillis: media.duration * 1000,
        positionMillis: media.currentTime * 1000,
        // playableDurationMillis: media.buffered * 1000,
        // seekMillisToleranceBefore?: number
        // seekMillisToleranceAfter?: number
        shouldPlay: media.autoplay,
        isPlaying,
        isBuffering: false,
        rate: media.playbackRate,
        // TODO: Bacon: This seems too complicated right now: https://webaudio.github.io/web-audio-api/#dom-biquadfilternode-frequency
        shouldCorrectPitch: false,
        volume: media.volume,
        isMuted: media.muted,
        isLooping: media.loop,
        didJustFinish: media.ended,
    };
    return status;
}
function setStatusForMedia(media, status) {
    if (status.positionMillis !== undefined) {
        media.currentTime = status.positionMillis / 1000;
    }
    // if (status.progressUpdateIntervalMillis !== undefined) {
    //   media.progressUpdateIntervalMillis = status.progressUpdateIntervalMillis;
    // }
    // if (status.seekMillisToleranceBefore !== undefined) {
    //   media.seekMillisToleranceBefore = status.seekMillisToleranceBefore;
    // }
    // if (status.seekMillisToleranceAfter !== undefined) {
    //   media.seekMillisToleranceAfter = status.seekMillisToleranceAfter;
    // }
    // if (status.shouldCorrectPitch !== undefined) {
    //   media.shouldCorrectPitch = status.shouldCorrectPitch;
    // }
    if (status.shouldPlay !== undefined) {
        if (status.shouldPlay) {
            media.play();
        }
        else {
            media.pause();
        }
    }
    if (status.rate !== undefined) {
        media.playbackRate = status.rate;
    }
    if (status.volume !== undefined) {
        media.volume = status.volume;
    }
    if (status.isMuted !== undefined) {
        media.muted = status.isMuted;
    }
    if (status.isLooping !== undefined) {
        media.loop = status.isLooping;
    }
    return getStatusFromMedia(media);
}
let mediaRecorder = null;
let mediaRecorderUptimeOfLastStartResume = 0;
let mediaRecorderDurationAlreadyRecorded = 0;
let mediaRecorderIsRecording = false;
function getAudioRecorderDurationMillis() {
    let duration = mediaRecorderDurationAlreadyRecorded;
    if (mediaRecorderIsRecording && mediaRecorderUptimeOfLastStartResume > 0) {
        duration += Date.now() - mediaRecorderUptimeOfLastStartResume;
    }
    return duration;
}
export default {
    get name() {
        return 'ExponentAV';
    },
    async getStatusForVideo(element) {
        return getStatusFromMedia(element);
    },
    async loadForVideo(element, nativeSource, fullInitialStatus) {
        return getStatusFromMedia(element);
    },
    async unloadForVideo(element) {
        return getStatusFromMedia(element);
    },
    async setStatusForVideo(element, status) {
        return setStatusForMedia(element, status);
    },
    async replayVideo(element, status) {
        return setStatusForMedia(element, status);
    },
    /* Audio */
    async setAudioMode() { },
    async setAudioIsEnabled() { },
    async getStatusForSound(element) {
        return getStatusFromMedia(element);
    },
    async loadForSound(nativeSource, fullInitialStatus) {
        const source = typeof nativeSource === 'string' ? nativeSource : nativeSource.uri;
        const media = new Audio(source);
        media.ontimeupdate = () => {
            SyntheticPlatformEmitter.emit('didUpdatePlaybackStatus', {
                key: media,
                status: getStatusFromMedia(media),
            });
        };
        media.onerror = () => {
            SyntheticPlatformEmitter.emit('ExponentAV.onError', {
                key: media,
                error: media.error.message,
            });
        };
        const status = setStatusForMedia(media, fullInitialStatus);
        return [media, status];
    },
    async unloadForSound(element) {
        element.pause();
        element.removeAttribute('src');
        element.load();
        return getStatusFromMedia(element);
    },
    async setStatusForSound(element, status) {
        return setStatusForMedia(element, status);
    },
    async replaySound(element, status) {
        return setStatusForMedia(element, status);
    },
    /* Recording */
    //   async setUnloadedCallbackForAndroidRecording() {},
    async getAudioRecordingStatus() {
        return {
            canRecord: mediaRecorder?.state === 'recording' || mediaRecorder?.state === 'inactive',
            isRecording: mediaRecorder?.state === 'recording',
            isDoneRecording: false,
            durationMillis: getAudioRecorderDurationMillis(),
            uri: null,
        };
    },
    async prepareAudioRecorder(options) {
        if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
            throw new Error('No media devices available');
        }
        mediaRecorderUptimeOfLastStartResume = 0;
        mediaRecorderDurationAlreadyRecorded = 0;
        const stream = await getUserMedia({ audio: true });
        mediaRecorder = new window.MediaRecorder(stream, options?.web || RECORDING_OPTIONS_PRESET_HIGH_QUALITY.web);
        mediaRecorder.addEventListener('pause', () => {
            mediaRecorderDurationAlreadyRecorded = getAudioRecorderDurationMillis();
            mediaRecorderIsRecording = false;
        });
        mediaRecorder.addEventListener('resume', () => {
            mediaRecorderUptimeOfLastStartResume = Date.now();
            mediaRecorderIsRecording = true;
        });
        mediaRecorder.addEventListener('start', () => {
            mediaRecorderUptimeOfLastStartResume = Date.now();
            mediaRecorderDurationAlreadyRecorded = 0;
            mediaRecorderIsRecording = true;
        });
        mediaRecorder.addEventListener('stop', () => {
            mediaRecorderDurationAlreadyRecorded = getAudioRecorderDurationMillis();
            mediaRecorderIsRecording = false;
            // Clears recording icon in Chrome tab
            stream.getTracks().forEach((track) => track.stop());
        });
        const { uri, ...status } = await this.getAudioRecordingStatus();
        return { uri: null, status };
    },
    async startAudioRecording() {
        if (mediaRecorder === null) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.');
        }
        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
        else {
            mediaRecorder.start();
        }
        return this.getAudioRecordingStatus();
    },
    async pauseAudioRecording() {
        if (mediaRecorder === null) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.');
        }
        // Set status to paused
        mediaRecorder.pause();
        return this.getAudioRecordingStatus();
    },
    async stopAudioRecording() {
        if (mediaRecorder === null) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.');
        }
        if (mediaRecorder.state === 'inactive') {
            return this.getAudioRecordingStatus();
        }
        const dataPromise = new Promise((resolve) => mediaRecorder.addEventListener('dataavailable', (e) => resolve(e.data)));
        mediaRecorder.stop();
        const data = await dataPromise;
        const url = URL.createObjectURL(data);
        return {
            ...(await this.getAudioRecordingStatus()),
            uri: url,
        };
    },
    async unloadAudioRecorder() {
        mediaRecorder = null;
    },
    async getPermissionsAsync() {
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
                return await this.requestPermissionsAsync();
        }
    },
    async requestPermissionsAsync() {
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
        catch (e) {
            return {
                status: PermissionStatus.DENIED,
                expires: 'never',
                canAskAgain: true,
                granted: false,
            };
        }
    },
};
//# sourceMappingURL=ExponentAV.web.js.map