import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import {
  VideoPlayerStatus,
  VideoPlayer,
  VideoSource,
  VideoViewProps,
  VideoPlayerEvents,
} from './VideoView.types';

function createAudioContext(): AudioContext | null {
  return typeof window !== 'undefined' ? new window.AudioContext() : null;
}

function createZeroGainNode(audioContext: AudioContext | null): GainNode | null {
  const zeroGainNode = audioContext && audioContext.createGain();

  if (audioContext && zeroGainNode) {
    zeroGainNode.gain.value = 0;
    zeroGainNode.connect(audioContext.destination);
  }
  return zeroGainNode;
}

class VideoPlayerWeb
  extends globalThis.expo.SharedObject<VideoPlayerEvents>
  implements VideoPlayer
{
  constructor(source: VideoSource) {
    super();
    this.src = source;
  }

  src: VideoSource = null;
  _mountedVideos: Set<HTMLVideoElement> = new Set();
  _audioNodes: Set<MediaElementAudioSourceNode> = new Set();
  playing: boolean = false;
  _muted: boolean = false;
  _volume: number = 1;
  _loop: boolean = false;
  _playbackRate: number = 1.0;
  _preservesPitch: boolean = true;
  _status: VideoPlayerStatus = 'idle';
  staysActiveInBackground: boolean = false; // Not supported on web. Dummy to match the interface.

  set muted(value: boolean) {
    this._mountedVideos.forEach((video) => {
      video.muted = value;
    });
    this._muted = value;
  }

  get muted(): boolean {
    return this._muted;
  }

  set playbackRate(value: number) {
    this._mountedVideos.forEach((video) => {
      video.playbackRate = value;
    });
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set volume(value: number) {
    this._mountedVideos.forEach((video) => {
      video.volume = value;
    });
    this._volume = value;
  }

  get volume(): number {
    this._mountedVideos.forEach((video) => {
      this._volume = video.volume;
    });
    return this._volume;
  }

  set loop(value: boolean) {
    this._mountedVideos.forEach((video) => {
      video.loop = value;
    });
    this._loop = value;
  }

  get loop(): boolean {
    return this._loop;
  }

  get currentTime(): number {
    // All videos should be synchronized, so we return the position of the first video.
    return [...this._mountedVideos][0].currentTime;
  }

  set currentTime(value: number) {
    this._mountedVideos.forEach((video) => {
      video.currentTime = value;
    });
  }

  get preservesPitch(): boolean {
    return this._preservesPitch;
  }

  set preservesPitch(value: boolean) {
    this._mountedVideos.forEach((video) => {
      video.preservesPitch = value;
    });
    this._preservesPitch = value;
  }

  get status(): VideoPlayerStatus {
    return this._status;
  }

  mountVideoView(video: HTMLVideoElement) {
    this._mountedVideos.add(video);
    this._addListeners(video);
    this._synchronizeWithFirstVideo(video);
  }

  unmountVideoView(video: HTMLVideoElement) {
    this._mountedVideos.delete(video);
  }

  mountAudioNode(
    audioContext: AudioContext,
    zeroGainNode: GainNode,
    audioSourceNode: MediaElementAudioSourceNode
  ): void {
    if (!audioContext || !zeroGainNode) return;

    this._audioNodes.add(audioSourceNode);
    // First mounted video should be connected to the audio context. All other videos have to be muted.
    if (this._audioNodes.size === 1) {
      audioSourceNode.connect(audioContext.destination);
    } else {
      audioSourceNode.connect(zeroGainNode);
    }
  }

  unmountAudioNode(
    video: HTMLVideoElement,
    audioContext: AudioContext,
    audioSourceNode: MediaElementAudioSourceNode
  ) {
    const mountedVideos = [...this._mountedVideos];
    const videoPlayingAudio = mountedVideos[0];
    this._audioNodes.delete(audioSourceNode);
    audioSourceNode.disconnect();

    // If video playing audio has been removed, select a new video to be the audio player by disconnecting it from the mute node.
    if (videoPlayingAudio === video && this._audioNodes.size > 0 && audioContext) {
      const newMainAudioSource = [...this._audioNodes][0];
      newMainAudioSource.disconnect();
      newMainAudioSource.connect(audioContext.destination);
    }
  }

  play(): void {
    this._mountedVideos.forEach((video) => {
      video.play();
    });
    this.playing = true;
  }

  pause(): void {
    this._mountedVideos.forEach((video) => {
      video.pause();
    });
    this.playing = false;
  }

  replace(source: VideoSource): void {
    this._mountedVideos.forEach((video) => {
      const uri = getSourceUri(source);
      video.pause();
      if (uri) {
        video.setAttribute('src', uri);
        video.load();
        video.play();
      } else {
        video.removeAttribute('src');
      }
    });
    this.playing = true;
  }

  seekBy(seconds: number): void {
    this._mountedVideos.forEach((video) => {
      video.currentTime += seconds;
    });
  }

  replay(): void {
    this._mountedVideos.forEach((video) => {
      video.currentTime = 0;
      video.play();
    });
    this.playing = true;
  }

  _synchronizeWithFirstVideo(video: HTMLVideoElement): void {
    const firstVideo = [...this._mountedVideos][0];
    if (!firstVideo) return;

    if (firstVideo.paused) {
      video.pause();
    } else {
      video.play();
    }
    video.currentTime = firstVideo.currentTime;
    video.volume = firstVideo.volume;
    video.muted = firstVideo.muted;
    video.playbackRate = firstVideo.playbackRate;
  }

  _addListeners(video: HTMLVideoElement): void {
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
      this.muted = video.muted;
    };

    video.onseeking = () => {
      this._mountedVideos.forEach((mountedVideo) => {
        if (mountedVideo === video || mountedVideo.currentTime === video.currentTime) return;
        mountedVideo.currentTime = video.currentTime;
      });
    };

    video.onseeked = () => {
      this._mountedVideos.forEach((mountedVideo) => {
        if (mountedVideo === video || mountedVideo.currentTime === video.currentTime) return;
        mountedVideo.currentTime = video.currentTime;
      });
    };

    video.onratechange = () => {
      this._mountedVideos.forEach((mountedVideo) => {
        if (mountedVideo === video || mountedVideo.playbackRate === video.playbackRate) return;
        this._playbackRate = video.playbackRate;
        mountedVideo.playbackRate = video.playbackRate;
      });
    };

    video.onerror = () => {
      this._status = 'error';
    };

    video.onloadeddata = () => {
      this._status = 'readyToPlay';

      if (this.playing && video.paused) {
        video.play();
      }
    };

    video.onwaiting = () => {
      this._status = 'loading';
    };
  }
}

function mapStyles(style: VideoViewProps['style']): React.CSSProperties {
  const flattenedStyles = StyleSheet.flatten(style);
  // Looking through react-native-web source code they also just pass styles directly without further conversions, so it's just a cast.
  return flattenedStyles as React.CSSProperties;
}

export function useVideoPlayer(
  source: VideoSource,
  setup?: (player: VideoPlayer) => void
): VideoPlayer {
  const parsedSource = typeof source === 'string' ? { uri: source } : source;

  return useMemo(() => {
    const player = new VideoPlayerWeb(parsedSource);
    setup?.(player);
    return player;
  }, [JSON.stringify(source)]);
}

function getSourceUri(source: VideoSource): string | null {
  if (typeof source == 'string') {
    return source;
  }
  return source?.uri ?? null;
}

export const VideoView = forwardRef((props: { player?: VideoPlayerWeb } & VideoViewProps, ref) => {
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
