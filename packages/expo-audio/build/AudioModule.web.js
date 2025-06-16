import { PermissionStatus } from 'expo-modules-core';
import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE } from './ExpoAudio';
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
        return PermissionStatus.UNDETERMINED;
    }
}
function getUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    const getUserMediaFn = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        function () {
            const error = new Error('Permission unimplemented');
            error.code = 0;
            error.name = 'NotAllowedError';
            throw error;
        };
    return new Promise((resolve, reject) => {
        // @ts-expect-error: legacy callback signature
        getUserMediaFn.call(navigator, constraints, resolve, reject);
    });
}
function getStatusFromMedia(media, id) {
    const isPlaying = !!(media.currentTime > 0 &&
        !media.paused &&
        !media.ended &&
        media.readyState > 2);
    return {
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
        shouldCorrectPitch: false,
        mute: media.muted,
        loop: media.loop,
    };
}
export class AudioPlayerWeb extends globalThis.expo.SharedObject {
    // Reuse a single AudioContext for all instances to avoid context leaks
    static sharedAudioContext = null;
    static getAudioContext() {
        if (!AudioPlayerWeb.sharedAudioContext) {
            AudioPlayerWeb.sharedAudioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            console.debug('Created new AudioContext');
        }
        return AudioPlayerWeb.sharedAudioContext;
    }
    constructor(source, interval) {
        super();
        this.src = source;
        this.interval = interval;
        this.media = this._createMediaElement();
    }
    id = nextId();
    isAudioSamplingSupported = true;
    isBuffering = false;
    shouldCorrectPitch = false;
    src = null;
    media;
    interval = 500;
    isPlaying = false;
    loaded = false;
    samplingFailedForSource = false;
    workletNode = null;
    workletSourceNode = null;
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
        console.log('play', this.interval);
        const ctx = AudioPlayerWeb.getAudioContext();
        if (ctx.state === 'suspended')
            ctx.resume();
        this.media.play();
        this.isPlaying = true;
        // reconnect meter branch
        if (this.workletNode && this.workletSourceNode) {
            try {
                this.workletSourceNode.connect(this.workletNode);
            }
            catch { }
        }
    }
    pause() {
        this.media.pause();
        this.isPlaying = false;
        // disconnect only from worklet to stop metering, keep audio output connected
        if (this.workletSourceNode && this.workletNode) {
            try {
                this.workletSourceNode.disconnect(this.workletNode);
            }
            catch { }
        }
    }
    replace(source) {
        this.cleanupSampling(false);
        this.samplingFailedForSource = false;
        this.src = source;
        this.media = this._createMediaElement();
    }
    async seekTo(seconds) {
        this.media.currentTime = seconds;
    }
    /**
     * Enable or disable audio sampling using AudioWorklet.
     * When enabling, if the worklet is already created, just reconnect the source node.
     * When disabling, only disconnect the source node, keeping the worklet alive.
     */
    async setAudioSamplingEnabled(enabled) {
        const ctx = AudioPlayerWeb.getAudioContext();
        if (enabled) {
            // If worklet already created, just reconnect source and return
            if (this.workletNode) {
                if (this.workletSourceNode) {
                    try {
                        // reconnect audio output
                        this.workletSourceNode.connect(ctx.destination);
                        // reconnect worklet for metering
                        this.workletSourceNode.connect(this.workletNode);
                    }
                    catch { }
                }
                this.isAudioSamplingSupported = true;
                return;
            }
            if (this.samplingFailedForSource)
                return;
            try {
                // inline the processor as a Blob so it runs in AudioWorkletGlobalScope
                const processorCode = `
  (function() {
    try {
      class MeterProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this._sum = 0;
          this._count = 0;
          this._lastRms = 0;
        }
        process(inputs) {
          const input = inputs[0] && inputs[0][0];
          if (input) {
            for (let i = 0; i < input.length; i++) {
              const s = input[i];
              this._sum += s * s;
              this._count++;
            }
            const FRAME_BATCH = Math.floor(sampleRate / 30); // ~30fps
            if (this._count >= FRAME_BATCH) {
              const rms = Math.sqrt(this._sum / this._count);
              const THRESH_RMS = 0.0005;
              if (Math.abs(rms - this._lastRms) > THRESH_RMS) {
                this.port.postMessage(rms);
                this._lastRms = rms;
              }
              this._sum = 0;
              this._count = 0;
            }
          }
          return true;
        }
      }
      registerProcessor('meter-processor', MeterProcessor);
    } catch (e) {
      // ignore already registered
    }
  })();
`;
                const blob = new Blob([processorCode], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                console.debug('AudioWorklet: loading inline worklet from Blob URL', blobUrl);
                await ctx.audioWorklet.addModule(blobUrl);
                console.debug('AudioWorklet: loaded inline worklet');
                // instantiate & wire up
                if (!this.workletNode) {
                    this.workletNode = new AudioWorkletNode(ctx, 'meter-processor');
                    this.workletNode.port.onmessage = (e) => {
                        const rms = e.data;
                        const status = getStatusFromMedia(this.media, this.id);
                        this.emit(AUDIO_SAMPLE_UPDATE, {
                            ...status,
                            channels: [{ frames: [rms] }],
                            timestamp: this.media.currentTime,
                        });
                    };
                }
                if (!this.workletSourceNode) {
                    this.workletSourceNode = ctx.createMediaElementSource(this.media);
                }
                // connect audio to destination
                this.workletSourceNode.connect(ctx.destination);
                // connect audio to worklet for metering
                this.workletSourceNode.connect(this.workletNode);
                this.isAudioSamplingSupported = true;
            }
            catch (err) {
                console.error('AudioWorklet: inline worklet failed', err);
                this.isAudioSamplingSupported = false;
                this.samplingFailedForSource = true;
            }
        }
        else {
            // disable sampling: disconnect source, keep worklet alive
            if (this.workletSourceNode) {
                try {
                    this.workletSourceNode.disconnect();
                }
                catch { }
            }
            this.isAudioSamplingSupported = false;
        }
    }
    cleanupSampling(recreateAudio = false) {
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode.port.onmessage = null;
            this.workletNode = null;
        }
        this.media.onpause = null;
        this.media.onplay = null;
        if (recreateAudio) {
            const currentTime = this.media.currentTime;
            const wasPlaying = !this.media.paused;
            this.media = this._createMediaElement();
            this.media.currentTime = currentTime;
            if (wasPlaying) {
                this.media.play();
            }
        }
    }
    setPlaybackRate(second, pitchCorrectionQuality) {
        this.media.playbackRate = second;
        this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
        this.media.preservesPitch = this.shouldCorrectPitch;
    }
    remove() {
        this.cleanupSampling(false);
        this.media.pause();
        this.media.removeAttribute('src');
        this.media.load();
        getStatusFromMedia(this.media, this.id);
    }
    _createMediaElement() {
        const newSource = getSourceUri(this.src);
        const media = new Audio(newSource);
        media.crossOrigin = 'anonymous';
        let lastEmitTime = 0;
        const intervalSec = this.interval / 1000;
        media.ontimeupdate = () => {
            const now = media.currentTime;
            // detect loop or big seek
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
            lastEmitTime = media.currentTime; // reset throttle
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                playing: this.isPlaying,
            });
        };
        media.onpause = () => {
            this.isPlaying = false;
            lastEmitTime = media.currentTime; // reset throttle
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                playing: this.isPlaying,
            });
        };
        media.onseeked = () => {
            lastEmitTime = media.currentTime; // user seeked
        };
        media.onended = () => {
            lastEmitTime = 0; // looped
        };
        media.onloadeddata = () => {
            this.loaded = true;
            lastEmitTime = media.currentTime; // initial load
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                isLoaded: this.loaded,
            });
        };
        return media;
    }
}
function getSourceUri(source) {
    if (typeof source === 'string')
        return source;
    if (typeof source === 'number')
        return resolveAssetSource(source)?.uri;
    if (typeof source?.assetId === 'number' && !source?.uri)
        return resolveAssetSource(source.assetId)?.uri;
    return source?.uri;
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
        if (!this.mediaRecorder) {
            throw new Error('Cannot start an audio recording without initializing a MediaRecorder.');
        }
        if (this.mediaRecorder.state === 'paused')
            this.mediaRecorder.resume();
        else
            this.mediaRecorder.start();
    }
    getAvailableInputs() {
        return [];
    }
    getCurrentInput() {
        return { type: 'Default', name: 'Default', uid: 'Default' };
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
        if (!this.mediaRecorder)
            throw new Error('Cannot pause without initializing MediaRecorder.');
        this.mediaRecorder.pause();
    }
    recordForDuration(seconds) {
        this.record();
        this.timeoutIds.push(setTimeout(() => this.stop(), seconds * 1000));
    }
    setInput(input) { }
    startRecordingAtTime(seconds) {
        this.timeoutIds.push(setTimeout(() => this.record(), seconds * 1000));
    }
    async stop() {
        if (!this.mediaRecorder)
            throw new Error('Cannot stop without initializing MediaRecorder.');
        const dataPromise = new Promise((resolve) => this.mediaRecorder?.addEventListener('dataavailable', (e) => resolve(e.data)));
        this.mediaRecorder.stop();
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
        if (typeof navigator !== 'undefined' && !navigator.mediaDevices)
            throw new Error('No media devices available');
        this.mediaRecorderUptimeOfLastStartResume = 0;
        this.currentTime = 0;
        const stream = await getUserMedia({ audio: true });
        const mediaRecorder = new window.MediaRecorder(stream, options.web || RecordingPresets.HIGH_QUALITY.web);
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
        mediaRecorder.addEventListener('stop', () => {
            this.currentTime = 0;
            this.mediaRecorderIsRecording = false;
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
        return { status: PermissionStatus.GRANTED, expires: 'never', canAskAgain: true, granted: true };
    }
    catch {
        return { status: PermissionStatus.DENIED, expires: 'never', canAskAgain: true, granted: false };
    }
}
//# sourceMappingURL=AudioModule.web.js.map