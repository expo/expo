---
title: Audio
---

Provides basic sample playback and recording.

Note that Expo does not support backgrounding, so audio is not available to play in the background of your experience. Audio also automatically stops if headphones / bluetooth audio devices are disconnected.

Try the [playlist example app](http://expo.io/@Expo/playlist) (source code is [on GitHub](https://github.com/Expo/playlist)) to see an example usage of the playback API, and the [recording example app](http://expo.io/@Expo/record) (source code is [on GitHub](https://github.com/Expo/record)) to see an example usage of the recording API.

> **Note:** We've made some breaking changes to Audio in SDK 17 which are not yet reflected in these docs. We're working on new docs, but for the moment, check out [this gist](https://gist.github.com/terribleben/a74f3eac6a780e0355c6b4c4f489bc61) for details on the new API!

## Enabling Audio and customizing Audio Mode

### `Expo.Audio.setIsEnabledAsync(value)`

Audio is disabled by default, so your app must enable it explicitly to play sounds.

#### Arguments

-   **value (_boolean_)** -- `true` enables Expo Audio, and `false` disables it.

#### Returns

A `Promise` that will reject if audio playback could not be enabled for the device.

### `Expo.Audio.setAudioModeAsync(mode)`

We provide this API to customize the audio experience on iOS and Android.

#### Arguments

-   **mode (_object_)** --

    A dictionary with the following key-value pairs:

    -   `playsInSilentLockedModeIOS` : a boolean selecting if your experience's audio should play in silent mode or locked mode on iOS. This value defaults to `false`.
    -   `allowsRecordingIOS` : a boolean selecting if recording is enabled on iOS. This value defaults to `false`.
    -   `interruptionModeIOS` : an enum selecting how your experience's audio should interact with the audio from other apps on iOS:
        - `INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS` : This is the default option. If this option is set, your experience's audio is mixed with audio playing in background apps.
        - `INTERRUPTION_MODE_IOS_DO_NOT_MIX` : If this option is set, your experience's audio interrupts audio from other apps.
        - `INTERRUPTION_MODE_IOS_DUCK_OTHERS` : If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.
    -   `shouldDuckAndroid` : a boolean selecting if your experience's audio should automatically be lowered in volume ("duck") if audio from another app interrupts your experience. This value defaults to `true`. If `false`, audio from other apps will pause your audio.
    -   `interruptionModeAndroid` : an enum selecting how your experience's audio should interact with the audio from other apps on Android:
        - `INTERRUPTION_MODE_ANDROID_DO_NOT_MIX` : If this option is set, your experience's audio interrupts audio from other apps.
        - `INTERRUPTION_MODE_ANDROID_DUCK_OTHERS` : This is the default option. If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.

#### Returns

A `Promise` that will reject if the audio mode could not be enabled for the device. Note that these are the only legal AudioMode combinations of (`playsInSilentLockedModeIOS`, `allowsRecordingIOS`, `interruptionModeIOS`), and any other will result in promise rejection:
 - `false, false, INTERRUPTION_MODE_IOS_DO_NOT_MIX`
 - `false, false, INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS`
 - `true, true, INTERRUPTION_MODE_IOS_DO_NOT_MIX`
 - `true, true, INTERRUPTION_MODE_IOS_DUCK_OTHERS`
 - `true, true, INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS`
 - `true, false, INTERRUPTION_MODE_IOS_DO_NOT_MIX`
 - `true, false, INTERRUPTION_MODE_IOS_DUCK_OTHERS`
 - `true, false, INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS`

## Playing sounds

### `Expo.Audio.Sound`

This class represents a sound corresponding to an Asset or URL.

#### Parameters

-   **options (_object_)** --

    A map of options:

    -   **source** -- The source of the audio data to display. The following forms are supported:

        -   A string with a network URL pointing to an audio file on the web.
        -   `require('path/to/file')` for an audio file asset in the source code directory.
        -   An [`Expo.Asset`](asset.html) object for an audio file asset.

        The [iOS developer documentation](https://developer.apple.com/library/ios/documentation/Miscellaneous/Conceptual/iPhoneOSTechOverview/MediaLayer/MediaLayer.html) lists the audio formats supported on iOS.

        The [Android developer documentation](https://developer.android.com/guide/appendix/media-formats.html#formats-table) lists the audio formats supported on Android.

#### Returns

A newly constructed instance of `Expo.Audio.Sound`.

#### Example

```javascript
const sound = new Expo.Audio.Sound({
  source: require('./assets/sounds/hello.mp3'),
});
try {
  await sound.loadAsync();
  await sound.playAsync();
  // Your sound is playing!
} catch (error) {
  // An error occurred!
}
```

-   `soundInstance.getStatusAsync()`

    Gets the `status` of the sound.

    #### Returns

    A `Promise` that is resolved with the `status` of the sound: a dictionary with the following key-value pairs.

    If the sound is not loaded, it will only contain a single key:

    -   `isLoaded` : a boolean set to `false`.

    Otherwise, it contains all of the following key-value pairs:

    -   `isLoaded` : a boolean set to `true`.
    -   `isPlaying` : a boolean describing if the sound is currently playing.
    -   `durationMillis` : the duration of the sound in milliseconds.
    -   `positionMillis` : the current position of playback in milliseconds.
    -   `rate` : the current rate of the sound.
    -   `shouldCorrectPitch` : a boolean describing if we are correcting the pitch for a changed rate.
    -   `volume` : the current volume of the sound.
    -   `isMuted` : a boolean describing if the sound is currently muted.
    -   `isLooping` : a boolean describing if the sound is currently looping.
    -   `didJustFinish` : a boolean describing if the sound just played to completion at the time that this status was received. When the sound plays to completion, the function passed in `setCallback` is called exactly once with `didJustFinish` set to `true`. `didJustFinish` is never `true` in any other case.

-   `soundInstance.setCallback(callback)`

    Sets a function to be called regularly with the `status` of the sound. See `getStatusAsync` for details on `status`.

    The callback will be called when another call to the API for this sound completes (such as `playAsync`, `setRateAsync`, `getStatusAsync`, or `unloadAsync`), and will also be called at regular intervals while the sound is loaded. Call `setCallbackPollingMillis` to modify the interval with which the callback is called while loaded.

    #### Parameters

    -   **callback (_function_)** -- A function taking a single parameter `status` (a dictionary, described in `getStatusAsync`).

-   `soundInstance.setCallbackPollingMillis(millis)`

    Sets the interval with which the status change callback is called while the sound is loaded. See `setCallback` for details on the status change callback. This value defaults to 100 milliseconds.

    #### Parameters

    -   **millis (_number_)** -- The new interval between calls of the status change callback.

-   `soundInstance.loadAsync()`

    Loads the sound into memory and prepares it for playing. This must be called before calling `playAsync`. This method can only be called if the sound is in an unloaded state.

    #### Returns

    A `Promise` that is fulfilled when the sound is loaded with the `status` of the sound (see `getStatusAsync` for details), or rejects if loading failed. The `Promise` will also reject if the sound was already loaded.

-   `soundInstance.unloadAsync()`

    Unloads the sound. `loadAsync` must be called again in order to be able to play the sound.

    #### Returns

    A `Promise` that is fulfilled when the sound is unloaded with the `status` of the sound (see `getStatusAsync` for details), or rejects if unloading failed.

-   `soundInstance.playAsync()`

    Plays the sound. This method can only be called if the sound has been loaded.

    #### Returns

    A `Promise` that is resolved, once the sound starts playing, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.pauseAsync()`

    Pauses the sound. This method can only be called if the sound has been loaded.

    #### Returns

    A `Promise` that is resolved, once playback is paused, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.stopAsync()`

    Stops the sound. This method can only be called if the sound has been loaded.

    #### Returns

    A `Promise` that is resolved, once playback is stopped, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setPositionAsync(millis)`

    Sets the playback position of the sound. This method can only be called if the sound has been loaded.

    #### Parameters

    -   **millis (_number_)** -- The position to seek the sound to.

    #### Returns

    A `Promise` that is resolved, once the seek occurs, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setRateAsync(value, shouldCorrectPitch)`

    Sets the playback rate of the sound. This method can only be called if the sound has been loaded.

    NOTE: This is only available on Android API version 23 and later.

    #### Parameters

    -   **value (_number_)** -- The desired playback rate of the sound. This value must be between `0.0` and `32.0`.

    -   **shouldCorrectPitch (_boolean_)** -- If set to `true`, the pitch of the sound will be corrected (so a rate different than `1.0` will timestretch the sound).

    #### Returns

    A `Promise` that is resolved once the rate is changed with the `status` of the sound (see `getStatusAsync` for details). If the Android API version is less than 23, the `Promise` will reject.


-   `soundInstance.setVolumeAsync(value)`

    Sets the volume of the sound. This is NOT the system volume, and will only affect this sound. This value defaults to `1.0`. This method can only be called if the sound has been loaded.

    #### Parameters

    -   **value (_number_)** -- A number between `0.0` (silence) and `1.0` (maximum volume).

    #### Returns

    A `Promise` that is resolved, once the volume is set, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setIsMutedAsync(value)`

    Sets whether the sound is muted. This is independent of the volume of the sound set in `setVolumeAsync`. This also does not affect the system volume, and only pertains to this sound. This value defaults to `true`. This method can only be called if the sound has been loaded.

    #### Parameters

    -   **value (_boolean_)** -- `true` mutes the sound, and `false` unmutes it.

    #### Returns

    A `Promise` that is resolved, once the mute state is set, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setIsLoopingAsync(value)`

    Sets whether playback of the sound should loop. When `true`, it will loop indefinitely. This value defaults to `false`. This method can only be called if the sound has been loaded.

    #### Parameters

    -   **value (_boolean_)** -- `true` sets the sound to loop indefinitely.

    #### Returns

    A `Promise` that is resolved, once the loop state is set, with the `status` of the sound (see `getStatusAsync` for details).

## Recording sounds

### `Expo.Audio.Recording`

This class represents an audio recording. After creating an instance of this class, `prepareToRecordAsync` must be called in order to record audio. Once recording is finished, call `stopAndUnloadAsync`. Note that only one recorder is allowed to exist in the state between `prepareToRecordAsync` and `stopAndUnloadAsync` at any given time.

Note that your experience must request audio recording permissions in order for recording to function. See the [`Permissions` module](./permissions.html) for more details.

#### Returns

A newly constructed instance of `Expo.Audio.Recording`.

#### Example

```javascript
const recording = new Expo.Audio.Recording();
try {
  await recording.prepareToRecordAsync();
  await recording.startAsync();
  // You are now recording!
} catch (error) {
  // An error occurred!
}
```

-   `recordingInstance.getStatusAsync()`

    Gets the `status` of the `Recording`.

    #### Returns

    A `Promise` that is resolved with the `status` of the `Recording`: a dictionary with the following key-value pairs.

    Before `prepareToRecordAsync` is called, the `status` will be as follows:

    -   `canRecord` : a boolean set to `false`.
    -   `isDoneRecording` : a boolean set to `false`.

    After `prepareToRecordAsync` is called, but before `stopAndUnloadAsync` is called, the `status` will be as follows:

    -   `canRecord` : a boolean set to `true`.
    -   `isRecording` : a boolean describing if the `Recording` is currently recording.
    -   `durationMillis` : the current duration of the recorded audio.

    After `stopAndUnloadAsync` is called, the `status` will be as follows:

    -   `canRecord` : a boolean set to `false`.
    -   `isDoneRecording` : a boolean set to `true`.
    -   `durationMillis` : the final duration of the recorded audio.

-   `recordingInstance.setCallback(callback)`

    Sets a function to be called regularly with the `status` of the `Recording`. See `getStatusAsync` for details on `status`.

    The callback will be called when another call to the API for this recording completes (such as `prepareToRecordAsync`, `startAsync`, `getStatusAsync`, or `stopAndUnloadAsync`), and will also be called at regular intervals while the recording can record. Call `setCallbackPollingMillis` to modify the interval with which the callback is called while the recording can record.

    #### Parameters

    -   **callback (_function_)** -- A function taking a single parameter `status` (a dictionary, described in `getStatusAsync`).

-   `recordingInstance.setCallbackPollingMillis(millis)`

    Sets the interval with which the status change callback is called while the recording can record. See `setCallback` for details on the status change callback. This value defaults to 100 milliseconds.

    #### Parameters

    -   **millis (_number_)** -- The new interval between calls of the status change callback.

-   `recordingInstance.prepareToRecordAsync()`

    Loads the recorder into memory and prepares it for recording. This must be called before calling `startAsync`. This method can only be called if the `Recording` instance has never yet been prepared.

    #### Returns

    A `Promise` that is fulfilled when the recorder is loaded and prepared, or rejects if this failed. If another `Recording` exists in your experience that is currently prepared to record, the `Promise` will reject. The promise is resolved with the `status` of the recording (see `getStatusAsync` for details).

-   `recordingInstance.isPreparedToRecord()`

    #### Returns

    A `boolean` that is true if and only if the `Recording` is prepared to record.

-   `recordingInstance.startAsync()`

    Begins recording. This method can only be called if the `Recording` has been prepared.

    #### Returns

    A `Promise` that is fulfilled when recording has begun, or rejects if recording could not start. The promise is resolved with the `status` of the recording (see `getStatusAsync` for details).

-   `recordingInstance.pauseAsync()`

    Pauses recording. This method can only be called if the `Recording` has been prepared.

    NOTE: This is only available on Android API version 24 and later.

    #### Returns

    A `Promise` that is fulfilled when recording has paused, or rejects if recording could not be paused. If the Android API version is less than 24, the `Promise` will reject. The promise is resolved with the `status` of the recording (see `getStatusAsync` for details).

-   `recordingInstance.stopAndUnloadAsync()`

    Stops the recording and deallocates the recorder from memory. This reverts the `Recording` instance to an unprepared state, and another `Recording` instance must be created in order to record again. This method can only be called if the `Recording` has been prepared.

    #### Returns

    A `Promise` that is fulfilled when recording has stopped, or rejects if recording could not be stopped. The promise is resolved with the `status` of the recording (see `getStatusAsync` for details).

-   `recordingInstance.getURI()`

    Gets the local URI of the `Recording`. Note that this will only succeed once the `Recording` is prepared to record.

    #### Returns

    A `string` with the local URI of the `Recording`, or `null` if the `Recording` is not prepared to record.

-   `recordingInstance.getNewSound()`

    Gets a new `Sound` object to play back the `Recording`. Note that this will only succeed once the `Recording` is done recording (once `stopAndUnloadAsync` has been called).

    #### Returns

    A `Sound` created with the local URI of the `Recording`, or `null` if the `Recording` is not done recording.
