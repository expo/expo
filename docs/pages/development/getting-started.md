---
title: Getting Started
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import SnackInline from '~/components/plugins/SnackInline';
import { Tab, Tabs } from '~/components/plugins/Tabs';
import { Terminal } from '~/ui/components/Snippet';

Development builds of your app are Debug builds of your project. To create a Development build, [`expo-dev-client`](https://www.npmjs.com/package/expo-dev-client) library is used, which allows you to develop and debug projects from Expo CLI or a compatible server.

`expo-dev-client` is designed to support any workflow, release process, or set of dependencies in the Expo/React Native ecosystem. Whatever the needs of your project, either now or in the future, you'll be able to create development builds for it and get the productivity and quality of life improvements of JavaScript-driven development.

## Installing `expo-dev-client` in your project

If you have used Expo before, [config plugins](/guides/config-plugins.md) allow you to customize your project from JavaScript without ever needing to directly modify your project in Xcode or Android Studio.

<Terminal cmd={[
"# Only if you don't already have an Expo project",
"$ npx create-expo-app my-app",
"",
"$ cd my-app",
"",
"# Install development client",
"$ npx expo install expo-dev-client"
]} cmdCopy="npx create-expo-app my-app && cd my-app && expo install expo-dev-client" />

> You can also improve error messages to be helpful during the development process. To do so, add `import 'expo-dev-client';` to the top of your `App.{js|tsx}` file. For more information, see [add better error handlers](installation.md#add-better-error-handlers).

## Creating and installing your first development build

However you choose to manage your native projects, we recommend using [EAS Build](eas-build.md) for the smoothest experience, especially if you do not have experience with Xcode and Android Studio builds.

After you configure your project as covered by the [Building with EAS guide](eas-build.md), you're ready to create your build.

<Tabs tabs={["For iOS Devices", "For Android Devices"]}>

<Tab>

> Apple Developer membership required

Register any devices you would like to develop on to your ad hoc provisioning profile:
<Terminal cmd={["$ eas device:create"]} />

Once you have registered all of the iOS devices you would like to develop on, you can build your app with:
<Terminal cmd={["$ eas build --profile development --platform ios"]} />

</Tab>

<Tab>

<Terminal cmd={["$ eas build --profile development --platform android"]} />

</Tab>

</Tabs>

After creating the first build, [install it on your device](/build/internal-distribution.md).

> **Note**: If you add a library that contains native APIs to your project, for example, [`expo-secure-store`](/versions/latest/sdk/securestore/), you will have to rebuild the development client. This is because the native code of the library is not included in the development client automatically when installing the library as a dependency to your project.

## Developing your app

As you can see, creating a new native build from scratch takes long enough that you'll be tempted to switch tasks and lose your focus.

But now that you have a development build of your project installed on your device, you won't have to wait for the native build process again until you change the underlying native code that powers your app!

Instead, all you need to do to start developing is to run:

<Terminal cmd={["$ npx expo start --dev-client"]} />

Then, scan the resulting QR code with your system camera or QR code reader (if you want to develop against a physical device). Alternatively, you can press the <kbd>a</kbd> or <kbd>i</kbd> keys (to open the app in your Android Emulator or iPhone simulator).

Now make some changes to your project code and see them reflected on your device.

### The launcher screen

If you launch your development build from your device's Home Screen, you will see your launcher screen, which looks like this:

<ImageSpotlight alt="The launcher screen of a development build" src="/static/images/dev-client/launcher-screen.png" style={{ maxWidth: 600}} />

If a bundler is detected on your local network, or if you've signed in to an Expo account in both `expo-cli` and your development build, you can connect to it directly from this screen. Otherwise, you can connect by scanning the QR code displayed by Expo CLI.

## Customizing your runtime

In Expo Go, you can already convert text to audio with [expo-speech](/versions/latest/sdk/speech.md), but what if you want to go the other direction and convert audio to text? The community module [`@react-native-voice/voice`](https://github.com/react-native-voice/voice) provides this capability, and thanks to config plugins, you can add it to your project!

First, install the library as you normally would:

<Terminal cmd={["$ yarn add @react-native-voice/voice"]} cmdCopy="yarn add @react-native-voice/voice" />

then register the plugin in your `app.json`. Using this module will require new permissions, and the plugin can optionally customize the message displayed to users in the permission prompt.

{/* prettier-ignore */}
```json
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

Once you've generated new builds with EAS build or the `expo run:ios`/`expo run:android` commands, you can access the new capabilities in your app's code.

Add the following code to your **App.tsx**, run `npx expo start --dev-client`, and load your JavaScript. Now you can convert speech to text in your app!

{/* prettier-ignore */}
```js
import React, { useState, useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

export default function App() {
  const [results, setResults] = useState([]);
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

When you need to, you can access the menu by pressing <kbd>Cmd ⌘</kbd> + <kbd>d</kbd> or <kbd>Ctrl</kbd> + <kbd>d</kbd> in Expo CLI or by shaking your phone or tablet. Here you'll be able to access all of the functions of your development build, access any debugging functionality you need, or switch to a different version of your app.
