export {
  isPictureInPictureSupported,
  clearVideoCacheAsync,
  setVideoCacheSizeAsync,
  getCurrentVideoCacheSize,
} from './VideoModule';
export { VideoView } from './VideoView';
export { useVideoPlayer } from './VideoPlayer';

export { VideoContentFit, VideoViewProps, SurfaceType } from './VideoView.types';
export { VideoThumbnail } from './VideoThumbnail';

export { createVideoPlayer } from './VideoPlayer';
export { default as VideoAirPlayButton } from './VideoAirPlayButton';

export {
  VideoPlayer,
  VideoPlayerStatus,
  VideoSource,
  PlayerError,
  VideoMetadata,
  DRMType,
  DRMOptions,
  BufferOptions,
  AudioMixingMode,
  VideoThumbnailOptions,
  VideoSize,
  SubtitleTrack,
  AudioTrack,
  VideoTrack,
  ContentType,
} from './VideoPlayer.types';

export * from './VideoPlayerEvents.types';
export * from './VideoAirPlayButton.types';
