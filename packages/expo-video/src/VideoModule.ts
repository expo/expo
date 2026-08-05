import NativeVideoModule from './NativeVideoModule';

/**
 * Returns whether the current device supports Picture in Picture (PiP) mode.
 *
 * @returns A `boolean` which is `true` if the device supports PiP mode, and `false` otherwise.
 * @platform android
 * @platform ios
 */
export function isPictureInPictureSupported(): boolean {
  return NativeVideoModule.isPictureInPictureSupported();
}

/**
 * Clears all video cache.
 * > This function can be called only if there are no existing `VideoPlayer` instances.
 *
 * @returns A promise that fulfills after the cache has been cleaned.
 * @platform android
 * @platform ios
 */
export function clearVideoCacheAsync(): Promise<void> {
  return NativeVideoModule.clearVideoCacheAsync();
}

/**
 * Sets desired video cache size in bytes. The default video cache size is 1GB. Value set by this function is persistent.
 * The cache size is not guaranteed to be exact and the actual cache size may be slightly larger. The cache is evicted on a least-recently-used basis.
 * > This function can be called only if there are no existing `VideoPlayer` instances.
 *
 * @returns A promise that fulfills after the cache size has been set.
 * @platform android
 * @platform ios
 */
export function setVideoCacheSizeAsync(sizeBytes: number): Promise<void> {
  return NativeVideoModule.setVideoCacheSizeAsync(sizeBytes);
}

/**
 * Returns the space currently occupied by the video cache in bytes.
 *
 * @platform android
 * @platform ios
 */
export function getCurrentVideoCacheSize(): number {
  return NativeVideoModule.getCurrentVideoCacheSize();
}

/**
 * Activates or deactivates the audio session used by video players.
 *
 * When a `VideoPlayer` outputs audio and its `audioMixingMode` doesn't allow mixing, the operating
 * system interrupts background audio played by other apps (such as music or podcast apps).
 * On iOS, once video playback stops, the system does not resume the interrupted audio on its own.
 * Calling `setIsAudioActiveAsync(false)` after all players have stopped playing audio notifies
 * the system that the interruption has ended, which allows background audio to resume.
 *
 * On iOS, this function activates or deactivates the shared
 * [`AVAudioSession`](https://developer.apple.com/documentation/avfaudio/avaudiosession).
 * Deactivation uses the
 * [`notifyOthersOnDeactivation`](https://developer.apple.com/documentation/avfaudio/avaudiosession/setactiveoptions/notifyothersondeactivation)
 * option, which prompts other apps to resume their interrupted audio.
 *
 * On Android, calling this function with `false` abandons the audio focus held on behalf of
 * video players, while calling it with `true` requests the audio focus again if any player
 * currently needs it. With the `auto` audio mixing mode, the audio focus is abandoned
 * automatically once no player outputs audio, so background audio usually resumes on its own.
 * With `doNotMix`, the focus request is permanent, and background audio does not resume on
 * Android even after the focus is abandoned.
 *
 * The audio session is activated again automatically whenever a `VideoPlayer` starts outputting
 * audio, so this function usually needs to be called only with `false`.
 *
 * > **Note:** On iOS, the audio session can be deactivated only while no players are playing
 * > audio. Pause all players before calling this function with `false` (a muted player that is
 * > still playing keeps the audio session busy), otherwise the returned promise rejects with
 * > an error.
 *
 * @param active Whether the audio session should be active.
 * @returns A promise that fulfills after the audio session state has been updated.
 *
 * @example
 * ```ts
 * import { setIsAudioActiveAsync } from 'expo-video';
 *
 * // Mutes a playing video and lets background audio from other apps resume.
 * async function muteVideo() {
 *   player.muted = true;
 *   player.pause();
 *   await setIsAudioActiveAsync(false);
 *   player.play();
 * }
 * ```
 *
 * @platform android
 * @platform ios
 */
export function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return NativeVideoModule.setIsAudioActiveAsync(active);
}
