import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
class VideoPlayerImpl {
    src = null;
    mountedVideos = new Set();
    isPlaying = false;
    _isMuted = false;
    set isMuted(value) {
        this.mountedVideos.forEach((video) => {
            video.muted = value;
        });
        this._isMuted = value;
    }
    get isMuted() {
        return this._isMuted;
    }
    timestamp = 0;
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
    constructor(source = null) {
        this.src = source;
    }
}
export function useVideoPlayer(source = null) {
    return React.useMemo(() => {
        return new VideoPlayerImpl(source);
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
        if (!props.player || !videoRef.current)
            return;
        props.player.mountedVideos.add(videoRef.current);
        return () => {
            if (videoRef.current) {
                props.player?.mountedVideos.delete(videoRef.current);
            }
        };
    }, [props.player]);
    return (<video {...props} controls={props.nativeControls} controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'} ref={videoRef} src={props.player?.src ?? ''}/>);
});
export default VideoView;
//# sourceMappingURL=VideoView.web.js.map