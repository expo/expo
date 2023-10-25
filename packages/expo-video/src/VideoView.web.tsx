import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

import { VideoPlayer } from './VideoPlayer';
import { VideoViewProps } from './VideoView.types';
class VideoPlayerImpl implements VideoPlayer {
  src: string | null = null;
  mountedVideos: Set<HTMLVideoElement> = new Set();
  isPlaying: boolean = false;
  _isMuted: boolean = false;
  set isMuted(value: boolean) {
    this.mountedVideos.forEach((video) => {
      video.muted = value;
    });
    this._isMuted = value;
  }
  get isMuted(): boolean {
    return this._isMuted;
  }
  timestamp: number = 0;
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
  constructor(source: string | null = null) {
    this.src = source;
  }
}

export function useVideoPlayer(source: string | null = null): VideoPlayer {
  return React.useMemo(() => {
    return new VideoPlayerImpl(source);
    // should this not include source?
  }, []);
}

export const VideoView = forwardRef((props: { player?: VideoPlayerImpl } & VideoViewProps, ref) => {
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
    if (!props.player || !videoRef.current) return;
    props.player.mountedVideos.add(videoRef.current);
    return () => {
      if (videoRef.current) {
        props.player?.mountedVideos.delete(videoRef.current);
      }
    };
  }, [props.player]);
  return (
    <video
      {...props}
      controls={props.nativeControls}
      controlsList={props.allowsFullscreen ? undefined : 'nofullscreen'}
      ref={videoRef}
      src={props.player?.src ?? ''}
    />
  );
});

export default VideoView;
