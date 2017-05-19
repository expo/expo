---
title: Audio
---

Provides basic sample playback and recording.

Note that Expo does not yet support backgrounding, so audio is not available to play in the background of your experience. Audio also automatically stops if headphones / bluetooth audio devices are disconnected.

Try the [playlist example app](http://expo.io/@community/playlist) (source code is [on GitHub](https://github.com/expo/playlist-example)) to see an example usage of the media playback API, and the [recording example app](http://expo.io/@community/record) (source code is [on GitHub](https://github.com/expo/audio-recording-example)) to see an example usage of the recording API.

## Enabling Audio and customizing Audio Mode

### `Expo.Audio.setIsEnabledAsync(value)`

Audio is enabled by default, but if you want to write your own Audio API in a detached app, you might want to disable the Expo Audio API.

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

#### Returns

A newly constructed instance of `Expo.Audio.Sound`.

#### Example

```javascript
const soundObject = new Expo.Audio.Sound();
try {
  await soundObject.loadAsync(require('./assets/sounds/hello.mp3'));
  await soundObject.playAsync();
  // Your sound is playing!
} catch (error) {
  // An error occurred!
}
```

A static convenience method to construct and load a sound is also provided:

-   `Expo.Audio.Sound.create(source, initialStatus = {}, callback = null, downloadFirst = true)`

    Creates and loads a sound from source, with optional `initialStatus`, `callback`, and `downloadFirst`.

    This is equivalent to the following:

    ```javascript
    const soundObject = new Expo.Audio.Sound();
    soundObject.setCallback(callback);
    await soundObject.loadAsync(source, initialStatus, downloadFirst);
    ```

    #### Parameters

    -   **source (_object_ / _number_ / _Asset_)** -- The source of the sound. The following forms are supported:

        -   A dictionary of the form `{ uri: 'http://path/to/file' }` with a network URL pointing to an audio file on the web.
        -   `require('path/to/file')` for an audio file asset in the source code directory.
        -   An [`Expo.Asset`](asset.html) object for an audio file asset.

    -   **initialStatus (_PlaybackStatusToSet_)** -- The initial intended `PlaybackStatusToSet` of the sound, whose values will override the default initial playback status. This value defaults to `{}` if no parameter is passed. See the [AV documentation](av.html) for details on `PlaybackStatusToSet` and the default initial playback status.

    -   **callback (_function_)** -- A function taking a single parameter `PlaybackStatus`. This value defaults to `null` if no parameter is passed. See the [AV documentation](av.html) for details on the functionality provided by the callback

    -   **downloadFirst (_boolean_)** -- If set to true, the system will attempt to download the resource to the device before loading. This value defaults to `true`. Note that at the moment, this will only work for `source`s of the form `require('path/to/file')` or `Asset` objects.

    #### Returns

    A `Promise` that is rejected if creation failed, or fulfilled with the following dictionary if creation succeeded:

    -   `sound` : the newly created and loaded `Sound` object.
    -   `status` : the `PlaybackStatus` of the `Sound` object. See the [AV documentation](av.html) for further information.

    #### Example

    ```javascript
    try {
      const { soundObject, status } = await Expo.Audio.Sound.create(
        require('./assets/sounds/hello.mp3'),
        { shouldPlay: true }
      );
      // Your sound is playing!
    } catch (error) {
      // An error occurred!
    }
    ```

The rest of the API for `Expo.Audio.Sound` is the same as the imperative playback API for `Expo.Video`-- see the [AV documentation](av.html) for further information:

-   `soundObject.loadAsync(source, initialStatus = {}, downloadFirst = true)`

-   `soundObject.unloadAsync()`

-   `soundObject.getStatusAsync()`

-   `soundObject.setCallback(callback)`

-   `soundObject.setStatusAsync(statusToSet)`

-   `soundObject.playAsync()`

-   `soundObject.pauseAsync()`

-   `soundObject.stopAsync()`

-   `soundObject.setPositionAsync(millis)`

-   `soundObject.setRateAsync(value, shouldCorrectPitch)`

-   `soundObject.setVolumeAsync(value)`

-   `soundObject.setIsMutedAsync(value)`

-   `soundObject.setIsLoopingAsync(value)`

-   `soundObject.setProgressUpdateIntervalAsync(millis)`

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

    After `prepareToRecordAsync()` is called, but before `stopAndUnloadAsync()` is called, the `status` will be as follows:

    -   `canRecord` : a boolean set to `true`.
    -   `isRecording` : a boolean describing if the `Recording` is currently recording.
    -   `durationMillis` : the current duration of the recorded audio.

    After `stopAndUnloadAsync()` is called, the `status` will be as follows:

    -   `canRecord` : a boolean set to `false`.
    -   `isDoneRecording` : a boolean set to `true`.
    -   `durationMillis` : the final duration of the recorded audio.

-   `recordingInstance.setCallback(callback)`

    Sets a function to be called regularly with the `status` of the `Recording`. See `getStatusAsync()` for details on `status`.

    The callback will be called when another call to the API for this recording completes (such as `prepareToRecordAsync()`, `startAsync()`, `getStatusAsync()`, or `stopAndUnloadAsync()`), and will also be called at regular intervals while the recording can record. Call `setProgressUpdateInterval()` to modify the interval with which the callback is called while the recording can record.

    #### Parameters

    -   **callback (_function_)** -- A function taking a single parameter `status` (a dictionary, described in `getStatusAsync`).

-   `recordingInstance.setProgressUpdateInterval(millis)`

    Sets the interval with which the status change callback is called while the recording can record. See `setCallback` for details on the status change callback. This value defaults to 500 milliseconds.

    #### Parameters

    -   **millis (_number_)** -- The new interval between calls of the status change callback.

-   `recordingInstance.prepareToRecordAsync()`

    Loads the recorder into memory and prepares it for recording. This must be called before calling `startAsync()`. This method can only be called if the `Recording` instance has never yet been prepared.

    #### Returns

    A `Promise` that is fulfilled when the recorder is loaded and prepared, or rejects if this failed. If another `Recording` exists in your experience that is currently prepared to record, the `Promise` will reject. The promise is resolved with the `status` of the recording (see `getStatusAsync()` for details).

-   `recordingInstance.isPreparedToRecord()`

    #### Returns

    A `boolean` that is true if and only if the `Recording` is prepared to record.

-   `recordingInstance.startAsync()`

    Begins recording. This method can only be called if the `Recording` has been prepared.

    #### Returns

    A `Promise` that is fulfilled when recording has begun, or rejects if recording could not start. The promise is resolved with the `status` of the recording (see `getStatusAsync()` for details).

-   `recordingInstance.pauseAsync()`

    Pauses recording. This method can only be called if the `Recording` has been prepared.

    NOTE: This is only available on Android API version 24 and later.

    #### Returns

    A `Promise` that is fulfilled when recording has paused, or rejects if recording could not be paused. If the Android API version is less than 24, the `Promise` will reject. The promise is resolved with the `status` of the recording (see `getStatusAsync()` for details).

-   `recordingInstance.stopAndUnloadAsync()`

    Stops the recording and deallocates the recorder from memory. This reverts the `Recording` instance to an unprepared state, and another `Recording` instance must be created in order to record again. This method can only be called if the `Recording` has been prepared.

    #### Returns

    A `Promise` that is fulfilled when recording has stopped, or rejects if recording could not be stopped. The promise is resolved with the `status` of the recording (see `getStatusAsync()` for details).

-   `recordingInstance.getURI()`

    Gets the local URI of the `Recording`. Note that this will only succeed once the `Recording` is prepared to record.

    #### Returns

    A `string` with the local URI of the `Recording`, or `null` if the `Recording` is not prepared to record.

-   `recordingInstance.createNewLoadedSound()`

    Creates and loads a new `Sound` object to play back the `Recording`. Note that this will only succeed once the `Recording` is done recording (once `stopAndUnloadAsync()` has been called).

    #### Parameters

    -   **initialStatus (_PlaybackStatusToSet_)** -- The initial intended `PlaybackStatusToSet` of the sound, whose values will override the default initial playback status. This value defaults to `{}` if no parameter is passed. See the [AV documentation](av.html) for details on `PlaybackStatusToSet` and the default initial playback status.

    -   **callback (_function_)** -- A function taking a single parameter `PlaybackStatus`. This value defaults to `null` if no parameter is passed. See the [AV documentation](av.html) for details on the functionality provided by the callback

    #### Returns

    A `Promise` that is rejected if creation failed, or fulfilled with the following dictionary if creation succeeded:

    -   `sound` : the newly created and loaded `Sound` object.
    -   `status` : the `PlaybackStatus` of the `Sound` object. See the [AV documentation](av.html) for further information.
