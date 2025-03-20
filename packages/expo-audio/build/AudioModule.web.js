import { PermissionStatus } from 'expo-modules-core';
import { PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE } from './ExpoAudio';
import { RecordingPresets } from './RecordingConstants';
import resolveAssetSource from './utils/resolveAssetSource';
const nextId = (() => {
    let id = 0;
    return () => id++;
})();
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
function getStatusFromMedia(media, id) {
    const isPlaying = !!(media.currentTime > 0 &&
        !media.paused &&
        !media.ended &&
        media.readyState > 2);
    const status = {
        id,
        isLoaded: true,
        duration: media.duration * 1000,
        currentTime: media.currentTime * 1000,
        playbackState: '',
        timeControlStatus: isPlaying ? 'playing' : 'paused',
        currentQueueIndex: null,
        reasonForWaitingToPlay: '',
        playing: isPlaying,
        didJustFinish: media.ended,
        isBuffering: false,
        playbackRate: media.playbackRate,
        shouldCorrectPitch: false,
        mute: media.muted,
        loop: media.loop,
    };
    return status;
}
export class AudioPlayerWeb extends globalThis.expo.SharedObject {
    constructor(source, interval) {
        super();
        this.src = source;
        this.interval = interval;
        this.media = this._createMediaElement();
        if (source) {
            this.queue = [source];
            this.currentQueueIndex = 0;
        }
    }
    id = nextId();
    isAudioSamplingSupported = false;
    isBuffering = false;
    shouldCorrectPitch = false;
    src = null;
    media;
    interval = 100;
    isPlaying = false;
    loaded = false;
    queue = [];
    currentQueueIndex = -1;
    get playing() {
        return this.isPlaying;
    }
    get muted() {
        return this.media.muted;
    }
    set muted(value) {
        this.media.muted = value;
    }
    get loop() {
        return this.media.loop;
    }
    set loop(value) {
        this.media.loop = value;
    }
    get duration() {
        return this.media.duration * 1000;
    }
    get currentTime() {
        return this.media.currentTime * 1000;
    }
    get paused() {
        return this.media.paused;
    }
    get isLoaded() {
        return this.loaded;
    }
    get playbackRate() {
        return this.media.playbackRate;
    }
    set playbackRate(value) {
        this.media.playbackRate = value;
    }
    get volume() {
        return this.media.volume;
    }
    set volume(value) {
        this.media.volume = value;
    }
    get currentStatus() {
        return getStatusFromMedia(this.media, this.id);
    }
    play() {
        this.media.play();
        this.isPlaying = true;
    }
    pause() {
        this.media.pause();
        this.isPlaying = false;
    }
    replace(source) {
        this.src = source;
        this.media = this._createMediaElement();
    }
    clearQueue() {
        this.queue = [];
        this.currentQueueIndex = -1;
        this.pause();
        this.media.src = '';
        this.loaded = false;
        // Emit status update
        // this._emitStatusUpdate({
        //   currentTime: 0,
        //   duration: 0,
        //   isLoaded: false,
        //   isPlaying: false,
        // });
    }
    setQueue(sources) {
        if (!sources || sources.length === 0) {
            return;
        }
        this.queue = sources.filter((source) => source);
        this._loadTrackAtIndex(0);
    }
    getCurrentQueue() {
        return [...this.queue];
    }
    getCurrentQueueIndex() {
        if (this.currentQueueIndex >= 0) {
            return this.currentQueueIndex;
        }
        return null;
    }
    addToQueue(sources, insertBeforeIndex) {
        if (!sources || sources.length === 0) {
            return;
        }
        if (insertBeforeIndex !== undefined &&
            insertBeforeIndex >= 0 &&
            insertBeforeIndex <= this.queue.length) {
            this.queue.splice(insertBeforeIndex, 0, ...sources);
            // Adjust queue index
            if (this.currentQueueIndex >= 0 && insertBeforeIndex <= this.currentQueueIndex) {
                this.currentQueueIndex += sources.length;
            }
        }
        else {
            this.queue.push(...sources);
        }
        // set index to 0 if previously reset
        if (this.currentQueueIndex === -1) {
            this._loadTrackAtIndex(0);
        }
    }
    removeFromQueue(sources) {
        if (!sources || sources.length === 0 || this.queue.length === 0)
            return;
        const urisToRemove = new Set(sources.map((source) => typeof source === 'string'
            ? source
            : typeof source === 'number'
                ? String(source)
                : source?.uri || ''));
        // Find indices to remove
        const indicesToRemove = [];
        this.queue.forEach((source, index) => {
            const uri = typeof source === 'string'
                ? source
                : typeof source === 'number'
                    ? String(source)
                    : source?.uri || '';
            if (urisToRemove.has(uri)) {
                indicesToRemove.push(index);
            }
        });
        // Sort in descending order to remove from end first
        indicesToRemove.sort((a, b) => b - a);
        // Remove items
        for (const index of indicesToRemove) {
            this.queue.splice(index, 1);
        }
        // Handle current index adjustments
        if (indicesToRemove.includes(this.currentQueueIndex) ||
            this.currentQueueIndex >= this.queue.length) {
            if (this.queue.length === 0) {
                this.clearQueue();
                return;
            }
            // If current track was removed, play the next track or the first track
            const nextIndex = Math.min(this.currentQueueIndex, this.queue.length - 1);
            this.currentQueueIndex = nextIndex;
            this._loadTrackAtIndex(nextIndex);
            return;
        }
        // Adjust current index if items were removed before it
        const removedBeforeCurrent = indicesToRemove.filter((index) => index < this.currentQueueIndex);
        if (removedBeforeCurrent.length > 0) {
            this.currentQueueIndex -= removedBeforeCurrent.length;
        }
    }
    skipToNext() {
        if (this.queue.length === 0 || this.currentQueueIndex === -1) {
            return;
        }
        const nextIndex = (this.currentQueueIndex + 1) % this.queue.length;
        this._loadTrackAtIndex(nextIndex);
    }
    skipToPrevious() {
        if (this.queue.length === 0 || this.currentQueueIndex === -1) {
            return;
        }
        const prevIndex = (this.currentQueueIndex - 1 + this.queue.length) % this.queue.length;
        this._loadTrackAtIndex(prevIndex);
    }
    skipToQueueIndex(index) {
        if (index < 0 || index >= this.queue.length) {
            return;
        }
        this._loadTrackAtIndex(index);
    }
    async seekTo(seconds) {
        this.media.currentTime = seconds / 1000;
    }
    _loadTrackAtIndex(index) {
        console.log('hello');
        if (index < 0 || index >= this.queue.length)
            return;
        const wasPlaying = this.isPlaying;
        this.currentQueueIndex = index;
        this.src = this.queue[index];
        this.media = this._createMediaElement();
        // Resume playback if it was playing before
        if (wasPlaying) {
            this.play();
        }
    }
    // Not supported on web
    setAudioSamplingEnabled(enabled) {
        this.isAudioSamplingSupported = false;
    }
    setPlaybackRate(second, pitchCorrectionQuality) {
        this.media.playbackRate = second;
        this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
        this.media.preservesPitch = this.shouldCorrectPitch;
    }
    remove() {
        this.media.pause();
        this.media.removeAttribute('src');
        this.media.load();
        getStatusFromMedia(this.media, this.id);
    }
    _createMediaElement() {
        const newSource = getSourceUri(this.src);
        const media = new Audio(newSource);
        media.ontimeupdate = () => {
            this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
        };
        media.onloadeddata = () => {
            this.loaded = true;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                isLoaded: this.loaded,
            });
        };
        return media;
    }
}
function getSourceUri(source) {
    if (typeof source === 'string') {
        return source;
    }
    if (typeof source === 'number') {
        return resolveAssetSource(source)?.uri ?? undefined;
    }
    if (typeof source?.assetId === 'number' && !source?.uri) {
        return resolveAssetSource(source.assetId)?.uri ?? undefined;
    }
    return source?.uri ?? undefined;
}
export class AudioRecorderWeb extends globalThis.expo.SharedObject {
    constructor(options) {
        super();
        this.options = options;
    }
    async setup() {
        this.mediaRecorder = await this.createMediaRecorder(this.options);
    }
    id = nextId();
    currentTime = 0;
    uri = null;
    options;
    mediaRecorder = null;
    mediaRecorderUptimeOfLastStartResume = 0;
    mediaRecorderIsRecording = false;
    timeoutIds = [];
    get isRecording() {
        return this.mediaRecorder?.state === 'recording';
    }
    record() {
        if (this.mediaRecorder === null) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.');
        }
        if (this.mediaRecorder?.state === 'paused') {
            this.mediaRecorder.resume();
        }
        else {
            this.mediaRecorder?.start();
        }
    }
    getAvailableInputs() {
        return [];
    }
    getCurrentInput() {
        return {
            type: 'Default',
            name: 'Default',
            uid: 'Default',
        };
    }
    async prepareToRecordAsync() {
        return this.setup();
    }
    getStatus() {
        return {
            canRecord: this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'inactive',
            isRecording: this.mediaRecorder?.state === 'recording',
            durationMillis: this.getAudioRecorderDurationMillis(),
            mediaServicesDidReset: false,
            url: this.uri,
        };
    }
    pause() {
        if (this.mediaRecorder === null) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.');
        }
        this.mediaRecorder?.pause();
    }
    recordForDuration(seconds) {
        this.record();
        this.timeoutIds.push(setTimeout(() => {
            this.stop();
        }, seconds * 1000));
    }
    setInput(input) { }
    startRecordingAtTime(seconds) {
        this.timeoutIds.push(setTimeout(() => {
            this.record();
        }, seconds * 1000));
    }
    async stop() {
        if (this.mediaRecorder === null) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.');
        }
        const dataPromise = new Promise((resolve) => this.mediaRecorder?.addEventListener('dataavailable', (e) => resolve(e.data)));
        this.mediaRecorder?.stop();
        this.mediaRecorder = null;
        const data = await dataPromise;
        const url = URL.createObjectURL(data);
        this.uri = url;
        this.emit(RECORDING_STATUS_UPDATE, {
            id: this.id,
            isFinished: true,
            hasError: false,
            error: null,
            url,
        });
    }
    clearTimeouts() {
        this.timeoutIds.forEach((id) => clearTimeout(id));
    }
    async createMediaRecorder(options) {
        if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
            throw new Error('No media devices available');
        }
        this.mediaRecorderUptimeOfLastStartResume = 0;
        this.currentTime = 0;
        const stream = await getUserMedia({ audio: true });
        const mediaRecorder = new window.MediaRecorder(stream, options?.web || RecordingPresets.HIGH_QUALITY.web);
        mediaRecorder.addEventListener('pause', () => {
            this.currentTime = this.getAudioRecorderDurationMillis();
            this.mediaRecorderIsRecording = false;
        });
        mediaRecorder.addEventListener('resume', () => {
            this.mediaRecorderUptimeOfLastStartResume = Date.now();
            this.mediaRecorderIsRecording = true;
        });
        mediaRecorder.addEventListener('start', () => {
            this.mediaRecorderUptimeOfLastStartResume = Date.now();
            this.currentTime = 0;
            this.mediaRecorderIsRecording = true;
        });
        mediaRecorder?.addEventListener('stop', () => {
            this.currentTime = 0;
            this.mediaRecorderIsRecording = false;
            // Clears recording icon in Chrome tab
            stream.getTracks().forEach((track) => track.stop());
        });
        return mediaRecorder;
    }
    getAudioRecorderDurationMillis() {
        let duration = this.currentTime;
        if (this.mediaRecorderIsRecording && this.mediaRecorderUptimeOfLastStartResume > 0) {
            duration += Date.now() - this.mediaRecorderUptimeOfLastStartResume;
        }
        return duration;
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