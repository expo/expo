/**
 * Describes how the app's audio behaves next to audio from other apps.
 *
 * - `mixWithOthers`: The app's audio plays together with other apps' audio.
 * - `duckOthers`: Other apps lower their volume while the app plays.
 * - `doNotMix`: Other apps pause while the app plays, and they can resume when it stops.
 * - `doNotMixPersistent`: Other apps pause while the app plays, and they do not resume by
 * themselves. On Android, the module requests permanent audio focus. On iOS, the module does not
 * notify other apps when the session deactivates.
 */
export type InterruptionMode = 'mixWithOthers' | 'doNotMix' | 'doNotMixPersistent' | 'duckOthers';

/**
 * The app-wide audio policy. The media libraries that use this module read it to configure audio
 * focus on Android and the shared audio session on iOS.
 */
export type AudioPolicy = {
  /**
   * Whether the app plays audio while the iOS silent switch is on. On Android, the module reports
   * the ringer state to media libraries, and they apply this value.
   * @default true
   */
  playsInSilentMode: boolean;
  /**
   * How the app's audio behaves next to audio from other apps. A media library can request a
   * stricter mode for one use, but never a looser one.
   * @default 'mixWithOthers'
   */
  interruptionMode: InterruptionMode;
  /**
   * Whether the session allows recording. On iOS, this selects the `playAndRecord` category. On
   * Android, the value is advisory: the module does not change the system audio state for it, and
   * media libraries read it.
   * @default false
   */
  allowsRecording: boolean;
  /**
   * Whether audio keeps playing when the app goes to the background. The module does not enforce
   * this value: media libraries read it and apply it to their players. Background playback also
   * needs the [`supportsBackgroundPlayback`](#configurable-properties) config plugin option.
   * @default false
   */
  shouldPlayInBackground: boolean;
  /**
   * Whether audio plays through the earpiece instead of the speaker. On iOS, this only has an
   * effect when `allowsRecording` is `true` (that is, the audio session category is
   * `playAndRecord`). When `false` (the default), audio is routed through the speaker. On Android,
   * this value has no effect.
   * @default false
   */
  shouldRouteThroughEarpiece: boolean;
};

/**
 * Why the system interrupted the app's audio. The set can grow, so handle unknown values.
 *
 * - `default`: Another app or a system event, such as a call, took the audio. Android reports only
 * this reason.
 * - `routeDisconnected`: The output device disconnected (iOS 17 and later only).
 * - `builtInMicMuted`: The built-in microphone was muted (iOS only).
 */
export type InterruptionReason =
  | 'default'
  | 'routeDisconnected'
  | 'builtInMicMuted'
  | (string & {});

/**
 * An interruption of the app's audio began or ended.
 *
 * An interruption that began can end with at most one `ended` event before the next `began`. A
 * permanent loss of audio focus may never end.
 */
export type InterruptionEvent =
  | {
      /**
       * The interruption began.
       */
      type: 'began';
      /**
       * Why the system interrupted the app's audio.
       */
      reason: InterruptionReason;
    }
  | {
      /**
       * The interruption ended.
       */
      type: 'ended';
      /**
       * Whether the interrupted playback can resume. It is `true` only when a media library or a
       * hold still uses the session and the session is active again.
       */
      shouldResume: boolean;
    };

/**
 * Why the audio route changed. The set can grow, so handle unknown values.
 *
 * - `oldDeviceUnavailable`: The previous output device, such as headphones, disconnected. Android
 * reports only this reason.
 * - `newDeviceAvailable`: A new output device connected (iOS only).
 * - `categoryChange`: The session category changed (iOS only).
 * - `other`: Any other route change (iOS only).
 */
export type RouteChangeReason =
  | 'oldDeviceUnavailable'
  | 'newDeviceAvailable'
  | 'categoryChange'
  | 'other'
  | (string & {});

/**
 * The audio route changed.
 */
export type RouteChangeEvent = {
  /**
   * Why the route changed.
   */
  reason: RouteChangeReason;
};

/**
 * The module failed to activate the audio session or to start the media playback service.
 */
export type ActivationErrorEvent = {
  /**
   * What failed, why, and what to do next.
   */
  message: string;
  /**
   * The client that requested the activation. For a hold, it is the key that was passed to
   * `holdSession`. For any other client, it is the name that the media library registered. When the
   * media playback service fails on Android, it is the ID of the Now Playing owner, or
   * `Now Playing` when no owner exists.
   */
  client: string;
};

/**
 * The owner of the lock screen and notification controls changed.
 * @hidden
 */
export type NowPlayingOwnerChangeEvent = {
  /**
   * The ID of the new owner, or `null` when no owner is left.
   */
  id: string | null;
};

/**
 * The kind of a lock screen or notification control. The set can grow, so handle unknown values.
 * @hidden
 */
export type RemoteCommandKind =
  | 'play'
  | 'pause'
  | 'togglePlayPause'
  | 'seek'
  | 'skipForward'
  | 'skipBackward'
  | 'nextTrack'
  | 'previousTrack'
  | (string & {});

/**
 * A lock screen or notification control that the user pressed.
 * @hidden
 */
export type RemoteCommand = {
  /**
   * The control that the user pressed.
   */
  kind: RemoteCommandKind;
  /**
   * The position for `seek`, and the interval for `skipForward` and `skipBackward`, in seconds.
   */
  value?: number;
};

/**
 * Why an owner leaves the Now Playing stack.
 *
 * - `ended`: The media finished or the user stopped it.
 * - `released`: The player was released.
 * @hidden
 */
export type WithdrawReason = 'ended' | 'released';

/**
 * The metadata and playback state that the lock screen or browser media controls show.
 * @hidden
 */
export type NowPlayingInfo = {
  /**
   * The title of the media item.
   */
  title?: string;
  /**
   * The artist of the media item.
   */
  artist?: string;
  /**
   * The album of the media item.
   */
  album?: string;
  /**
   * A URL of the artwork image.
   */
  artworkUrl?: string;
  /**
   * The duration of the media item, in seconds.
   */
  duration?: number;
  /**
   * The current playback position, in seconds. Keep it consistent with the owner's `isPlaying`.
   */
  elapsedTime?: number;
  /**
   * The current playback rate.
   */
  playbackRate?: number;
  /**
   * Whether the media item is a live stream. Live streams do not offer `seek`.
   * @default false
   */
  isLiveStream?: boolean;
  /**
   * The index of the media item in its queue.
   */
  queueIndex?: number;
  /**
   * The number of items in the queue.
   */
  queueCount?: number;
  /**
   * The interval for the `skipForward` control, in seconds.
   */
  skipForwardInterval?: number;
  /**
   * The interval for the `skipBackward` control, in seconds.
   */
  skipBackwardInterval?: number;
};

/**
 * A player that offers itself to the Now Playing stack. Call `claim.update` from
 * `pauseForTakeover` and `resumeAfterTakeover`, because the module reads `isPlaying` only on updates.
 * @hidden
 */
export interface NowPlayingOwner {
  /**
   * A stable ID for the owner. `getNowPlayingOwnerId` and the `nowPlayingOwnerChange` event report it.
   */
  readonly nowPlayingId: string;
  /**
   * The kind of media that the owner plays.
   */
  readonly mediaType: 'audio' | 'video';
  /**
   * Whether the owner is playing now.
   */
  readonly isPlaying: boolean;
  /**
   * Handles a control that the user pressed. The stack sends only the kinds that the owner offered.
   * @return `true` if the owner handled the command.
   */
  handle(command: RemoteCommand): boolean;
  /**
   * Pauses the owner because a newer owner took over. Defaults to handling a `pause` command.
   */
  pauseForTakeover?(): void;
  /**
   * Resumes the owner after the takeover that paused it ended. Defaults to handling a `play` command.
   */
  resumeAfterTakeover?(): void;
}

/**
 * The token that keeps an owner in the Now Playing stack. Keep it while the owner is active.
 * @hidden
 */
export interface NowPlayingClaim {
  /**
   * Replaces the owner's info, and its commands when given. Call it on every play, pause, seek,
   * rate, or metadata change.
   */
  update(info: NowPlayingInfo, commands?: RemoteCommandKind[]): void;
  /**
   * Removes the owner from the stack. The next owner below it becomes the top. Later calls do nothing.
   */
  withdraw(reason: WithdrawReason): void;
}

/**
 * @hidden
 */
export type MediaSessionEvents = {
  interruption(event: InterruptionEvent): void;
  routeChange(event: RouteChangeEvent): void;
  activationError(event: ActivationErrorEvent): void;
  nowPlayingOwnerChange(event: NowPlayingOwnerChangeEvent): void;
};
