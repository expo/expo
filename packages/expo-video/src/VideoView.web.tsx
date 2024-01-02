import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';

import { VideoPlayer, VideoViewProps } from './VideoView.types';
class VideoPlayerWeb implements VideoPlayer {
  constructor(source: string | null = null) {
    this.src = source;
  }

  src: string | null = null;
  mountedVideos: Set<HTMLVideoElement> = new Set();
  isPlaying: boolean = false;
  _isMuted: boolean = false;
  timestamp: number = 0;
  _volume: number = 1;

  set isMuted(value: boolean) {
    this.mountedVideos.forEach((video) => {
      video.muted = value;
    });
    this._isMuted = value;
  }
  get isMuted(): boolean {
    return this._isMuted;
  }

  set volume(value: number) {
    this.mountedVideos.forEach((video) => {
      video.volume = value;
    });
    this._volume = value;
  }

  get volume(): number {
    this.mountedVideos.forEach((video) => {
      this._volume = video.volume;
    });
    return this._volume;
  }

  play(): void {
    this.mountedVideos.forEach((video) => {
      video.play();
    });
    this.isPlaying = true;
  }
  pause(): void {
    this.mountedVideos.forEach((video) => {
      video.pause();
    });
    this.isPlaying = false;
  }
  replace(source: string): void {
    this.mountedVideos.forEach((video) => {
      video.pause();
      video.setAttribute('src', source);
      video.load();
      video.play();
    });
    this.isPlaying = true;
  }
  seekBy(seconds: number): void {
    this.mountedVideos.forEach((video) => {
      video.currentTime += seconds;
    });
  }
  replay(): void {
    this.mountedVideos.forEach((video) => {
      video.currentTime = 0;
      video.play();
    });
    this.isPlaying = true;
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

  return (
    <video
      controls={props.nativeControls}
      controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'}
      style={{
        ...mapStyles(props.style),
        objectFit: props.contentFit,
      }}
      ref={videoRef}
      src={props.player?.src ?? ''}
    />
  );
});

export default VideoView;
