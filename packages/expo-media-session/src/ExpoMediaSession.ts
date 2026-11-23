import { NativeModule, requireNativeModule, SharedObject } from 'expo';

import type {
  AudioPolicy,
  MediaSessionEvents,
  NowPlayingClaim,
  NowPlayingInfo,
  NowPlayingOwner,
  RemoteCommandKind,
} from './MediaSession.types';

type NativeNowPlayingOwnerEvents = {
  command(command: { kind: RemoteCommandKind; value?: number | null }): void;
  pauseForTakeover(): void;
  resumeAfterTakeover(): void;
};

declare class NativeNowPlayingOwner extends SharedObject<NativeNowPlayingOwnerEvents> {
  offer(info: NowPlayingInfo, commands: RemoteCommandKind[], isPlaying: boolean): void;
  update(info: NowPlayingInfo, commands: RemoteCommandKind[] | null, isPlaying: boolean): void;
  withdraw(): void;
}

declare class ExpoMediaSessionModule extends NativeModule<MediaSessionEvents> {
  createNowPlayingOwner?(mediaType: NowPlayingOwner['mediaType']): NativeNowPlayingOwner;
  setAudioPolicyAsync(update: Partial<AudioPolicy>): Promise<void>;
  getAudioPolicy(): AudioPolicy;
  holdSession(key: string): void;
  releaseSession(key: string): void;
  getNowPlayingOwner(): NativeNowPlayingOwner | NowPlayingOwner | null;
  offerNowPlaying?(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: RemoteCommandKind[]
  ): NowPlayingClaim;
}

export default requireNativeModule<ExpoMediaSessionModule>('ExpoMediaSession');
