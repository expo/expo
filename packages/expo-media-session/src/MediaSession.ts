import { type EventSubscription, UnavailabilityError } from 'expo';

import ExpoMediaSession from './ExpoMediaSession';
import type {
  ActivationErrorEvent,
  AudioPolicy,
  InterruptionEvent,
  NowPlayingClaim,
  NowPlayingInfo,
  NowPlayingOwner,
  NowPlayingOwnerChangeEvent,
  RemoteCommandKind,
  RouteChangeEvent,
} from './MediaSession.types';

type NativeOwnerRegistration = {
  native: InstanceType<NonNullable<typeof ExpoMediaSession.NowPlayingOwner>>;
  generation: number;
  subscriptions: EventSubscription[];
};

const nativeOwners = new WeakMap<NowPlayingOwner, NativeOwnerRegistration>();

/**
 * Updates the app-wide audio policy. Fields that the update leaves out keep their current values.
 * The module applies the new policy to the active session, and media libraries read it for every
 * later use.
 *
 * On web, the module stores the policy and does not change browser audio.
 *
 * @param update The fields of the audio policy to change.
 * @return A promise that resolves when the module accepted the policy. On iOS, it rejects when the
 * merged policy is invalid, for example `interruptionMode: 'duckOthers'` with
 * `playsInSilentMode: false`. The error message says how to fix the policy.
 *
 * @example
 * ```ts
 * await setAudioPolicyAsync({ interruptionMode: 'doNotMix', shouldPlayInBackground: true });
 * ```
 */
export async function setAudioPolicyAsync(update: Partial<AudioPolicy>): Promise<void> {
  await ExpoMediaSession.setAudioPolicyAsync(update);
}

/**
 * Gets the current app-wide audio policy.
 */
export function getAudioPolicy(): AudioPolicy {
  return ExpoMediaSession.getAudioPolicy();
}

/**
 * Keeps the audio session active, or audio focus held on Android, until you call `releaseSession`
 * with the same key. Use it to keep the session active between two sounds. A second call with a
 * key that is already held begins the hold again. Use that to activate the session again after an
 * `activationError` or an interruption. The module releases every hold when the JavaScript runtime
 * reloads.
 *
 * The call returns at once. If the activation fails, the module sends an `activationError` event.
 * On web, it does nothing.
 *
 * @param key A name for the hold. The `activationError` event reports it as its `client`.
 */
export function holdSession(key: string): void {
  ExpoMediaSession.holdSession(key);
}

/**
 * Releases the hold that `holdSession` created with the same key. The module deactivates the
 * session 1 second after the last use or hold ends, except in `mixWithOthers` mode on iOS, where it
 * never deactivates the session automatically. An unknown key does nothing.
 *
 * @param key The key that was passed to `holdSession`.
 */
export function releaseSession(key: string): void {
  ExpoMediaSession.releaseSession(key);
}

/**
 * Gets the ID of the player that owns the lock screen and notification controls now.
 *
 * @return The owner's ID, or `null` when no player owns the controls.
 * @hidden
 */
export function getNowPlayingOwnerId(): string | null {
  return ExpoMediaSession.getNowPlayingOwnerId() ?? null;
}

/**
 * Offers a player to the Now Playing stack, which drives the lock screen and notification controls,
 * or `navigator.mediaSession` on web. The newest offer goes on top and receives the controls. The
 * previous owner is paused for the takeover, unless the effective interruption mode is
 * `mixWithOthers`, and resumes when the newer owner withdraws, if the takeover paused it.
 *
 * A second offer for an owner that is already in the stack replaces its earlier offer. The earlier
 * claim does nothing after that.
 *
 * On Android and iOS, begin a session use first, for example with `holdSession`, and keep audio
 * playing, or the system does not show the controls. Native media libraries offer Now Playing
 * from Swift or Kotlin. See [For library authors](#for-library-authors).
 *
 * @param owner The player that offers itself. The module reads `isPlaying` on every `update`.
 * @param info The metadata and playback state to show.
 * @param commands The controls that the owner handles. Other controls are hidden.
 * @return A claim that keeps the owner in the stack. Update it on every playback change, and
 * withdraw it when the player stops or is released. If you drop the claim and the owner, the owner
 * is removed when the garbage collector runs.
 * @hidden
 */
export function offerNowPlaying(
  owner: NowPlayingOwner,
  info: NowPlayingInfo,
  commands: RemoteCommandKind[]
): NowPlayingClaim {
  if (ExpoMediaSession.offerNowPlaying) {
    return ExpoMediaSession.offerNowPlaying(owner, info, commands);
  }
  if (!ExpoMediaSession.NowPlayingOwner) {
    throw new UnavailabilityError('expo-media-session', 'offerNowPlaying');
  }
  let registration = nativeOwners.get(owner);
  if (!registration) {
    const native = new ExpoMediaSession.NowPlayingOwner(owner.nowPlayingId, owner.mediaType);
    registration = {
      native,
      generation: 0,
      subscriptions: [
        native.addListener('command', (command) => owner.handle(command)),
        native.addListener('pauseForTakeover', () =>
          owner.pauseForTakeover ? owner.pauseForTakeover() : owner.handle({ kind: 'pause' })
        ),
        native.addListener('resumeAfterTakeover', () =>
          owner.resumeAfterTakeover ? owner.resumeAfterTakeover() : owner.handle({ kind: 'play' })
        ),
      ],
    };
    nativeOwners.set(owner, registration);
  }
  const { native, subscriptions } = registration;
  const generation = ++registration.generation;
  const isCurrent = () =>
    nativeOwners.get(owner) === registration && registration.generation === generation;
  native.offer(info, commands, owner.isPlaying);
  return {
    update(nextInfo, nextCommands) {
      if (isCurrent()) {
        native.update(nextInfo, nextCommands ?? null, owner.isPlaying);
      }
    },
    withdraw(reason) {
      if (!isCurrent()) {
        return;
      }
      nativeOwners.delete(owner);
      native.withdraw(reason);
      subscriptions.forEach((subscription) => subscription.remove());
      native.release();
    },
  };
}

/**
 * Adds a listener for interruptions of the app's audio, such as a phone call or another app taking
 * audio focus.
 *
 * On Android, the module learns about interruptions from audio focus, and it requests no focus when
 * the effective interruption mode is `mixWithOthers`, which is the default. The module calls the
 * listener only in the other modes, and only while a media library or a hold uses the session.
 *
 * On iOS, the module can send `began` while no media library uses the session.
 *
 * On web, the module never calls the listener.
 *
 * @return A subscription. Call `remove()` on it to stop listening.
 */
export function addInterruptionListener(
  listener: (event: InterruptionEvent) => void
): EventSubscription {
  return ExpoMediaSession.addListener('interruption', listener);
}

/**
 * Adds a listener for audio route changes, such as headphones connecting or disconnecting.
 *
 * On Android, the module reports only `oldDeviceUnavailable`, when the output device disconnects.
 * It does not report a device that connects.
 *
 * On web, the module never calls the listener.
 *
 * @return A subscription. Call `remove()` on it to stop listening.
 */
export function addRouteChangeListener(
  listener: (event: RouteChangeEvent) => void
): EventSubscription {
  return ExpoMediaSession.addListener('routeChange', listener);
}

/**
 * Adds a listener for failures to activate the audio session or to start the media playback
 * service.
 *
 * @return A subscription. Call `remove()` on it to stop listening.
 */
export function addActivationErrorListener(
  listener: (event: ActivationErrorEvent) => void
): EventSubscription {
  return ExpoMediaSession.addListener('activationError', listener);
}

/**
 * Adds a listener for changes of the player that owns the lock screen and notification controls.
 *
 * @return A subscription. Call `remove()` on it to stop listening.
 * @hidden
 */
export function addNowPlayingOwnerChangeListener(
  listener: (event: NowPlayingOwnerChangeEvent) => void
): EventSubscription {
  return ExpoMediaSession.addListener('nowPlayingOwnerChange', listener);
}
