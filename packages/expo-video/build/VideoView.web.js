import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { StyleSheet } from 'react-native';
/**
 * This audio context is used to mute all but one video when multiple video views are playing from one player simultaneously.
 * Using audio context nodes allows muting videos without displaying the mute icon in the video player.
 */
const audioContext = window && new window.AudioContext();
const zeroGainNode = audioContext && audioContext.createGain();
if (audioContext && zeroGainNode) {
    zeroGainNode.gain.value = 0;
    zeroGainNode.connect(audioContext.destination);
}
else {
    console.warn("Couldn't create AudioContext, this might affect the audio playback when using multiple video views with the same player.");
}
class VideoPlayerWeb extends globalThis.expo.SharedObject {
    constructor(source) {
        super();
        this.src = source;
    }
    src = null;
    _mountedVideos = new Set();
    _audioNodes = new Set();
    playing = false;
    _muted = false;
    _volume = 1;
    _loop = false;
    _playbackRate = 1.0;
    _preservesPitch = true;
    _status = 'idle';
    staysActiveInBackground = false; // Not supported on web. Dummy to match the interface.
    set muted(value) {
        this._mountedVideos.forEach((video) => {
            video.muted = value;
        });
        this._muted = value;
    }
    get muted() {
        return this._muted;
    }
    set playbackRate(value) {
        this._mountedVideos.forEach((video) => {
            video.playbackRate = value;
        });
    }
    get playbackRate() {
        return this._playbackRate;
    }
    set volume(value) {
        this._mountedVideos.forEach((video) => {
            video.volume = value;
        });
        this._volume = value;
    }
    get volume() {
        this._mountedVideos.forEach((video) => {
            this._volume = video.volume;
        });
        return this._volume;
    }
    set loop(value) {
        this._mountedVideos.forEach((video) => {
            video.loop = value;
        });
        this._loop = value;
    }
    get loop() {
        return this._loop;
    }
    get currentTime() {
        // All videos should be synchronized, so we return the position of the first video.
        return [...this._mountedVideos][0].currentTime;
    }
    set currentTime(value) {
        this._mountedVideos.forEach((video) => {
            video.currentTime = value;
        });
    }
    get preservesPitch() {
        return this._preservesPitch;
    }
    set preservesPitch(value) {
        this._mountedVideos.forEach((video) => {
            video.preservesPitch = value;
        });
        this._preservesPitch = value;
    }
    get status() {
        return this._status;
    }
    mountVideoView(video) {
        this._mountedVideos.add(video);
        this._synchronizeWithFirstVideo(video);
        this._addListeners(video);
    }
    unmountVideoView(video) {
        const mountedVideos = [...this._mountedVideos];
        const mediaElementSources = [...this._audioNodes];
        const videoIndex = mountedVideos.findIndex((value) => value === video);
        const videoPlayingAudio = mountedVideos[0];
        this._mountedVideos.delete(video);
        this._audioNodes.delete(mediaElementSources[videoIndex]);
        // If video playing audio has been removed, select a new video to be the audio player by disconnecting it from the mute node.
        if (videoPlayingAudio === video && this._audioNodes.size > 0 && audioContext) {
            const newMainAudioSource = [...this._audioNodes][0];
            newMainAudioSource.disconnect();
            newMainAudioSource.connect(audioContext.destination);
        }
    }
    play() {
        this._mountedVideos.forEach((video) => {
            video.play();
        });
        this.playing = true;
    }
    pause() {
        this._mountedVideos.forEach((video) => {
            video.pause();
        });
        this.playing = false;
    }
    replace(source) {
        this._mountedVideos.forEach((video) => {
            const uri = getSourceUri(source);
            video.pause();
            if (uri) {
                video.setAttribute('src', uri);
                video.load();
                video.play();
            }
            else {
                video.removeAttribute('src');
            }
        });
        this.playing = true;
    }
    seekBy(seconds) {
        this._mountedVideos.forEach((video) => {
            video.currentTime += seconds;
        });
    }
    replay() {
        this._mountedVideos.forEach((video) => {
            video.currentTime = 0;
            video.play();
        });
        this.playing = true;
    }
    _synchronizeWithFirstVideo(video) {
        const firstVideo = [...this._mountedVideos][0];
        if (!firstVideo)
            return;
        video.currentTime = firstVideo.currentTime;
        video.volume = firstVideo.volume;
        video.muted = firstVideo.muted;
        video.playbackRate = firstVideo.playbackRate;
    }
    _addListeners(video) {
        video.onloadedmetadata = () => {
            if (!audioContext || !zeroGainNode)
                return;
            const source = audioContext.createMediaElementSource(video);
            this._audioNodes.add(source);
            // First mounted video should be connected to the audio context. All other videos have to be muted.
            if (this._audioNodes.size === 1) {
                source.connect(audioContext.destination);
            }
            else {
                source.connect(zeroGainNode);
            }
        };
        video.onplay = () => {
            this.playing = true;
            this._mountedVideos.forEach((mountedVideo) => {
                mountedVideo.play();
            });
        };
        video.onpause = () => {
            this.playing = false;
            this._mountedVideos.forEach((mountedVideo) => {
                mountedVideo.pause();
            });
        };
        video.onvolumechange = () => {
            this.volume = video.volume;
            this._muted = video.muted;
        };
        video.onseeking = () => {
            this._mountedVideos.forEach((mountedVideo) => {
                if (mountedVideo === video || mountedVideo.currentTime === video.currentTime)
                    return;
                mountedVideo.currentTime = video.currentTime;
            });
        };
        video.onseeked = () => {
            this._mountedVideos.forEach((mountedVideo) => {
                if (mountedVideo === video || mountedVideo.currentTime === video.currentTime)
                    return;
                mountedVideo.currentTime = video.currentTime;
            });
        };
        video.onratechange = () => {
            this._mountedVideos.forEach((mountedVideo) => {
                if (mountedVideo === video || mountedVideo.playbackRate === video.playbackRate)
                    return;
                this._playbackRate = video.playbackRate;
                mountedVideo.playbackRate = video.playbackRate;
            });
        };
        video.onerror = () => {
            this._status = 'error';
        };
        video.onloadeddata = () => {
            this._status = 'readyToPlay';
        };
        video.onwaiting = () => {
            this._status = 'loading';
        };
    }
}
function mapStyles(style) {
    const flattenedStyles = StyleSheet.flatten(style);
    // Looking through react-native-web source code they also just pass styles directly without further conversions, so it's just a cast.
    return flattenedStyles;
}
export function useVideoPlayer(source, setup) {
    const parsedSource = typeof source === 'string' ? { uri: source } : source;
    return useMemo(() => {
        const player = new VideoPlayerWeb(parsedSource);
        setup?.(player);
        return player;
    }, [JSON.stringify(source)]);
}
function getSourceUri(source) {
    if (typeof source == 'string') {
        return source;
    }
    return source?.uri ?? null;
}
export const VideoView = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    useImperativeHandle(ref, () => ({
        enterFullscreen: () => {
            if (!props.allowsFullscreen) {
                return;
            }
            videoRef.current?.requestFullscreen();
        },
        exitFullscreen: () => {
            document.exitFullscreen();
        },
    }));
    useEffect(() => {
        return () => {
            if (videoRef.current) {
                props.player?.unmountVideoView(videoRef.current);
            }
        };
    }, []);
    useEffect(() => {
        if (!props.player || !videoRef.current) {
            return;
        }
        props.player.mountVideoView(videoRef.current);
        return () => {
            if (videoRef.current) {
                props.player?.unmountVideoView(videoRef.current);
            }
        };
    }, [props.player]);
    return (<video controls={props.nativeControls} controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'} crossOrigin="anonymous" style={{
            ...mapStyles(props.style),
            objectFit: props.contentFit,
        }} ref={(newRef) => {
            // This is called with a null value before `player.unmountVideoView` is called,
            // we can't assign null to videoRef if we want to unmount it from the player.
            if (newRef) {
                videoRef.current = newRef;
            }
        }} src={getSourceUri(props.player?.src) ?? ''}/>);
});
export default VideoView;
//# sourceMappingURL=VideoView.web.js.map