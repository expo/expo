import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
class VideoPlayerWeb {
    constructor(source = null) {
        this.src = source;
    }
    src = null;
    mountedVideos = new Set();
    isPlaying = false;
    _isMuted = false;
    timestamp = 0;
    volume = 1;
    set isMuted(value) {
        this.mountedVideos.forEach((video) => {
            video.muted = value;
        });
        this._isMuted = value;
    }
    get isMuted() {
        return this._isMuted;
    }
    play() {
        this.mountedVideos.forEach((video) => {
            video.play();
        });
        this.isPlaying = true;
    }
    pause() {
        this.mountedVideos.forEach((video) => {
            video.pause();
        });
        this.isPlaying = false;
    }
    replace(source) {
        this.mountedVideos.forEach((video) => {
            video.pause();
            video.setAttribute('src', source);
            video.load();
            video.play();
        });
        this.isPlaying = true;
    }
    seekBy(seconds) {
        this.mountedVideos.forEach((video) => {
            video.currentTime += seconds;
        });
    }
    replay() {
        this.mountedVideos.forEach((video) => {
            video.currentTime = 0;
            video.play();
        });
        this.isPlaying = true;
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
        if (!props.player || !videoRef.current) {
            return;
        }
        props.player.mountedVideos.add(videoRef.current);
        return () => {
            if (videoRef.current) {
                props.player?.mountedVideos.delete(videoRef.current);
            }
        };
    }, [props.player]);
    return (<video controls={props.nativeControls} controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'} style={{
            ...mapStyles(props.style),
            objectFit: props.contentFit,
        }} ref={videoRef} src={props.player?.src ?? ''}/>);
});
export default VideoView;
//# sourceMappingURL=VideoView.web.js.map