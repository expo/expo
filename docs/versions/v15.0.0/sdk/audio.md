---
title: Audio
---

Provides basic sample playback.

We designed the Audio API to be as non-intrusive as possible, so audio will automatically stop if other audio starts playing on the device, if the device is locked, if the app / experience is backgrounded, or if headphones / bluetooth audio devices are disconnected.

Try the [playlist example app](http://expo.io/@exponent/playlist) (source code is [on GitHub](https://github.com/exponent/playlist)) to see an example usage of this API.

## Enabling Audio

Audio is disabled by default, so your app must enable it explicitly to play sounds.

### `Exponent.Audio.setIsEnabledAsync(value)`

#### Arguments

-   **value (_boolean_)** -- `true` enables Expo Audio, and `false` disables it.

#### Returns

A `Promise` that will reject if audio playback could not be enabled for the device.

## Playing sounds

### `Exponent.Audio.Sound`

This class represents a sound corresponding to an Asset or URL.

#### Parameters

-   **options (_object_)** --

    A map of options:

    -   **source** -- The source of the audio data to display. The following forms are supported:

        -   A string with a network URL pointing to an audio file on the web.
        -   `require('path/to/file')` for an audio file asset in the source code directory.
        -   An [`Exponent.Asset`](asset.html) object for an audio file asset.

        The [iOS developer documentation](https://developer.apple.com/library/ios/documentation/Miscellaneous/Conceptual/iPhoneOSTechOverview/MediaLayer/MediaLayer.html) lists the audio formats supported on iOS.

        The [Android developer documentation](https://developer.android.com/guide/appendix/media-formats.html#formats-table) lists the audio formats supported on Android.

#### Returns

A newly constructed instance of `Exponent.Audio.Sound`.

#### Example

```javascript
const sound = new Exponent.Audio.Sound({
  source: require('./assets/sounds/hello.mp3'),
});
```

-   `soundInstance.loadAsync()`

    Loads the sound into memory and prepares it for playing. This must be called before calling `playAsync`.

    #### Returns

    A `Promise` that is fulfilled when the sound is loaded, or rejects if loading failed.

-   `soundInstance.unloadAsync()`

    Unloads the sound. `loadAsync` must be called again in order to be able to play the sound.

    #### Returns

    A `Promise` that is fulfilled when the sound is unloaded, or rejects if unloading failed.

-   `soundInstance.isLoaded()`

    #### Returns

    A `boolean` that is true if and only if the sound is loaded.

-   `soundInstance.getDurationMillis()`

    #### Returns

    The duration of the sound in milliseconds. This is available only after the sound is loaded.

-   `soundInstance.playAsync()`

    Plays the sound.

    #### Returns

    A `Promise` that is resolved, once the sound starts playing, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.pauseAsync()`

    Pauses the sound.

    #### Returns

    A `Promise` that is resolved, once playback is paused, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.stopAsync()`

    Stops the sound.

    #### Returns

    A `Promise` that is resolved, once playback is stopped, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setPositionAsync(millis)`
    Sets the playback position of the sound.

    #### Parameters

    -   **millis (_number_)** -- The position to seek the sound to.

    #### Returns

    A `Promise` that is resolved, once the seek occurs, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setRateAsync(value, shouldCorrectPitch)`
    Sets the playback rate of the sound.

    NOTE: This is only available on Android API version 23 and later.

    #### Parameters

    -   **value (_number_)** -- The desired playback rate of the sound. This value must be between `0.0` and `32.0`.

    -   **shouldCorrectPitch (_boolean_)** -- If set to `true`, the pitch of the sound will be corrected (so a rate different than `1.0` will timestretch the sound).

    #### Returns

    A `Promise` that is resolved once the rate is changed with the `status` of the sound (see `getStatusAsync` for details). If the Android API version is less than 23, the `Promise` will reject.


-   `soundInstance.setVolumeAsync(value)`

    Sets the volume of the sound. This is NOT the system volume, and will only affect this sound. This value defaults to `1.0`.

    #### Parameters

    -   **value (_number_)** -- A number between `0.0` (silence) and `1.0` (maximum volume).

    #### Returns

    A `Promise` that is resolved, once the volume is set, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setIsMutedAsync(value)`

    Sets whether the sound is muted. This is independent of the volume of the sound set in `setVolumeAsync`. This also does not affect the system volume, and only pertains to this sound. This value defaults to `true`.

    #### Parameters

    -   **value (_boolean_)** -- `true` mutes the sound, and `false` unmutes it.

    #### Returns

    A `Promise` that is resolved, once the mute state is set, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.setIsLoopingAsync(value)`

    Sets whether playback of the sound should loop. When `true`, it will loop indefinitely. This value defaults to `false`.

    #### Parameters

    -   **value (_boolean_)** -- `true` sets the sound to loop indefinitely.

    #### Returns

    A `Promise` that is resolved, once the loop state is set, with the `status` of the sound (see `getStatusAsync` for details).

-   `soundInstance.getStatusAsync()`

    Gets the `status` of the sound.

    #### Returns

    A `Promise` that is resolved with the `status` of the sound: a dictionary with the following key-value pairs.

    -   `isPlaying` : a boolean describing if the sound is currently playing.
    -   `positionMillis` : the current position of playback in milliseconds.
    -   `rate` : the current rate of the sound.
    -   `shouldCorrectPitch` : a boolean describing if we are correcting the pitch for a changed rate.
    -   `volume` : the current volume of the sound.
    -   `isMuted` : a boolean describing if the sound is currently muted.
    -   `isLooping` : a boolean describing if the sound is currently looping.

-   `soundInstance.setStatusChangeCallback(callback)`

    Sets a function to be called at regular intervals with the `status` of the Sound. See `getStatusAsync` for details on `status`, and see `setStatusPollingTimeoutMillis` for details on the regularity with which this function is called.

    #### Parameters

    -   **callback (_function_)** -- A function taking a single parameter `status` (a dictionary, described in `getStatus`).

-   `soundInstance.setStatusPollingTimeoutMillis(millis)`

    Sets the interval with which the status change callback is called. See `setStatusChangeCallback` for details on the status change callback. This value defaults to 100 milliseconds.

    Note that the status change callback will automatically be called when another call to the API for this sound completes (such as `playAsync`, `setRateAsync`, or `getStatusAsync`) regardless of this value.

    #### Parameters

    -   **millis (_number_)** -- The new interval between calls of the status change callback.

-   `soundInstance.setPlaybackFinishedCallback(callback)`

    Sets a function to be called whenever this sound is finished playing to the end. This callback is not called when looping is enabled, or when the sound is stopped or paused before it finishes playing.

    #### Parameters

    -   **callback (_function_)** -- The callback receives no parameters.
