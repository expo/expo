---
title: Getting Started
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import TerminalBlock from '~/components/plugins/TerminalBlock';
import SnackInline from '~/components/plugins/SnackInline';
import { Tab, Tabs } from '~/components/plugins/Tabs';

`expo-dev-client` has been designed to support any workflow, release process, or set of dependencies in the Expo / React Native ecosystem. Whatever the needs of your project, either now or in the future, you'll be able to create custom development clients for it and get the productivity and quality of life improvements of JavaScript-driven development.

Of course, there are always tradeoffs, and that flexibility means there's not just one way to get started!  If you're ever not sure how to proceed, we've used ✨sparkles✨ to indicate our most magical experience, and 👷builders👷 for alternate options that may require more configuration or set up to get working.   

## Installing the Development Client module in your project

If you have used Expo before, especially with the Managed workflow, [config plugins](guides/config-plugins.md) will let you customize your project from JavaScript without ever needing to directly modify Xcode or Android Studio projects.

<Tabs tabs={["✨With config plugins✨", "👷If you are directly managing your native projects👷"]}>

<Tab >
<TerminalBlock cmd={["expo init # if you don't already have a Managed Workflow project", "yarn add expo-dev-client"]}  />

> You can also improve error messages to be helpful during the development process. To do so, add `import 'expo-dev-client';` to the top of your `App.{js|tsx}` file. [Learn more](installation.md#add-better-error-handlers).

</Tab>

<Tab >

If you're just starting your project, you can create a new project from our template with:

<TerminalBlock cmd={["npx crna -t with-dev-client"]}  />

If you have an existing project, you'll need to [install the package and make a few changes](installation.md) to your `AppDelegate.m`, `MainActivity.java` and `MainApplication.java`.

Custom clients use deep links to open projects from the QR code. If you have added a custom deep link scheme to your project, your client will use it. However, if this isn't the case, you need to configure the deep link support for your application. The `uri-scheme` package will do this for you once you have chosen a scheme.

<TerminalBlock cmd={["npx uri-scheme add <your scheme>"]}  />

</Tab>

</Tabs>

## Building and installing your first custom client

### ✨In the cloud✨

However you choose to manage your native projects, we recommend using [EAS Build](eas-build.md) for the smoothest experience, especially if you do not have experience with Xcode and Android Studio builds.

After you configure your project as covered by [the Building with EAS guide](eas-build.md), you can build your custom client with one command:

<Tabs tabs={["For iOS Devices (Apple Developer membership required)", "For Android Devices"]}>

<Tab >

Register any devices you would like to use your development client on to your ad hoc provisioning profile:
<TerminalBlock cmd={["eas device:create"]}  />

Once you have all of the iOS devices you would like to install a custom client on registered, you can build your client with:
<TerminalBlock cmd={["eas build --profile development --platform ios"]}  />

</Tab>

<Tab >

<TerminalBlock cmd={["eas build --profile development --platform android"]}  />

</Tab>

</Tabs>

and installing the resulting build on your device.

### 👷Locally👷

If you are comfortable setting up Xcode, Android Studio, and related dependencies, you can build and distribute your app the same as any other iOS or Android application.

The `expo run` commands will run a new build, install it on to your emulated device, and launch you into your application.

<Tabs tabs={["For iOS Simulator (MacOS Only)", "For Android Emulator"]}>

<Tab >

<TerminalBlock cmd={["expo run:ios"]}  />

</Tab>

<Tab >

<TerminalBlock cmd={["expo run:android"]}  />

</Tab>

</Tabs>


## Developing your application

As you can see, creating a new native build from scratch takes long enough that you'll be tempted to switch tasks and lose your focus.

But now that you have a custom client for your project installed on your device, you won't have to wait for the native build process again until you change the underlying native code that powers your application!

Instead, all you need to do to start developing is to run:

<TerminalBlock packageName="expo-dev-client" cmd={["expo start --dev-client"]}  />

and scanning the resulting QR code with your system camera or QR code reader (if you want to develop against a physical device)

or pressing the "a" or "i" keys (to open the app in your Android or iPhone emulator respectively).

Now make some changes to your application code and see them reflected on your device!

### The launcher screen

If you launch your custom development client from your device's Home Screen, you will see your launcher screen, which looks like this:

<ImageSpotlight alt="The launcher screen of the Development Client" src="/static/images/dev-client-launcher.png" style={{ maxWidth: 600}} />

If a bundler is detected on your local network, or if you've signed in to an Expo account in both `expo-cli` and your client, you can connect to it directly from this screen. Otherwise you can connect by scanning the QR code displayed by Expo CLI.

## Customizing your runtime

In the Expo Go client, you can already convert text to audio with [expo-speech](/versions/latest/sdk/speech.md), but what if you want to go the other direction and convert audio to text?  The community module [`@react-native-voice/voice`](https://github.com/react-native-voice/voice) provides this capability, and thanks to config plugins, you can add it to your project!

First, install the library as you normally would:

<TerminalBlock cmd={["yarn add @react-native-voice/voice"]}  />

then register the plugin in your app.json.  Using this module will require new permissions, and the plugin can optionally customize the message displayed to users in the permission prompt.
<!-- prettier-ignore -->
```js
"expo": {
  "plugins": [
    "@react-native-voice/voice",
    {
      "microphonePermission" "Allow $(PRODUCT_NAME) to access your microphone",
      "speechRecogntionPermission": "Allow $(PRODUCT_NAME) to securely recognize user speech"
    }
  ]
}
```

> ⚠️ Because adding this module changes your native runtime, you'll need to generate a new development client build before using it.  If you forget to do so, you'll get an `Invariant Violation: Native module cannot be null.` error when you attempt to load your application.

Once you've generated new builds with EAS build or the `expo run` commands, you can access the new capabilities in your application code.

Add the following code to your App.tsx, run `expo start --dev-client`, and load your JavaScript.  Now you can convert speech to text in your app!

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
          <Text styles={style.action}>Start Recognizing</Text>
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

## Debugging your application

When you need to, you can access the menu by pressing Cmd-d in Expo CLI or by shaking your phone or tablet. Here you'll be able to access all of the functions of your Development Client, access any debugging functionality you need, switch to a different version of your application, or [any capabilities you have added yourself](extending-the-dev-menu.md).
