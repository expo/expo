import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE } from './AudioEventKeys';
import { getAudioContext, getSourceUri, getStatusFromMedia, nextId } from './AudioUtils.web';
import { mediaSessionController } from './MediaSessionController.web';
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
    analyser = null;
    sourceNode = null;
    samplingFrameId = null;
    samplingEnabled = false;
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
        const wasSampling = this.samplingEnabled;
        const mediaSessionState = mediaSessionController.getActiveState(this);
        // we need to remove the current media element and create a new one
        this.remove();
        this.src = source;
        this.isPlaying = false;
        this.loaded = false;
        this.media = this._createMediaElement();
        if (wasSampling) {
            this.setAudioSamplingEnabled(true);
        }
        if (mediaSessionState) {
            mediaSessionController.setActivePlayer(this, mediaSessionState.metadata ?? undefined, mediaSessionState.options ?? undefined);
        }
        // Resume playback if it was playing before
        if (wasPlaying) {
            this.play();
        }
    }
    async seekTo(seconds, toleranceMillisBefore, toleranceMillisAfter) {
        this.media.currentTime = seconds;
    }
    setAudioSamplingEnabled(enabled) {
        if (enabled) {
            if (!this.media.crossOrigin && this._isCrossOrigin()) {
                this.isAudioSamplingSupported = false;
                return;
            }
            if (this.analyser) {
                return;
            }
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            if (!this.sourceNode) {
                this.sourceNode = ctx.createMediaElementSource(this.media);
            }
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.sourceNode.disconnect();
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(ctx.destination);
            const buffer = new Float32Array(this.analyser.frequencyBinCount);
            const sampleLoop = () => {
                if (!this.analyser) {
                    return;
                }
                if (this.isPlaying) {
                    this.analyser.getFloatTimeDomainData(buffer);
                    this.emit(AUDIO_SAMPLE_UPDATE, {
                        channels: [{ frames: Array.from(buffer) }],
                        timestamp: this.media.currentTime,
                    });
                }
                this.samplingFrameId = requestAnimationFrame(sampleLoop);
            };
            this.samplingFrameId = requestAnimationFrame(sampleLoop);
            this.samplingEnabled = true;
            this.isAudioSamplingSupported = true;
        }
        else {
            if (this.samplingFrameId != null) {
                cancelAnimationFrame(this.samplingFrameId);
                this.samplingFrameId = null;
            }
            if (this.analyser) {
                this.analyser.disconnect();
                this.analyser = null;
            }
            if (this.sourceNode) {
                const ctx = getAudioContext();
                this.sourceNode.disconnect();
                this.sourceNode.connect(ctx.destination);
            }
            this.samplingEnabled = false;
        }
    }
    setPlaybackRate(second, pitchCorrectionQuality) {
        this.media.playbackRate = second;
        this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
        this.media.preservesPitch = this.shouldCorrectPitch;
        mediaSessionController.updatePositionState(this);
    }
    remove() {
        mediaSessionController.clear(this);
        if (this.samplingFrameId != null) {
            cancelAnimationFrame(this.samplingFrameId);
            this.samplingFrameId = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this.samplingEnabled = false;
        this.media.pause();
        this.media.removeAttribute('src');
        this.media.load();
        getStatusFromMedia(this.media, this.id);
    }
    setActiveForLockScreen(active, metadata, options) {
        if (active) {
            mediaSessionController.setActivePlayer(this, metadata, options);
        }
        else {
            mediaSessionController.clear(this);
        }
    }
    updateLockScreenMetadata(metadata) {
        mediaSessionController.updateMetadata(this, metadata);
    }
    clearLockScreenControls() {
        mediaSessionController.clear(this);
    }
    _isCrossOrigin() {
        try {
            return new URL(this.media.src).origin !== window.location.origin;
        }
        catch {
            return false;
        }
    }
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
                mediaSessionController.updatePositionState(this);
            }
        };
        media.onplay = () => {
            this.isPlaying = true;
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                playing: this.isPlaying,
            });
            mediaSessionController.updatePlaybackState(this);
            mediaSessionController.updatePositionState(this);
        };
        media.onpause = () => {
            this.isPlaying = false;
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                playing: this.isPlaying,
            });
            mediaSessionController.updatePlaybackState(this);
            mediaSessionController.updatePositionState(this);
        };
        media.onseeked = () => {
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
            mediaSessionController.updatePositionState(this);
        };
        media.onended = () => {
            lastEmitTime = 0;
            mediaSessionController.updatePlaybackState(this);
        };
        media.onloadeddata = () => {
            this.loaded = true;
            lastEmitTime = media.currentTime;
            this.emit(PLAYBACK_STATUS_UPDATE, {
                ...getStatusFromMedia(media, this.id),
                isLoaded: this.loaded,
            });
            mediaSessionController.updatePositionState(this);
        };
        return media;
    }
}
//# sourceMappingURL=AudioPlayer.web.js.map