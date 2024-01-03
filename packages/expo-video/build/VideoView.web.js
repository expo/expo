import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
/**
 * This audio context is used to mute all but one video when there is multiple video views playing from one player simultaneously.
 * Using audio context nodes allows us to mute the videos without showing the mute icon in the video player.
 */
const audioContext = new window.AudioContext();
const zeroGainNode = audioContext.createGain();
zeroGainNode.gain.value = 0;
zeroGainNode.connect(audioContext.destination);
class VideoPlayerWeb {
    constructor(source = null) {
        this.src = source;
    }
    src = null;
    _mountedVideos = new Set();
    _audioNodes = new Set();
    isPlaying = false;
    _isMuted = false;
    timestamp = 0;
    _volume = 1;
    set isMuted(value) {
        this._mountedVideos.forEach((video) => {
            video.muted = value;
        });
        this._isMuted = value;
    }
    get isMuted() {
        return this._isMuted;
    }
    set volume(value) {
        this._mountedVideos.forEach((video) => {
            video.volume = value;
            console.log('Setting to: ', value, 'current: ', video.volume);
        });
        this._volume = value;
    }
    get volume() {
        this._mountedVideos.forEach((video) => {
            this._volume = video.volume;
        });
        return this._volume;
    }
    mountVideoView(video) {
        this._mountedVideos.add(video);
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
        if (videoPlayingAudio === video && this._audioNodes.size > 0) {
            const newMainAudioSource = [...this._audioNodes][0];
            newMainAudioSource.disconnect();
            newMainAudioSource.connect(audioContext.destination);
        }
    }
    play() {
        this._mountedVideos.forEach((video) => {
            video.play();
        });
        this.isPlaying = true;
    }
    pause() {
        this._mountedVideos.forEach((video) => {
            video.pause();
        });
        this.isPlaying = false;
    }
    replace(source) {
        this._mountedVideos.forEach((video) => {
            video.pause();
            video.setAttribute('src', source);
            video.load();
            video.play();
        });
        this.isPlaying = true;
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
        this.isPlaying = true;
    }
    _addListeners(video) {
        video.onloadedmetadata = () => {
            const source = audioContext.createMediaElementSource(video);
            this._audioNodes.add(source);
            // First mounted video should be connected to the audio context. All other videos have to be muted.
            if (this._audioNodes.size === 1) {
                source.connect(audioContext.destination);
            }
            else {
                source.connect(zeroGainNode);
            }
            source.connect(zeroGainNode);
        };
    }
}
function mapStyles(style) {
    const flattenedStyles = StyleSheet.flatten(style);
    // Looking through react-native-web source code they also just pass styles directly without further conversions, so it's just a cast.
    return flattenedStyles;
}
export function useVideoPlayer(source = null) {
    return React.useMemo(() => {
        return new VideoPlayerWeb(source);
        // should this not include source?
    }, []);
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
    return (<video controls={props.nativeControls} controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'} style={{
            ...mapStyles(props.style),
            objectFit: props.contentFit,
        }} ref={(newRef) => {
            // This is called with a null value before `player.unmountVideoView` is called,
            // we can't assign null to videoRef if we want to unmount it from the player.
            if (newRef) {
                videoRef.current = newRef;
            }
        }} src={props.player?.src ?? ''}/>);
});
export default VideoView;
//# sourceMappingURL=VideoView.web.js.map