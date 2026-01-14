import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import { getSourceUri } from './VideoPlayer.web';
function createAudioContext() {
    return typeof window !== 'undefined' ? new window.AudioContext() : null;
}
function createZeroGainNode(audioContext) {
    const zeroGainNode = audioContext?.createGain() ?? null;
    if (audioContext && zeroGainNode) {
        zeroGainNode.gain.value = 0;
        zeroGainNode.connect(audioContext.destination);
    }
    return zeroGainNode;
}
function mapStyles(style) {
    const flattenedStyles = StyleSheet.flatten(style);
    // Looking through react-native-web source code they also just pass styles directly without further conversions, so it's just a cast.
    return flattenedStyles;
}
export function isPictureInPictureSupported() {
    return typeof document === 'object' && typeof document.exitPictureInPicture === 'function';
}
export const VideoView = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    const mediaNodeRef = useRef(null);
    const hasToSetupAudioContext = useRef(false);
    const fullscreenChangeListeners = useRef(null);
    const isWaitingForFirstFrame = useRef(false);
    const mountedPlayerRef = useRef(null);
    /**
     * Audio context is used to mute all but one video when multiple video views are playing from one player simultaneously.
     * Using audio context nodes allows muting videos without displaying the mute icon in the video player.
     * We have to keep the context that called createMediaElementSource(videoRef), as the method can't be called
     * for the second time with another context and there is no way to unbind the video and audio context afterward.
     */
    const audioContextRef = useRef(null);
    const zeroGainNodeRef = useRef(null);
    useEffect(() => {
        if (props.useAudioNodePlayback) {
            maybeSetupAudioContext();
            attachAudioNodes();
        }
        else {
            detachAudioNodes();
        }
    }, [props.useAudioNodePlayback]);
    useImperativeHandle(ref, () => ({
        enterFullscreen: async () => {
            // Cast the video to any to avoid ts errors. Methods such as webkitRequestFullscreen,
            // webkitEnterFullScreen, msRequestFullscreen are not typed even though they exist.
            const video = videoRef.current;
            if (video.requestFullscreen) {
                await video.requestFullscreen();
            }
            else if (video.webkitRequestFullscreen) {
                // @ts-ignore webkitRequestFullscreen can exist on Apple devices
                await video.webkitRequestFullscreen();
            }
            else if (video.webkitEnterFullScreen) {
                await video.webkitEnterFullScreen();
            }
            else if (video.msRequestFullscreen) {
                await video.msRequestFullscreen();
            }
        },
        exitFullscreen: async () => {
            await document.exitFullscreen();
        },
        startPictureInPicture: async () => {
            await videoRef.current?.requestPictureInPicture();
        },
        stopPictureInPicture: async () => {
            try {
                await document.exitPictureInPicture();
            }
            catch (e) {
                if (e instanceof DOMException && e.name === 'InvalidStateError') {
                    console.warn('The VideoView is not in Picture-in-Picture mode.');
                }
                else {
                    throw e;
                }
            }
        },
        nativeRef: videoRef,
    }));
    useEffect(() => {
        const onEnter = () => {
            props.onPictureInPictureStart?.();
        };
        const onLeave = () => {
            props.onPictureInPictureStop?.();
        };
        const onLoadStart = () => {
            isWaitingForFirstFrame.current = true;
        };
        const onCanPlay = () => {
            if (isWaitingForFirstFrame.current) {
                props.onFirstFrameRender?.();
            }
            isWaitingForFirstFrame.current = false;
        };
        videoRef.current?.addEventListener('enterpictureinpicture', onEnter);
        videoRef.current?.addEventListener('leavepictureinpicture', onLeave);
        videoRef.current?.addEventListener('loadstart', onLoadStart);
        videoRef.current?.addEventListener('loadeddata', onCanPlay);
        return () => {
            videoRef.current?.removeEventListener('enterpictureinpicture', onEnter);
            videoRef.current?.removeEventListener('leavepictureinpicture', onLeave);
            videoRef.current?.removeEventListener('loadstart', onLoadStart);
            videoRef.current?.removeEventListener('loadeddata', onCanPlay);
        };
    }, [videoRef, props.onPictureInPictureStop, props.onPictureInPictureStart]);
    // Adds the video view as a candidate for being the audio source for the player (when multiple views play from one
    // player only one will emit audio).
    function attachAudioNodes() {
        if (!props.useAudioNodePlayback) {
            return;
        }
        const audioContext = audioContextRef.current;
        const zeroGainNode = zeroGainNodeRef.current;
        const mediaNode = mediaNodeRef.current;
        if (audioContext && zeroGainNode && mediaNode) {
            props.player?.mountAudioNode(audioContext, zeroGainNode, mediaNode);
        }
        else {
            console.warn("Couldn't mount audio node, this might affect the audio playback when using multiple video views with the same player.");
        }
    }
    function detachAudioNodes() {
        if (!props.useAudioNodePlayback) {
            return;
        }
        const audioContext = audioContextRef.current;
        const mediaNode = mediaNodeRef.current;
        if (audioContext && mediaNode && videoRef.current) {
            props.player?.unmountAudioNode(videoRef.current, audioContext, mediaNode);
        }
    }
    function maybeSetupAudioContext() {
        // Not all browsers support the UserActivation API, so check it exists before we access it.
        // If the API doesn't exist then we'll continue as if the user has been active.
        const userHasNotBeenActive = 'userActivation' in navigator && !navigator.userActivation.hasBeenActive;
        if (!hasToSetupAudioContext.current ||
            userHasNotBeenActive ||
            !videoRef.current ||
            !props.useAudioNodePlayback) {
            return;
        }
        const audioContext = createAudioContext();
        detachAudioNodes();
        audioContextRef.current = audioContext;
        zeroGainNodeRef.current = createZeroGainNode(audioContextRef.current);
        mediaNodeRef.current = audioContext
            ? audioContext.createMediaElementSource(videoRef.current)
            : null;
        attachAudioNodes();
        hasToSetupAudioContext.current = false;
    }
    function fullscreenListener() {
        if (document.fullscreenElement === videoRef.current) {
            props.onFullscreenEnter?.();
        }
        else {
            props.onFullscreenExit?.();
        }
    }
    function setupFullscreenListener() {
        cleanupFullscreenListener();
        const video = videoRef.current;
        if (!video)
            return;
        const fullscreenListeners = {
            default: fullscreenListener,
            safariEnter: () => props.onFullscreenEnter?.(),
            safariExit: () => props.onFullscreenExit?.(),
            msListener: fullscreenListener,
        };
        fullscreenChangeListeners.current = fullscreenListeners;
        // Standard Fullscreen API
        video.addEventListener('fullscreenchange', fullscreenListeners.default);
        // Safari (webkit)
        video.addEventListener('webkitbeginfullscreen', fullscreenListeners.safariEnter);
        video.addEventListener('webkitendfullscreen', fullscreenListeners.safariExit);
        // IE11 (ms)
        document.addEventListener('MSFullscreenChange', fullscreenListeners.msListener);
    }
    function cleanupFullscreenListener() {
        const video = videoRef.current;
        if (!video || !fullscreenChangeListeners.current)
            return;
        video.removeEventListener('fullscreenchange', fullscreenChangeListeners.current.default);
        video.removeEventListener('webkitbeginfullscreen', fullscreenChangeListeners.current?.safariEnter);
        video.removeEventListener('webkitendfullscreen', fullscreenChangeListeners.current.safariExit);
        document.removeEventListener('MSFullscreenChange', fullscreenChangeListeners.current.msListener);
    }
    useEffect(() => {
        videoRef.current && mountedPlayerRef.current?.unmountVideoView(videoRef.current);
        if (videoRef.current) {
            props.player?.mountVideoView(videoRef.current);
        }
        setupFullscreenListener();
        attachAudioNodes();
        mountedPlayerRef.current = props.player ?? null;
        if (props.player == null) {
            videoRef.current?.removeAttribute('src');
            videoRef.current?.load();
        }
        return () => {
            if (videoRef.current) {
                props.player?.unmountVideoView(videoRef.current);
            }
            mountedPlayerRef.current = null;
            cleanupFullscreenListener();
            detachAudioNodes();
        };
    }, [props.player]);
    return (<video controls={props.nativeControls ?? true} controlsList={props.fullscreenOptions?.enable ? undefined : 'nofullscreen'} crossOrigin={props.crossOrigin} style={{
            ...mapStyles(props.style),
            objectFit: props.contentFit,
        }} onPlay={() => {
            maybeSetupAudioContext();
        }} 
    // The player can autoplay when muted, unmuting by a user should create the audio context
    onVolumeChange={() => {
            maybeSetupAudioContext();
        }} ref={(newRef) => {
            // This is called with a null value before `player.unmountVideoView` is called,
            // we can't assign null to videoRef if we want to unmount it from the player.
            if (newRef && !newRef.isEqualNode(videoRef.current)) {
                videoRef.current = newRef;
                hasToSetupAudioContext.current = props.useAudioNodePlayback ?? false;
                maybeSetupAudioContext();
            }
        }} disablePictureInPicture={!props.allowsPictureInPicture} playsInline={props.playsInline} src={getSourceUri(props.player?.src) ?? undefined}/>);
});
export default VideoView;
//# sourceMappingURL=VideoView.web.js.map