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

export const VideoView = forwardRef((props: { player?: VideoPlayer } & VideoViewProps, ref) => {
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const mediaNodeRef = useRef<null | MediaElementAudioSourceNode>(null);

  /**
   * Audio context is used to mute all but one video when multiple video views are playing from one player simultaneously.
   * Using audio context nodes allows muting videos without displaying the mute icon in the video player.
   * We have to keep the context that called createMediaElementSource(videoRef), as the method can't be called
   * for the second time with another context and there is no way to unbind the video and audio context afterward.
   */
  const audioContextRef = useRef<null | AudioContext>(null);
  const zeroGainNodeRef = useRef<null | GainNode>(null);

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
    const audioContext = audioContextRef.current;
    const zeroGainNode = zeroGainNodeRef.current;
    const mediaNode = mediaNodeRef.current;

    if (videoRef.current) {
      props.player?.mountVideoView(videoRef.current);
    }

    if (audioContext && zeroGainNode && mediaNode) {
      props.player.mountAudioNode(audioContext, zeroGainNode, mediaNode);
    } else {
      console.warn(
        "Couldn't mount audio node, this might affect the audio playback when using multiple video views with the same player."
      );
    }

    return () => {
      if (videoRef.current) {
        props.player?.unmountVideoView(videoRef.current);
      }
      if (videoRef.current && audioContext && mediaNode) {
        props.player?.unmountAudioNode(videoRef.current, audioContext, mediaNode);
      }
    };
  }, [props.player]);

  return (
    <video
      controls={props.nativeControls}
      controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'}
      crossOrigin="anonymous"
      style={{
        ...mapStyles(props.style),
        objectFit: props.contentFit,
      }}
      ref={(newRef) => {
        // This is called with a null value before `player.unmountVideoView` is called,
        // we can't assign null to videoRef if we want to unmount it from the player.
        if (newRef && !newRef.isEqualNode(videoRef.current)) {
          videoRef.current = newRef;
          const audioContext = createAudioContext();
          audioContextRef.current = audioContext;
          zeroGainNodeRef.current = createZeroGainNode(audioContextRef.current);
          mediaNodeRef.current = audioContext
            ? audioContext.createMediaElementSource(newRef)
            : null;
        }
      }}
      src={getSourceUri(props.player?.src) ?? ''}
    />
  );
});

export default VideoView;
