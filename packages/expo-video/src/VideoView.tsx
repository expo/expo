import React from 'react';

import NativeVideoModule from './NativeVideoModule';
import NativeVideoView from './NativeVideoView';
import { VideoPlayer } from './VideoPlayer';

export function useVideoPlayer(source: string | null = null): VideoPlayer {
  return React.useMemo(() => {
    return new NativeVideoModule.VideoPlayer(source);
  }, []);
}

export class VideoView extends React.PureComponent<any> {
  nativeRef = React.createRef();

  enterFullscreen() {
    // @ts-expect-error
    this.nativeRef.current?.enterFullscreen();
  }

  exitFullscreen() {
    // @ts-expect-error
    this.nativeRef.current?.exitFullscreen();
  }

  render(): React.ReactNode {
    const { player, ...props } = this.props;
    const playerId = getPlayerId(player);

    return <NativeVideoView {...props} player={playerId} ref={this.nativeRef} />;
  }
}

// Temporary solution to pass the shared object ID instead of the player object.
// We can't really pass it as an object in the old architecture.
// Technically we can in the new architecture, but it's not possible yet.
function getPlayerId(player: number | VideoPlayer): number | null {
  if (player instanceof NativeVideoModule.VideoPlayer) {
    // @ts-expect-error
    return player.__expo_shared_object_id__;
  }
  if (typeof player === 'number') {
    return player;
  }
  return null;
}
