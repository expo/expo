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
export const VideoView = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    const mediaNodeRef = useRef(null);
    const hasToSetupAudioContext = useRef(false);
    const fullscreenChangeListener = useRef(null);
    /**
     * Audio context is used to mute all but one video when multiple video views are playing from one player simultaneously.
     * Using audio context nodes allows muting videos without displaying the mute icon in the video player.
     * We have to keep the context that called createMediaElementSource(videoRef), as the method can't be called
     * for the second time with another context and there is no way to unbind the video and audio context afterward.
     */
    const audioContextRef = useRef(null);
    const zeroGainNodeRef = useRef(null);
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
    // Adds the video view as a candidate for being the audio source for the player (when multiple views play from one
    // player only one will emit audio).
    function attachAudioNodes() {
        const audioContext = audioContextRef.current;
        const zeroGainNode = zeroGainNodeRef.current;
        const mediaNode = mediaNodeRef.current;
        if (audioContext && zeroGainNode && mediaNode) {
            props.player.mountAudioNode(audioContext, zeroGainNode, mediaNode);
        }
        else {
            console.warn("Couldn't mount audio node, this might affect the audio playback when using multiple video views with the same player.");
        }
    }
    function detachAudioNodes() {
        const audioContext = audioContextRef.current;
        const mediaNode = mediaNodeRef.current;
        if (audioContext && mediaNode && videoRef.current) {
            props.player.unmountAudioNode(videoRef.current, audioContext, mediaNode);
        }
    }
    function maybeSetupAudioContext() {
        if (!hasToSetupAudioContext.current ||
            !navigator.userActivation.hasBeenActive ||
            !videoRef.current) {
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
        fullscreenChangeListener.current = fullscreenListener;
        videoRef.current?.addEventListener('fullscreenchange', fullscreenChangeListener.current);
    }
    function cleanupFullscreenListener() {
        if (fullscreenChangeListener.current) {
            videoRef.current?.removeEventListener('fullscreenchange', fullscreenChangeListener.current);
            fullscreenChangeListener.current = null;
        }
    }
    useEffect(() => {
        if (videoRef.current) {
            props.player?.mountVideoView(videoRef.current);
        }
        setupFullscreenListener();
        attachAudioNodes();
        return () => {
            if (videoRef.current) {
                props.player?.unmountVideoView(videoRef.current);
            }
            cleanupFullscreenListener();
            detachAudioNodes();
        };
    }, [props.player]);
    return (<video controls={props.nativeControls ?? true} controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'} crossOrigin="anonymous" style={{
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
                hasToSetupAudioContext.current = true;
                maybeSetupAudioContext();
            }
        }} src={getSourceUri(props.player?.src) ?? ''}/>);
});
export default VideoView;
//# sourceMappingURL=VideoView.web.js.map