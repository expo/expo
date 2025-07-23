export {
  isPictureInPictureSupported,
  clearVideoCacheAsync,
  setVideoCacheSizeAsync,
  getCurrentVideoCacheSize,
} from './VideoModule';
export { VideoView } from './VideoView';
export { useVideoPlayer } from './VideoPlayer';

export type { VideoContentFit, VideoViewProps, SurfaceType } from './VideoView.types';
export type { VideoThumbnail } from './VideoThumbnail';

export { createVideoPlayer } from './VideoPlayer';
export { default as VideoAirPlayButton } from './VideoAirPlayButton';

export type {
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

export type * from './VideoPlayerEvents.types';
export type * from './VideoAirPlayButton.types';
