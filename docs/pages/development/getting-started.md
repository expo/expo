---
title: Getting Started
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import TerminalBlock from '~/components/plugins/TerminalBlock';
import SnackInline from '~/components/plugins/SnackInline';
import { Tab, Tabs } from '~/components/plugins/Tabs';

Development builds of your app are Debug builds of your project that include the [`expo-dev-client`](https://www.npmjs.com/package/expo-dev-client) library, which allows you to develop and debug projects from expo-cli or a compatible server.

`expo-dev-client` is designed to support any workflow, release process, or set of dependencies in the Expo / React Native ecosystem. Whatever the needs of your project, either now or in the future, you'll be able to create development builds for it and get the productivity and quality of life improvements of JavaScript-driven development.

## Installing `expo-dev-client` in your project

If you have used Expo before, especially with the Managed workflow, [config plugins](/guides/config-plugins.md) will let you customize your project from JavaScript without ever needing to directly modify Xcode or Android Studio projects.

<TerminalBlock cmd={["expo init # if you don't already have a Managed Workflow project", "expo install expo-dev-client"]}  />

> You can also improve error messages to be helpful during the development process. To do so, add `import 'expo-dev-client';` to the top of your `App.{js|tsx}` file. [Learn more](installation.md#add-better-error-handlers).


## Creating and installing your first development build

However you choose to manage your native projects, we recommend using [EAS Build](eas-build.md) for the smoothest experience, especially if you do not have experience with Xcode and Android Studio builds.

After you configure your project as covered by the [Building with EAS guide](eas-build.md), you're ready to create your build.

<Tabs tabs={["For iOS Devices", "For Android Devices"]}>

<Tab >

> Apple Developer membership required

Register any devices you would like to develop on to your ad hoc provisioning profile:
<TerminalBlock cmd={["eas device:create"]} />

Once you have registered all of the iOS devices you would like to develop on, you can build your app with:
<TerminalBlock cmd={["eas build --profile development --platform ios"]} />

</Tab>

<Tab >

<TerminalBlock cmd={["eas build --profile development --platform android"]} />

</Tab>

</Tabs>

and installing the resulting build on your device via the build page on https://expo.dev.


## Developing your app

As you can see, creating a new native build from scratch takes long enough that you'll be tempted to switch tasks and lose your focus.

But now that you have a development build of your project installed on your device, you won't have to wait for the native build process again until you change the underlying native code that powers your app!

Instead, all you need to do to start developing is to run:

<TerminalBlock packageName="expo-dev-client" cmd={["expo start --dev-client"]} />

and scanning the resulting QR code with your system camera or QR code reader (if you want to develop against a physical device)

or pressing the "a" or "i" keys (to open the app in your Android or iPhone emulator or simulator respectively).

Now make some changes to your project code and see them reflected on your device!

### The launcher screen

If you launch your development build from your device's Home Screen, you will see your launcher screen, which looks like this:

<ImageSpotlight alt="The launcher screen of a development build" src="/static/images/dev-client-launcher.png" style={{ maxWidth: 600}} />

If a bundler is detected on your local network, or if you've signed in to an Expo account in both `expo-cli` and your development build, you can connect to it directly from this screen. Otherwise you can connect by scanning the QR code displayed by Expo CLI.

## Customizing your runtime

In Expo Go, you can already convert text to audio with [expo-speech](/versions/latest/sdk/speech.md), but what if you want to go the other direction and convert audio to text? The community module [`@react-native-voice/voice`](https://github.com/react-native-voice/voice) provides this capability, and thanks to config plugins, you can add it to your project!

First, install the library as you normally would:

<TerminalBlock cmd={["yarn add @react-native-voice/voice"]} />

then register the plugin in your app.json. Using this module will require new permissions, and the plugin can optionally customize the message displayed to users in the permission prompt.

<!-- prettier-ignore -->
```js
"expo": {
  "plugins": [
    [
      "@react-native-voice/voice",
      {
        "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
        "speechRecogntionPermission": "Allow $(PRODUCT_NAME) to securely recognize user speech"
      }
    ]
  ]
}
```

> ⚠️ Because adding this module changes your native runtime, you'll need to generate a new development build before using it. If you forget to do so, you'll get an `Invariant Violation: Native module cannot be null.` error when you attempt to load your app.

Once you've generated new builds with EAS build or the `expo run` commands, you can access the new capabilities in your app's code.

Add the following code to your App.tsx, run `expo start --dev-client`, and load your JavaScript. Now you can convert speech to text in your app!

<!-- prettier-ignore -->
```js
import React, { useState, useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

export default function App() {
  const [results, setResults] = useState([] as string[]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    function onSpeechResults(e: SpeechResultsEvent) {
      setResults(e.value ?? []);
    }
    function onSpeechError(e: SpeechErrorEvent) {
      console.error(e);
    }
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    return function cleanup() {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  async function toggleListening() {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
      } else {
        setResults([]);
        await Voice.start("en-US");
        setIsListening(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Press the button and start speaking.</Text>
      <Button
        title={isListening ? "Stop Recognizing" : "Start Recognizing"}
        onPress={toggleListening}
      />
      <Text>Results:</Text>
      {results.map((result, index) => {
        return <Text key={`result-${index}`}>{result}</Text>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
});
```

## Debugging your app

When you need to, you can access the menu by pressing Cmd-d in Expo CLI or by shaking your phone or tablet. Here you'll be able to access all of the functions of your development build, access any debugging functionality you need, switch to a different version of your app, or [any capabilities you have added yourself](extending-the-dev-menu.md).
