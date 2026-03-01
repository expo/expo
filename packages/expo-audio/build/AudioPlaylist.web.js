import { PLAYLIST_STATUS_UPDATE, TRACK_CHANGED } from './AudioEventKeys';
import { getSourceUri, nextId } from './AudioUtils.web';
import { resolveSource } from './utils/resolveSource';
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
        this._emitStatus();
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
//# sourceMappingURL=AudioPlaylist.web.js.map