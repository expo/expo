import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';

import VideoPlayer, { getSourceUri } from './VideoPlayer.web';
import type { VideoViewProps } from './VideoView.types';

function createAudioContext(): AudioContext | null {
  return typeof window !== 'undefined' ? new window.AudioContext() : null;
}

function createZeroGainNode(audioContext: AudioContext | null): GainNode | null {
  const zeroGainNode = audioContext?.createGain() ?? null;

  if (audioContext && zeroGainNode) {
    zeroGainNode.gain.value = 0;
    zeroGainNode.connect(audioContext.destination);
  }
  return zeroGainNode;
}

function mapStyles(style: VideoViewProps['style']): React.CSSProperties {
  const flattenedStyles = StyleSheet.flatten(style);
  // Looking through react-native-web source code they also just pass styles directly without further conversions, so it's just a cast.
  return flattenedStyles as React.CSSProperties;
}

export function isPictureInPictureSupported(): boolean {
  return typeof document === 'object' && typeof document.exitPictureInPicture === 'function';
}

export const VideoView = forwardRef((props: { player?: VideoPlayer } & VideoViewProps, ref) => {
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const mediaNodeRef = useRef<null | MediaElementAudioSourceNode>(null);
  const hasToSetupAudioContext = useRef(false);
  const fullscreenChangeListener = useRef<null | (() => void)>(null);

  /**
   * Audio context is used to mute all but one video when multiple video views are playing from one player simultaneously.
   * Using audio context nodes allows muting videos without displaying the mute icon in the video player.
   * We have to keep the context that called createMediaElementSource(videoRef), as the method can't be called
   * for the second time with another context and there is no way to unbind the video and audio context afterward.
   */
  const audioContextRef = useRef<null | AudioContext>(null);
  const zeroGainNodeRef = useRef<null | GainNode>(null);

  useImperativeHandle(ref, () => ({
    enterFullscreen: async () => {
      if (!props.allowsFullscreen) {
        return;
      }
      await videoRef.current?.requestFullscreen();
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
      } catch (e) {
        if (e instanceof DOMException && e.name === 'InvalidStateError') {
          console.warn('The VideoView is not in Picture-in-Picture mode.');
        } else {
          throw e;
        }
      }
    },
  }));

  useEffect(() => {
    const onEnter = () => {
      props.onPictureInPictureStart?.();
    };
    const onLeave = () => {
      props.onPictureInPictureStop?.();
    };
    videoRef.current?.addEventListener('enterpictureinpicture', onEnter);
    videoRef.current?.addEventListener('leavepictureinpicture', onLeave);

    return () => {
      videoRef.current?.removeEventListener('enterpictureinpicture', onEnter);
      videoRef.current?.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [videoRef, props.onPictureInPictureStop, props.onPictureInPictureStart]);

  // Adds the video view as a candidate for being the audio source for the player (when multiple views play from one
  // player only one will emit audio).
  function attachAudioNodes() {
    const audioContext = audioContextRef.current;
    const zeroGainNode = zeroGainNodeRef.current;
    const mediaNode = mediaNodeRef.current;

    if (audioContext && zeroGainNode && mediaNode) {
      props.player.mountAudioNode(audioContext, zeroGainNode, mediaNode);
    } else {
      console.warn(
        "Couldn't mount audio node, this might affect the audio playback when using multiple video views with the same player."
      );
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
    if (
      !hasToSetupAudioContext.current ||
      !navigator.userActivation.hasBeenActive ||
      !videoRef.current
    ) {
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
    } else {
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

  return (
    <video
      controls={props.nativeControls ?? true}
      controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'}
      crossOrigin="anonymous"
      style={{
        ...mapStyles(props.style),
        objectFit: props.contentFit,
      }}
      onPlay={() => {
        maybeSetupAudioContext();
      }}
      // The player can autoplay when muted, unmuting by a user should create the audio context
      onVolumeChange={() => {
        maybeSetupAudioContext();
      }}
      ref={(newRef) => {
        // This is called with a null value before `player.unmountVideoView` is called,
        // we can't assign null to videoRef if we want to unmount it from the player.
        if (newRef && !newRef.isEqualNode(videoRef.current)) {
          videoRef.current = newRef;
          hasToSetupAudioContext.current = true;
          maybeSetupAudioContext();
        }
      }}
      disablePictureInPicture={!props.allowsPictureInPicture}
      src={getSourceUri(props.player?.src) ?? ''}
    />
  );
});

export default VideoView;
