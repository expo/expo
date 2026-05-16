import { SharedObject } from 'expo';

import type {
  PlayerError,
  VideoMetadata,
  VideoPlayer,
  VideoPlayerStatus,
  VideoSource,
} from './VideoPlayer.types';

/**
 * Loop behavior used by a [`VideoPlaylist`](#videoplaylist).
 *
 * - `'none'`: Playback stops when the final source finishes.
 * - `'single'`: The current source repeats when it finishes.
 * - `'all'`: Playback advances through all sources and wraps to the first source after the final source.
 *
 * @platform ios
 */
export type VideoPlaylistLoopMode = 'none' | 'single' | 'all';

/**
 * Source item accepted by a [`VideoPlaylist`](#videoplaylist).
 *
 * Pass a [`VideoSource`](#videosource) directly for simple playlists, or pass an object with a stable `id`
 * when you need [`replaceAll`](#replaceallsources-options) to preserve the current item across playlist updates.
 *
 * @platform ios
 */
export type VideoPlaylistSource =
  | VideoSource
  | {
      /**
       * Stable identifier for this playlist item. `replaceAll` checks this value first when
       * `preserveCurrentSource` is enabled.
       */
      id?: string;

      /**
       * The video source to load for this playlist item.
       */
      source: VideoSource;

      /**
       * Metadata associated with this playlist item. When provided, it is applied to the source loaded
       * by the underlying [`VideoPlayer`](#videoplayer).
       */
      metadata?: VideoMetadata;
    };

/**
 * Options used to create a [`VideoPlaylist`](#videoplaylist).
 *
 * The `sources` array is only used as the initial playlist contents. After the playlist is created,
 * modify it with [`add`](#addsource), [`insert`](#insertsource-index), [`remove`](#removeindex),
 * [`clear`](#clear), or [`replaceAll`](#replaceallsources-options).
 *
 * @platform ios
 */
export type VideoPlaylistOptions = {
  /**
   * Initial playlist contents.
   * @default []
   */
  sources?: VideoPlaylistSource[];

  /**
   * Initial source index. Values outside the playlist range are clamped to the nearest valid index.
   * Empty playlists always start at index `0`.
   * @default 0
   */
  initialIndex?: number;

  /**
   * Loop behavior for the playlist.
   * @default 'none'
   */
  loop?: VideoPlaylistLoopMode;

  /**
   * Whether the playlist should prepare the next source in the background for faster sequential advances.
   * @default false
   */
  preloadNext?: boolean;

  /**
   * Whether playback should automatically advance when the current source finishes.
   * @default true
   */
  autoAdvance?: boolean;

  /**
   * Interval in milliseconds between playlist status updates while playback time changes.
   * @default 500
   */
  updateInterval?: number;
};

/**
 * Current playback and playlist state reported by [`useVideoPlaylistStatus`](#usevideoplayliststatusplaylist).
 *
 * @platform ios
 */
export type VideoPlaylistStatus = {
  /**
   * Unique identifier for the playlist instance.
   */
  id: string;

  /**
   * Index of the current source. Empty playlists report `0`.
   */
  currentIndex: number;

  /**
   * Number of sources in the playlist.
   */
  sourceCount: number;

  /**
   * Current playlist source, or `null` when the playlist is empty.
   */
  currentSource: VideoPlaylistSource | null;

  /**
   * Current playback position in seconds.
   */
  currentTime: number;

  /**
   * Duration of the current source in seconds, or `0` when unavailable.
   */
  duration: number;

  /**
   * Whether the underlying player is currently playing.
   */
  playing: boolean;

  /**
   * Whether the underlying player is currently waiting for buffered media.
   */
  isBuffering: boolean;

  /**
   * Whether the current source has loaded enough media metadata to play.
   */
  isLoaded: boolean;

  /**
   * Current status of the underlying [`VideoPlayer`](#videoplayer).
   */
  status: VideoPlayerStatus;

  /**
   * Current playlist loop mode.
   */
  loop: VideoPlaylistLoopMode;

  /**
   * Whether calling [`next`](#next) can move to another source.
   */
  canPlayNext: boolean;

  /**
   * Whether calling [`previous`](#previous) can move to another source.
   */
  canPlayPrevious: boolean;

  /**
   * Most recent playback error reported by the underlying player, or `null` when there is no error.
   */
  error: PlayerError | null;

  /**
   * `true` only on the status update emitted when the current source reaches its end.
   */
  didJustFinish: boolean;
};

/**
 * Events emitted by a [`VideoPlaylist`](#videoplaylist).
 *
 * @platform ios
 */
export type VideoPlaylistEvents = {
  /**
   * Emitted when playlist or playback status changes.
   */
  playlistStatusUpdate(status: VideoPlaylistStatus): void;
};

/**
 * A playlist controller that owns one stable [`VideoPlayer`](#videoplayer).
 *
 * Pass [`player`](#player) to [`VideoView`](#videoview). The player instance remains the same when the
 * playlist advances, so mounted views do not need to swap player objects.
 *
 * @platform ios
 */
export declare class VideoPlaylist extends SharedObject<VideoPlaylistEvents> {
  /**
   * Initializes a new video playlist instance.
   * @hidden
   */
  constructor(
    sources: VideoPlaylistSource[],
    initialIndex: number,
    updateInterval: number,
    loop: VideoPlaylistLoopMode,
    preloadNext: boolean,
    autoAdvance: boolean
  );

  /**
   * Stable player owned by this playlist.
   */
  readonly player: VideoPlayer;

  /**
   * Current playlist status.
   */
  readonly currentStatus: VideoPlaylistStatus;

  /**
   * Starts playback of the current source.
   */
  play(): void;

  /**
   * Pauses playback.
   */
  pause(): void;

  /**
   * Advances to the next source when one is available.
   *
   * Invalid navigation requests are ignored.
   */
  next(): Promise<void>;

  /**
   * Moves to the previous source when one is available.
   *
   * Invalid navigation requests are ignored.
   */
  previous(): Promise<void>;

  /**
   * Moves to the source at the provided index.
   *
   * Invalid indexes are ignored.
   *
   * @param index Source index to load.
   */
  skipTo(index: number): Promise<void>;

  /**
   * Seeks the current source to a playback position.
   *
   * @param seconds Playback position in seconds.
   */
  seekTo(seconds: number): Promise<void>;

  /**
   * Appends a source to the playlist.
   *
   * @param source Source to append.
   */
  add(source: VideoPlaylistSource): void;

  /**
   * Inserts a source at the provided index.
   *
   * Invalid indexes are ignored.
   *
   * @param source Source to insert.
   * @param index Destination index.
   */
  insert(source: VideoPlaylistSource, index: number): void;

  /**
   * Removes a source from the playlist.
   *
   * Invalid indexes are ignored.
   *
   * @param index Source index to remove.
   */
  remove(index: number): Promise<void>;

  /**
   * Removes all sources and clears the underlying player.
   */
  clear(): void;

  /**
   * Replaces all playlist sources.
   *
   * When `preserveCurrentSource` is `true`, the playlist keeps the current source by matching item `id`
   * first, then by normalized source identity. If no match exists, playback falls back to index `0`.
   *
   * @param sources New playlist contents.
   * @param options Options for preserving the current source.
   */
  replaceAll(
    sources: VideoPlaylistSource[],
    options?: { preserveCurrentSource?: boolean }
  ): Promise<void>;

  /**
   * Stops playback and releases native resources owned by the playlist.
   */
  destroy(): void;
}
