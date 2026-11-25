import { NativeModule, registerWebModule } from 'expo';

import type {
  AudioPolicy,
  MediaSessionEvents,
  NowPlayingClaim,
  NowPlayingInfo,
  NowPlayingOwner,
  RemoteCommandKind,
  SessionRequirements,
  SessionUse,
  SessionUseEvents,
} from './MediaSession.types';
import { BrowserNowPlayingCenter } from './web/BrowserNowPlayingCenter';
import { NowPlayingStack } from './web/NowPlayingStack';

const defaultPolicy: AudioPolicy = {
  playsInSilentMode: true,
  interruptionMode: 'mixWithOthers',
  allowsRecording: false,
  shouldRouteThroughEarpiece: false,
};

class WebSessionUse extends globalThis.expo.SharedObject<SessionUseEvents> implements SessionUse {
  update(requirements: SessionRequirements): void {}

  end(): void {}
}

class ExpoMediaSessionWeb extends NativeModule<MediaSessionEvents> {
  private policy: AudioPolicy = defaultPolicy;
  private stack = new NowPlayingStack(
    new BrowserNowPlayingCenter(),
    () => this.policy.interruptionMode,
    () => this.emit('nowPlayingOwnerChange')
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

  beginSessionUse(client: string, requirements: SessionRequirements): SessionUse {
    return new WebSessionUse();
  }

  getNowPlayingOwner(): NowPlayingOwner | null {
    return this.stack.owner;
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
