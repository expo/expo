import { VideoPlayer } from './VideoPlayer';

type VideoContentFit = 'contain' | 'cover' | 'fill';

export type VideoViewProps = {
  player: VideoPlayer;
  nativeControls: boolean | undefined;
  contentFit: VideoContentFit | undefined;
  //   contentPosition: CGVector | undefined;
  allowsFullscreen: boolean | undefined;
  showsTimecodes: boolean | undefined;
  requiresLinearPlayback: boolean | undefined;
};
