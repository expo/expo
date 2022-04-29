---
title: Video
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-av'
packageName: 'expo-av'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

The `Video` component from **`expo-av`** displays a video inline with the other UI elements in your app.

Much of Video and Audio have common APIs that are documented in [AV documentation](av.md). This page covers video-specific props and APIs. We encourage you to skim through this document to get basic video working, and then move on to [AV documentation](av.md) for more advanced functionality. The audio experience of video (such as whether to interrupt music already playing in another app, or whether to play sound while the phone is on silent mode) can be customized using the [Audio API](audio.md).

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Usage

Here's a simple example of a video with a play/pause button.

<SnackInline label='Video' dependencies={['expo-av', 'expo-asset']}>

```jsx
import * as React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';

export default function App() {
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});
  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        }}
        useNativeControls
        resizeMode="contain"
        isLooping
        onPlaybackStatusUpdate={status => setStatus(() => status)}
      />
      <View style={styles.buttons}>
        <Button
          title={status.isPlaying ? 'Pause' : 'Play'}
          onPress={() =>
            status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
          }
        />
      </View>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
  },
  video: {
    alignSelf: 'center',
    width: 320,
    height: 200,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
/* @end */
```

</SnackInline>

For more advanced examples, check out the [Playlist example](https://github.com/expo/playlist-example/blob/master/App.js), and the [custom `VideoPlayer` controls component](https://github.com/ihmpavel/expo-video-player/blob/master/lib/index.tsx) that wraps `<Video>`, adds custom controls and use the `<Video>` API extensively. The `VideoPlayer` controls is used in [this app](https://github.com/expo/harvard-cs50-app).

## API

```js
import { Video } from 'expo-av';
```

<APISection packageName="expo-video" apiName="Video" strictTypes />

## Unified API

The rest of the API on the `Video` component `ref` is the same as the API for `Audio.Sound` - see the [AV documentation](av.md#playback-api) for further information:

- `videoRef.loadAsync(source, initialStatus = {}, downloadFirst = true)`

- `videoRef.unloadAsync()`

- `videoRef.getStatusAsync()`

- `videoRef.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate)`

- `videoRef.setStatusAsync(statusToSet)`

- `videoRef.playAsync()`

- `videoRef.replayAsync()`

- `videoRef.pauseAsync()`

- `videoRef.stopAsync()`

- `videoRef.setPositionAsync(millis)`

- `videoRef.setRateAsync(value, shouldCorrectPitch, pitchCorrectionQuality)`

- `videoRef.setVolumeAsync(value)`

- `videoRef.setIsMutedAsync(value)`

- `videoRef.setIsLoopingAsync(value)`

- `videoRef.setProgressUpdateIntervalAsync(millis)`
