---
title: Video
---

A component that displays a video inline with the other React Native UI elements in your app. The display dimensions and position of the video on screen can be set using usual React Native styling.

<div data-sketch-id="B1eqoFkhx" data-sketch-platform="ios" data-sketch-preview="true" class="embedded-example-container"></div>
<br />

## `Expo.Video`

### props

- `source`

  The source of the video data to display. The following forms are supported:

  - A string with a network URL pointing to a video file on the web.
  - `require('path/to/file')` for a video file asset in the source code directory.

  The [iOS developer documentation](https://developer.apple.com/library/ios/documentation/Miscellaneous/Conceptual/iPhoneOSTechOverview/MediaLayer/MediaLayer.html) lists the video formats supported on iOS.

  The [Android developer documentation](https://developer.android.com/guide/appendix/media-formats.html#formats-table) lists the video formats supported on Android.

- `fullscreen`

  Boolean specifying whether to use fullscreen display.

- `resizeMode`

  How the video should be scaled for display in the component view bounds. Must be one of the following values:

  - `Expo.Video.RESIZE_MODE_STRETCH` -- Stretch to fill component bounds.
  - `Expo.Video.RESIZE_MODE_CONTAIN` -- Fit within component bounds while preserving aspect ratio.
  - `Expo.Video.RESIZE_MODE_COVER` -- Fill component bounds while preserving aspect ratio.

- `repeat`

  If true the video is repeated endlessly else it is played just once.

- `paused`

  If true the video is paused at the last point this prop switched from false to true, else the video continues playing.

- `volume`

  Number between 0 and 1 specifying the volume to play the video's audio at.

- `muted`

  Whether to mute audio playback. The value of the `volume` prop is preserved across changing this prop.

- `rate`

  Number specifying the rate of playback of the video. A value of 0 pauses playback while a value of 1 plays the video at its normal speed. Values other than 0 or 1 can be used for slow, fast-forward or reverse playback if the parameters to the [onLoad](#video-on-load) callback prop indicate that such special playback is supported.

- `onLoadStart`

  A function that will be called when the video data will start being fetched over the network. The function is called with a parameter `{ uri }` where `uri` gives the URI that the data is being fetched from.

- `onLoad`

  A function that will be called when initial video data has been fetched. The data is streamed so all of it may not have been fetched yet, just enough to render the first frame. The function is called with an object as parameter that has the following members:

  -   `duration` -- The duration of the video in seconds
  -   `currentTime` -- The current video playback position in seconds
  -   `canPlayReverse` -- Whether normal-rate reverse playback is supported
  -   `canPlayFastForward` -- Whether fast-forward playback is supported
  -   `canPlaySlowForward` -- Whether slow-forward playback is supported
  -   `canPlaySlowReverse` -- Whether slow-reverse playback is supported
  -   `canStepBackward` -- Whether seeking backward is supported
  -   `canStepForward` -- Whether seeking forward is supported
  -   `naturalSize` -- An object of the form `{ width, height, orientation }` where `orientation` is `'landscape'` or `'portrait'`

- `onError`

  A function that will be called on load or playback error. Receives one argument of the form `{ error: { code, domain }` on iOS and `{ error: { what, extra }` on Android.

- `onProgress`

  A function that will be called every time video playback progresses. It is called at most once every 250 milliseconds. Receives an argument of the form `{ currentTime, playableDuration }` where `currentTime` is the current playback position in seconds and `playableDuration` is the length of the buffered video in seconds.

- `onSeek`

  A function that will be called when the video is seeked (say through the `.seek()` function on its the component's ref). Receives an argument of the form `{ currentTime, seekTime }`, where `currentTime` gives the old playback position of the video in seconds and and `seekTime` gives the new playback position that is being seeked to.

- `onEnd`

  A function that will be called when playback reaches the end of the video. Called without any arguments.

#### The following methods are available on the component's ref:

- `seek`(_time_)

  Move playback to the given time in seconds. The parameters to the [onLoad](#video-on-load) callback prop indicate whether forward and/or backward seeking are supported.

- `presentFullscreenPlayer()`

  Switch to fullscreen display.

- `dismissFullscreenPlayer()`

  Switch out of fullscreen display.
