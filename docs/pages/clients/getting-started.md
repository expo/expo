---
title: Getting Started
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import InstallSection from '~/components/plugins/InstallSection'
import SnackInline from '~/components/plugins/SnackInline';
import { Tab, Tabs } from '~/components/plugins/Tabs';

## Install the Development Client module in your project

<Tabs tabs={["With config plugins", "If you are directly managing your native projects"]}>

<Tab >
<InstallSection packageName="expo-dev-client" cmd={["expo init # if you don't already have a Managed Workflow project", "yarn add expo-dev-client@next"]} hideBareInstructions />

</Tab>

<Tab >

If you're just starting your project, you can create a new project from our template with:

<InstallSection packageName="expo-dev-client" cmd={["npx crna -t with-dev-client"]} hideBareInstructions />

If you have an existing project, you'll need to [install the package and make a few changes](installation.md) to your `AppDelegate.m`, `MainActivity.java` and `MainApplication.java`.

The Development Client uses deep links to open projects from the QR code. If you had added a custom deep link schema to your project, the Development Client will use it. However, if this isn't the case, you need to configure the deep link support for your application. The `uri-scheme` package will do this for you once you have chosen a scheme.

<InstallSection packageName="expo-dev-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

</Tab>

</Tabs>

## Building your Development Client

You can now build your project and launch it in your iOS simulator

<InstallSection packageName="expo-dev-client" cmd={["expo run:ios"]} hideBareInstructions />

or your Android emulator

<InstallSection packageName="expo-dev-client" cmd={["expo run:android"]} hideBareInstructions />

If you are eager to install your project on a physical device, we recommend using [EAS Build](eas-build.md) for the smoothest experience, but you can build and distribute the same as any other React Native application. Once its installed, you're ready to start developing by running:

<InstallSection packageName="expo-dev-client" cmd={["expo start --dev-client"]} hideBareInstructions />

## Loading your application

When you first launch your application, you will see a screen that looks like this:

<ImageSpotlight alt="The launcher screen of the Development Client" src="/static/images/dev-client-launcher.png" style={{ maxWidth: 225}} />

If a bundler is available on your local network, or you've signed in to your Expo account, you can connect to it directly from this screen.
Otherwise, you can connect by scanning the QR code displayed by Expo CLI.

## Customizing your runtime

In the Expo Go client, you can already convert text to audio with [expo-speech](/versions/latest/sdk/speech), but what if you want to go the other direction and convert audio to text?  The community module [`@react-native-voice/voice`](https://github.com/react-native-voice/voice) provides this capability, and thanks to config plugins, you can add it into our project!

Add the module to our project by installing the module

<InstallSection packageName="expo-dev-client" cmd={["yarn add @react-native-voice/voice"]} hideBareInstructions />

and registering the plugin in your app.json
<!-- prettier-ignore -->
```js
"expo": {
  "plugins": ["@react-native-voice/voice"]
}
```

> ⚠️ Because adding this module changes our native runtime, you need to generate a new build of our development client with EAS before you'll be able to use it.

Once you've generated new builds with EAS build or the `expo run` commands, you can access the new capabilities in your application code:

<SnackInline>

<!-- prettier-ignore -->
```js

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableHighlight,
} from 'react-native';

import Voice, {
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

type Props = {};
type State = {
  recognized: string;
  pitch: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
};

class VoiceTest extends Component<Props, State> {
  state = {
    recognized: '',
    pitch: '',
    error: '',
    end: '',
    started: '',
    results: [],
    partialResults: [],
  };

  constructor(props: Props) {
    super(props);
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
  }

  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

  onSpeechStart = (e: any) => {
    console.log('onSpeechStart: ', e);
    this.setState({
      started: '√',
    });
  };

  onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    console.log('onSpeechRecognized: ', e);
    this.setState({
      recognized: '√',
    });
  };

  onSpeechEnd = (e: any) => {
    console.log('onSpeechEnd: ', e);
    this.setState({
      end: '√',
    });
  };

  onSpeechError = (e: SpeechErrorEvent) => {
    console.log('onSpeechError: ', e);
    this.setState({
      error: JSON.stringify(e.error),
    });
  };

  onSpeechResults = (e: SpeechResultsEvent) => {
    console.log('onSpeechResults: ', e);
    this.setState({
      results: e.value,
    });
  };

  onSpeechPartialResults = (e: SpeechResultsEvent) => {
    console.log('onSpeechPartialResults: ', e);
    this.setState({
      partialResults: e.value,
    });
  };

  _startRecognizing = async () => {
    this.setState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
    });

    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  _stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.instructions}>
          Press the button and start speaking.
        </Text>
        <Text style={styles.stat}>{`Started: ${this.state.started}`}</Text>
        <Text style={styles.stat}>{`Recognized: ${
          this.state.recognized
        }`}</Text>
        <Text style={styles.stat}>{`Error: ${this.state.error}`}</Text>
        <Text style={styles.stat}>Results</Text>
        {this.state.results.map((result, index) => {
          return (
            <Text key={`result-${index}`} style={styles.stat}>
              {result}
            </Text>
          );
        })}
        <Text style={styles.stat}>Partial Results</Text>
        {this.state.partialResults.map((result, index) => {
          return (
            <Text key={`partial-result-${index}`} style={styles.stat}>
              {result}
            </Text>
          );
        })}
        <Text style={styles.stat}>{`End: ${this.state.end}`}</Text>
        <TouchableHighlight onPress={this._startRecognizing}>
          <Text styles={styles.action}>Start Recognizing</Text>
        </TouchableHighlight>
        <TouchableHighlight onPress={this._stopRecognizing}>
          <Text style={styles.action}>Stop Recognizing</Text>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
 action: {
    textAlign: 'center',
    color: '#0000FF',
    marginVertical: 5,
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  stat: {
    textAlign: 'center',
    color: '#B0171F',
    marginBottom: 1,
  },
});

export default VoiceTest;
```

</SnackInline>

## Debugging your application

When you need to, you can access the menu by pressing Cmd-d in Expo CLI or by shaking your phone or tablet. Here you'll be able to access all of the functions of your Development Client, access any debugging functionality you need, switch to a different version of your application, or [any capabilities you have added yourself](extending-the-dev-menu.md).
