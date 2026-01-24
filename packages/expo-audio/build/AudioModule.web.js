import { Asset } from 'expo-asset';
import { PermissionStatus } from 'expo-modules-core';
import { PLAYBACK_STATUS_UPDATE, PLAYLIST_STATUS_UPDATE, RECORDING_STATUS_UPDATE, TRACK_CHANGED, } from './AudioEventKeys';
import { RecordingPresets } from './RecordingConstants';
import { resolveSource } from './utils/resolveSource';
const nextId = (() => {
    let id = 0;
    return () => String(id++);
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
        // TODO(@kitten): The types indicates that this is incorrect.
        // Please check whether this is correct!
        // @ts-expect-error: The `successCallback` doesn't match a `resolve` function
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
export class AudioPlayerWeb extends globalThis.expo.SharedObject {
    constructor(source, options = {}) {
        super();
        const { updateInterval = 500, crossOrigin } = options;
        this.src = source;
        this.interval = Math.max(updateInterval, 1);
        this.crossOrigin = crossOrigin;
        this.media = this._createMediaElement();
    }
    id = nextId();
    isAudioSamplingSupported = false;
    isBuffering = false;
    shouldCorrectPitch = false;
    src = null;
    media;
    interval = 500;
    isPlaying = false;
    loaded = false;
    crossOrigin;
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
        return this.media.duration;
    }
    get currentTime() {
        return this.media.currentTime;
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
        const wasPlaying = this.isPlaying;
        // we need to remove the current media element and create a new one
        this.remove();
        this.src = source;
        this.isPlaying = false;
        this.loaded = false;
        this.media = this._createMediaElement();
        // Resume playback if it was playing before
        if (wasPlaying) {
            this.play();
        }
    }
    async seekTo(seconds, toleranceMillisBefore, toleranceMillisAfter) {
        this.media.currentTime = seconds;
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
        // Clear event handlers to prevent memory leaks
        this.media.ontimeupdate = null;
        this.media.onplay = null;
        this.media.onpause = null;
        this.media.onseeked = null;
        this.media.onended = null;
        this.media.onloadeddata = null;
        this.media.onerror = null;
        this.media.removeAttribute('src');
        this.media.load();
    }
    setActiveForLockScreen(active, metadata) { }
    updateLockScreenMetadata(metadata) { }
    clearLockScreenControls() { }
    _createMediaElement() {
        const newSource = getSourceUri(this.src);
        const media = new Audio(newSource);
        if (this.crossOrigin !== undefined) {
            media.crossOrigin = this.crossOrigin;
        }
        let lastEmitTime = 0;
        const intervalSec = this.interval / 1000;
        // Throttled status updates based on interval
        media.ontimeupdate = () => {
            const now = media.currentTime;
            // Handle backwards time (loop/seek)
            if (now < lastEmitTime) {
                lastEmitTime = now;
            }
            if (now - lastEmitTime >= intervalSec) {
                lastEmitTime = now;
                this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
            }
        };
        media.onplay = () => {
            this.isPlaying = true;
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                playing: this.isPlaying,
            });
        };
        media.onpause = () => {
            this.isPlaying = false;
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                playing: this.isPlaying,
            });
        };
        media.onseeked = () => {
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
        };
        media.onended = () => {
            lastEmitTime = 0;
        };
        media.onloadeddata = () => {
            this.loaded = true;
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                isLoaded: this.loaded,
            });
        };
        media.onerror = () => {
            this.loaded = false;
            this.isPlaying = false;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                isLoaded: false,
                playing: false,
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
        const asset = Asset.fromModule(source);
        return asset.uri;
    }
    if (typeof source?.assetId === 'number' && !source?.uri) {
        const asset = Asset.fromModule(source.assetId);
        return asset.uri;
    }
    return source?.uri ?? undefined;
}
function getSourceInfo(source) {
    const resolved = resolveSource(source);
    if (resolved && typeof resolved === 'object') {
        return {
            uri: resolved.uri,
            name: resolved.name,
        };
    }
    return { uri: getSourceUri(source) };
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
    record(options) {
        if (this.mediaRecorder === null) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.');
        }
        // Clear any existing timeouts
        this.clearTimeouts();
        // Note: atTime is not supported on Web (no native equivalent), so we ignore it entirely
        // Only forDuration is implemented using setTimeout
        const { forDuration } = options || {};
        this.startActualRecording();
        if (forDuration !== undefined) {
            this.timeoutIds.push(setTimeout(() => {
                this.stop();
            }, forDuration * 1000));
        }
    }
    startActualRecording() {
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
        return Promise.resolve({
            type: 'Default',
            name: 'Default',
            uid: 'Default',
        });
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
        this.record({ forDuration: seconds });
    }
    setInput(input) { }
    startRecordingAtTime(seconds) {
        this.record({ atTime: seconds });
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
        const defaults = RecordingPresets.HIGH_QUALITY.web;
        const mediaRecorderOptions = {};
        const mimeType = options.mimeType ?? defaults.mimeType;
        if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
            mediaRecorderOptions.mimeType = mimeType;
        }
        if (options.bitsPerSecond) {
            mediaRecorderOptions.bitsPerSecond = options.bitsPerSecond;
        }
        else if (options.bitRate) {
            mediaRecorderOptions.audioBitsPerSecond = options.bitRate;
        }
        else {
            mediaRecorderOptions.bitsPerSecond = defaults.bitsPerSecond;
        }
        const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
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
export class AudioPlaylistWeb extends globalThis.expo.SharedObject {
    constructor(initialSources = [], updateInterval = 500, loopMode = 'none', crossOrigin) {
        super();
        this._updateInterval = Math.max(updateInterval, 1);
        this._loopMode = loopMode;
        this._crossOrigin = crossOrigin;
        for (const source of initialSources) {
            this._sources.push(source);
            this._sourceInfos.push(getSourceInfo(source));
        }
        if (this._sources.length > 0) {
            this._currentMedia = this._createMediaElement(this._sources[0]);
            this._preloadNext();
        }
    }
    id = nextId();
    _sources = [];
    _sourceInfos = [];
    _currentIndex = 0;
    _currentMedia = null;
    _nextMedia = null;
    _updateInterval = 500;
    _loopMode = 'none';
    _isPlaying = false;
    _isLoaded = false;
    _isBuffering = false;
    _volume = 1;
    _muted = false;
    _playbackRate = 1;
    _crossOrigin;
    _knownDuration = 0;
    get currentIndex() {
        return this._currentIndex;
    }
    get trackCount() {
        return this._sources.length;
    }
    get sources() {
        return [...this._sourceInfos];
    }
    get playing() {
        return this._isPlaying;
    }
    get muted() {
        return this._muted;
    }
    set muted(value) {
        this._muted = value;
        if (this._currentMedia) {
            this._currentMedia.muted = value;
        }
    }
    get isLoaded() {
        return this._isLoaded;
    }
    get isBuffering() {
        return this._isBuffering;
    }
    get currentTime() {
        return this._currentMedia?.currentTime ?? 0;
    }
    get duration() {
        return this._knownDuration;
    }
    get volume() {
        return this._volume;
    }
    set volume(value) {
        this._volume = value;
        if (this._currentMedia) {
            this._currentMedia.volume = value;
        }
    }
    get playbackRate() {
        return this._playbackRate;
    }
    set playbackRate(value) {
        this._playbackRate = value;
        if (this._currentMedia) {
            this._currentMedia.playbackRate = value;
        }
    }
    get loop() {
        return this._loopMode;
    }
    set loop(value) {
        this._loopMode = value;
    }
    get currentStatus() {
        return this._getStatus();
    }
    play() {
        if (!this._currentMedia || this._sources.length === 0) {
            return;
        }
        this._currentMedia.play();
        this._isPlaying = true;
    }
    pause() {
        if (this._currentMedia) {
            this._currentMedia.pause();
            this._isPlaying = false;
        }
    }
    next() {
        if (this._sources.length === 0)
            return;
        const previousIndex = this._currentIndex;
        let nextIndex = this._currentIndex + 1;
        if (nextIndex >= this._sources.length) {
            if (this._loopMode === 'all') {
                nextIndex = 0;
            }
            else {
                return;
            }
        }
        this._transitionToTrack(nextIndex, previousIndex);
    }
    previous() {
        if (this._sources.length === 0)
            return;
        const previousIndex = this._currentIndex;
        let prevIndex = this._currentIndex - 1;
        if (prevIndex < 0) {
            if (this._loopMode === 'all') {
                prevIndex = this._sources.length - 1;
            }
            else {
                return;
            }
        }
        this._transitionToTrack(prevIndex, previousIndex);
    }
    skipTo(index) {
        if (index < 0 || index >= this._sources.length) {
            return;
        }
        if (index === this._currentIndex) {
            return;
        }
        const previousIndex = this._currentIndex;
        this._transitionToTrack(index, previousIndex);
    }
    async seekTo(seconds) {
        if (this._currentMedia) {
            this._currentMedia.currentTime = seconds;
        }
    }
    add(source) {
        this._sources.push(source);
        this._sourceInfos.push(getSourceInfo(source));
        if (this._sources.length === 1) {
            this._currentMedia = this._createMediaElement(source);
        }
        else {
            this._preloadNext();
        }
        this._emitStatus();
    }
    insert(source, index) {
        if (index < 0)
            index = 0;
        if (index > this._sources.length)
            index = this._sources.length;
        this._sources.splice(index, 0, source);
        this._sourceInfos.splice(index, 0, getSourceInfo(source));
        if (index <= this._currentIndex && this._sources.length > 1) {
            this._currentIndex++;
        }
        if (this._sources.length === 1) {
            this._currentMedia = this._createMediaElement(source);
        }
        else {
            this._preloadNext();
        }
        this._emitStatus();
    }
    remove(index) {
        if (index < 0 || index >= this._sources.length) {
            return;
        }
        const wasCurrentTrack = index === this._currentIndex;
        const wasPlaying = this._isPlaying;
        this._sources.splice(index, 1);
        this._sourceInfos.splice(index, 1);
        if (this._sources.length === 0) {
            this._cleanupMedia(this._currentMedia);
            this._currentMedia = null;
            this._cleanupMedia(this._nextMedia);
            this._nextMedia = null;
            this._currentIndex = 0;
            this._isPlaying = false;
            this._isLoaded = false;
            this._knownDuration = 0;
        }
        else if (wasCurrentTrack) {
            this._cleanupMedia(this._currentMedia);
            if (this._currentIndex >= this._sources.length) {
                this._currentIndex = this._sources.length - 1;
            }
            this._knownDuration = 0;
            this._currentMedia = this._createMediaElement(this._sources[this._currentIndex]);
            if (wasPlaying) {
                this._currentMedia.play();
            }
            this._preloadNext();
        }
        else if (index < this._currentIndex) {
            this._currentIndex--;
            this._preloadNext();
        }
        else {
            this._preloadNext();
        }
        this._emitStatus();
    }
    clear() {
        this._cleanupMedia(this._currentMedia);
        this._currentMedia = null;
        this._cleanupMedia(this._nextMedia);
        this._nextMedia = null;
        this._sources = [];
        this._sourceInfos = [];
        this._currentIndex = 0;
        this._isPlaying = false;
        this._isLoaded = false;
        this._knownDuration = 0;
        this._emitStatus();
    }
    setPlaybackRate(rate) {
        this.playbackRate = rate;
    }
    setLoopMode(mode) {
        this._loopMode = mode;
        this._emitStatus();
    }
    destroy() {
        this.clear();
    }
    _transitionToTrack(newIndex, previousIndex) {
        const wasPlaying = this._isPlaying;
        if (this._currentMedia) {
            this._currentMedia.pause();
            this._cleanupMedia(this._currentMedia);
        }
        this._currentIndex = newIndex;
        this._isLoaded = false;
        this._isBuffering = true;
        this._knownDuration = 0;
        const isNextSequential = newIndex === (previousIndex + 1) % this._sources.length;
        if (this._nextMedia && isNextSequential) {
            this._currentMedia = this._nextMedia;
            this._attachMediaHandlers(this._currentMedia);
            this._nextMedia = null;
        }
        else {
            this._cleanupMedia(this._nextMedia);
            this._nextMedia = null;
            this._currentMedia = this._createMediaElement(this._sources[newIndex]);
        }
        if (wasPlaying) {
            this._currentMedia.play();
            this._isPlaying = true;
        }
        this._preloadNext();
        this.emit(TRACK_CHANGED, { previousIndex, currentIndex: newIndex });
        this._emitStatus();
    }
    _preloadNext() {
        if (this._nextMedia) {
            this._cleanupMedia(this._nextMedia);
            this._nextMedia = null;
        }
        // No need to preload if single track or 'single' loop mode
        if (this._sources.length <= 1 || this._loopMode === 'single') {
            return;
        }
        let nextIndex = this._currentIndex + 1;
        if (nextIndex >= this._sources.length) {
            if (this._loopMode === 'all') {
                nextIndex = 0;
            }
            else {
                return;
            }
        }
        const uri = getSourceUri(this._sources[nextIndex]);
        if (uri) {
            this._nextMedia = new Audio(uri);
            if (this._crossOrigin !== undefined) {
                this._nextMedia.crossOrigin = this._crossOrigin;
            }
            this._nextMedia.preload = 'auto';
            this._nextMedia.volume = this._volume;
            this._nextMedia.muted = this._muted;
            this._nextMedia.playbackRate = this._playbackRate;
        }
    }
    _cleanupMedia(media) {
        if (!media)
            return;
        media.pause();
        media.ontimeupdate = null;
        media.onplay = null;
        media.onpause = null;
        media.onseeked = null;
        media.onended = null;
        media.onloadedmetadata = null;
        media.onloadeddata = null;
        media.onwaiting = null;
        media.oncanplaythrough = null;
        media.onerror = null;
        media.removeAttribute('src');
        media.load();
    }
    _attachMediaHandlers(media) {
        let lastEmitTime = 0;
        const intervalSec = this._updateInterval / 1000;
        if (media.readyState >= 1) {
            const duration = media.duration;
            if (!isNaN(duration) && isFinite(duration)) {
                this._knownDuration = duration;
            }
        }
        media.ontimeupdate = () => {
            const now = media.currentTime;
            if (now < lastEmitTime) {
                lastEmitTime = now;
            }
            if (now - lastEmitTime >= intervalSec) {
                lastEmitTime = now;
                this._emitStatus();
            }
        };
        media.onplay = () => {
            this._isPlaying = true;
            lastEmitTime = media.currentTime;
            this._emitStatus();
        };
        media.onpause = () => {
            if (!media.ended) {
                this._isPlaying = false;
            }
            lastEmitTime = media.currentTime;
            this._emitStatus();
        };
        media.onseeked = () => {
            lastEmitTime = media.currentTime;
            this._emitStatus();
        };
        media.onended = () => {
            lastEmitTime = 0;
            this._handleTrackEnded();
        };
        media.onloadedmetadata = () => {
            const duration = media.duration;
            if (!isNaN(duration) && isFinite(duration)) {
                this._knownDuration = duration;
                this._emitStatus();
            }
        };
        media.onloadeddata = () => {
            this._isLoaded = true;
            this._isBuffering = false;
            lastEmitTime = media.currentTime;
            this._emitStatus();
        };
        media.onwaiting = () => {
            this._isBuffering = true;
            this._emitStatus();
        };
        media.oncanplaythrough = () => {
            this._isBuffering = false;
            this._emitStatus();
        };
        media.onerror = () => {
            this._isLoaded = false;
            this._isBuffering = false;
            this._isPlaying = false;
            this._emitStatus();
        };
    }
    _createMediaElement(source) {
        const uri = getSourceUri(source);
        const media = new Audio(uri);
        if (this._crossOrigin !== undefined) {
            media.crossOrigin = this._crossOrigin;
        }
        media.volume = this._volume;
        media.muted = this._muted;
        media.playbackRate = this._playbackRate;
        this._attachMediaHandlers(media);
        return media;
    }
    _handleTrackEnded() {
        if (this._loopMode === 'single') {
            if (this._currentMedia) {
                this._currentMedia.currentTime = 0;
                this._currentMedia.play();
            }
            return;
        }
        const isLastTrack = this._currentIndex >= this._sources.length - 1;
        if (isLastTrack) {
            if (this._loopMode === 'all') {
                this._transitionToTrack(0, this._currentIndex);
            }
            else {
                this._isPlaying = false;
                this.emit(PLAYLIST_STATUS_UPDATE, {
                    ...this._getStatus(),
                    didJustFinish: true,
                });
            }
        }
        else {
            this._transitionToTrack(this._currentIndex + 1, this._currentIndex);
        }
    }
    _getStatus() {
        return {
            id: this.id,
            currentIndex: this._currentIndex,
            trackCount: this._sources.length,
            currentTime: this._currentMedia?.currentTime ?? 0,
            duration: this._knownDuration,
            playing: this._isPlaying,
            isBuffering: this._isBuffering,
            isLoaded: this._isLoaded,
            playbackRate: this._playbackRate,
            muted: this._muted,
            volume: this._volume,
            loop: this._loopMode,
            didJustFinish: false,
        };
    }
    _emitStatus() {
        this.emit(PLAYLIST_STATUS_UPDATE, this._getStatus());
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
export default {
    AudioPlayer: AudioPlayerWeb,
    AudioRecorder: AudioRecorderWeb,
    AudioPlaylist: AudioPlaylistWeb,
    setAudioModeAsync,
    setIsAudioActiveAsync,
    getRecordingPermissionsAsync,
    requestRecordingPermissionsAsync,
};
//# sourceMappingURL=AudioModule.web.js.map