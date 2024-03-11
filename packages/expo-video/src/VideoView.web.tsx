import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';

import { VideoPlayer, VideoViewProps } from './VideoView.types';

/**
 * This audio context is used to mute all but one video when multiple video views are playing from one player simultaneously.
 * Using audio context nodes allows muting videos without displaying the mute icon in the video player.
 */
const audioContext = window && new window.AudioContext();
const zeroGainNode = audioContext && audioContext.createGain();
if (audioContext && zeroGainNode) {
  zeroGainNode.gain.value = 0;
  zeroGainNode.connect(audioContext.destination);
} else {
  console.warn(
    "Couldn't create AudioContext, this might affect the audio playback when using multiple video views with the same player."
  );
}

class VideoPlayerWeb implements VideoPlayer {
  constructor(source: string | null = null) {
    this.src = source;
  }

  src: string | null = null;
  _mountedVideos: Set<HTMLVideoElement> = new Set();
  _audioNodes: Set<MediaElementAudioSourceNode> = new Set();
  playing: boolean = false;
  _muted: boolean = false;
  _volume: number = 1;
  _loop: boolean = false;
  _playbackRate: number = 1.0;
  _preservesPitch: boolean = true;
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

  mountVideoView(video: HTMLVideoElement) {
    this._mountedVideos.add(video);
    this._synchronizeWithFirstVideo(video);
    this._addListeners(video);
  }

  unmountVideoView(video: HTMLVideoElement) {
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
  replace(source: string): void {
    this._mountedVideos.forEach((video) => {
      video.pause();
      video.setAttribute('src', source);
      video.load();
      video.play();
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
    video.currentTime = firstVideo.currentTime;
    video.volume = firstVideo.volume;
    video.muted = firstVideo.muted;
    video.playbackRate = firstVideo.playbackRate;
  }

  _addListeners(video: HTMLVideoElement): void {
    video.onloadedmetadata = () => {
      if (!audioContext || !zeroGainNode) return;
      const source = audioContext.createMediaElementSource(video);
      this._audioNodes.add(source);

      // First mounted video should be connected to the audio context. All other videos have to be muted.
      if (this._audioNodes.size === 1) {
        source.connect(audioContext.destination);
      } else {
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
  }
}

function mapStyles(style: VideoViewProps['style']): React.CSSProperties {
  const flattenedStyles = StyleSheet.flatten(style);
  // Looking through react-native-web source code they also just pass styles directly without further conversions, so it's just a cast.
  return flattenedStyles as React.CSSProperties;
}

export function useVideoPlayer(source: string | null = null): VideoPlayer {
  return React.useMemo(() => {
    return new VideoPlayerWeb(source);
    // should this not include source?
  }, []);
}

export const VideoView = forwardRef((props: { player?: VideoPlayerWeb } & VideoViewProps, ref) => {
  const videoRef = useRef<null | HTMLVideoElement>(null);
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
        if (newRef) {
          videoRef.current = newRef;
        }
      }}
      src={props.player?.src ?? ''}
    />
  );
});

export default VideoView;
