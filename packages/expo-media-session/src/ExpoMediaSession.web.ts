import { NativeModule, registerWebModule } from 'expo';

import type {
  AudioPolicy,
  MediaSessionEvents,
  NowPlayingClaim,
  NowPlayingInfo,
  NowPlayingOwner,
  RemoteCommandKind,
} from './MediaSession.types';
import { BrowserNowPlayingCenter } from './web/BrowserNowPlayingCenter';
import { NowPlayingStack } from './web/NowPlayingStack';

const defaultPolicy: AudioPolicy = {
  playsInSilentMode: true,
  interruptionMode: 'mixWithOthers',
  allowsRecording: false,
  shouldPlayInBackground: false,
  shouldRouteThroughEarpiece: false,
};

class ExpoMediaSessionWeb extends NativeModule<MediaSessionEvents> {
  private policy: AudioPolicy = defaultPolicy;
  private stack = new NowPlayingStack(
    new BrowserNowPlayingCenter(),
    () => this.policy.interruptionMode,
    (id) => this.emit('nowPlayingOwnerChange', { id })
  );

  async setAudioPolicyAsync(update: Partial<AudioPolicy>): Promise<void> {
    const defined = Object.fromEntries(
      Object.entries(update).filter(([, value]) => value !== undefined)
    );
    this.policy = { ...this.policy, ...defined };
  }

  getAudioPolicy(): AudioPolicy {
    return { ...this.policy };
  }

  holdSession(key: string): void {}

  releaseSession(key: string): void {}

  getNowPlayingOwnerId(): string | null {
    return this.stack.ownerId;
  }

  offerNowPlaying(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: RemoteCommandKind[]
  ): NowPlayingClaim {
    return this.stack.offer(owner, info, commands);
  }
}

export default registerWebModule(ExpoMediaSessionWeb, 'ExpoMediaSession');
