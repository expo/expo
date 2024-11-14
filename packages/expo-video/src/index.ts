export { VideoView, isPictureInPictureSupported } from './VideoView';
export { useVideoPlayer } from './VideoPlayer';

export { VideoContentFit, VideoViewProps } from './VideoView.types';
export { VideoThumbnail } from './VideoThumbnail';

export { createVideoPlayer } from './VideoPlayer';

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
} from './VideoPlayer.types';

export {
  VideoPlayerEvents,
  StatusChangeEventPayload,
  PlayingChangeEventPayload,
  PlaybackRateChangeEventPayload,
  VolumeChangeEventPayload,
  MutedChangeEventPayload,
  TimeUpdateEventPayload,
  SourceChangeEventPayload,
} from './VideoPlayerEvents.types';
