---
title: Audio
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-46/packages/expo-av'
packageName: 'expo-av'
---

import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';
import APISection from '~/components/plugins/APISection';

**`expo-av`** allows you to implement audio playback and recording in your app.

Note that audio automatically stops if headphones / bluetooth audio devices are disconnected.

Try the [playlist example app](https://expo.dev/@documentation/playlist-example) (source code is [on GitHub](https://github.com/expo/playlist-example)) to see an example usage of the media playback API, and the [recording example app](https://expo.dev/@documentation/record) (source code is [on GitHub](https://github.com/expo/audio-recording-example)) to see an example usage of the recording API.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Usage

### Playing sounds

<SnackInline
label='Playing sounds'
dependencies={['expo-av', 'expo-asset']}
files={{
    'assets/Hello.mp3': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/c9c43b458d6daa9771a7287cae9f5b47'
  }}>

```jsx
import * as React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [sound, setSound] = React.useState();

  async function playSound() {
    console.log('Loading Sound');
    /* @info */ const { sound } = await Audio.Sound.createAsync(
      /* @end */ require('./assets/Hello.mp3')
    );
    setSound(sound);

    console.log('Playing Sound');
    await /* @info */ sound.playAsync(); /* @end */
  }

  React.useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          /* @info Always unload the Sound after using it to prevent memory leaks.*/ sound.unloadAsync(); /* @end */
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <Button title="Play Sound" onPress={playSound} />
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
/* @end */
```

</SnackInline>

### Recording sounds

<SnackInline label='Recording sounds' dependencies={['expo-av', 'expo-asset']}>

```jsx
import * as React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [recording, setRecording] = React.useState();

  async function startRecording() {
    try {
      console.log('Requesting permissions..');
      /* @info */ await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      }); /* @end */

      console.log('Starting recording..');
      /* @info */ const { recording } = await Audio.Recording.createAsync(
        /* @end */ Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    /* @info */ await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); /* @end */

    console.log('Recording stopped and stored at', uri);
  }

  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
/* @end */
```

</SnackInline>

### Playing or recording audio in background (iOS)

On iOS, audio playback and recording in background is only available in standalone apps, and it requires some extra configuration. 
On iOS, each background feature requires a special key in `UIBackgroundModes` array in your **Info.plist** file. 
In standalone apps this array is empty by default, so in order to use background features you will need to add appropriate keys to your **app.json** configuration.

See an example of **app.json** that enables audio playback in background:

```json
{
  "expo": {
    ...
    "ios": {
      ...
      "infoPlist": {
        ...
        "UIBackgroundModes": [
          "audio"
        ]
      }
    }
  }
}
```

### Notes on web usage 

- A MediaRecorder issue on Chrome produces WebM files missing the duration metadata. [See the open Chromium issue](https://bugs.chromium.org/p/chromium/issues/detail?id=642012)
- MediaRecorder encoding options and other configurations are inconsistent across browsers, utilising a Polyfill such as [kbumsik/opus-media-recorder](https://github.com/kbumsik/opus-media-recorder)
  or [ai/audio-recorder-polyfill](https://github.com/ai/audio-recorder-polyfill) in your application will improve your experience. 
  Any options passed to `prepareToRecordAsync` will be passed directly to the MediaRecorder API and as such the polyfill.
- Web browsers require sites to be served securely in order for them to listen to a mic. 
  See [MediaDevices#getUserMedia Security](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#security) for more details.

## API

```js
import { Audio } from 'expo-av';
```

<APISection packageName="expo-audio" apiName="Audio" />

## Unified API

The rest of the API on the `Sound.Audio` is the same as the API for `Video` component `ref` - see the [AV documentation](av/#playback) for further information.
