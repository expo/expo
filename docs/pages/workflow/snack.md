---
title: "Snack: a playground in your browser"
---

import SnackEmbed from '~/components/plugins/SnackEmbed';
import SnackInline from '~/components/plugins/SnackInline';

Creating a shareable and runnable code example should be quick and easy. Without Snack, if you have some code that you want to share then other developers that want to run it need to have a development environment set up, they need to download your project, trust that it is safe to run, install the dependencies, and then start the project. Tools like CodeSandbox, Blitz, and Replit solved this for web apps. You can create a project, write the code in your browser, and share it with a link.

Snack solves precisely that problem. It's an open-source platform for running React Native apps in the browser. You can write React Native code and run it directly in Expo Go or even in the browser. When you want to share the code, save it and share the URL, or embed it on your website, like in the [React Native](http://reactnative.dev/) and [React Navigation](https://reactnavigation.org/) documentation sites.

## Let's get started

Head over to [https://snack.expo.dev](https://snack.expo.dev) and start typing! On the right, you'll see the preview of the changes you make. By going to the "Android" or "iOS" tabs, you can preview it on a simulator directly in the browser. To open it on your device, go to the "My Device" tab and open it in the Expo Go app.

## Adding a library

You can add any library that works in a managed Expo project, like [`expo-camera`](../../versions/latest/sdk/camera.md) or [`React Navigation`](https://reactnavigation.org). Add the import in the file that you want, and Snack will prompt you to install that dependency. You can also specify the exact version by adding it to your **package.json** file.

> Not all React Native libraries will work on Snack. First, [the same constraints](../../workflow/using-libraries.md) that apply to the Expo managed workflow apply here. Second, Snack bundles the code differently than Expo CLI and React Native CLI, so in some cases libraries that work locally on your machine will fail to load in Snack.

## Saving and sharing code

You can always share the code you just created. Save the Snack on your Expo account, and share the link. Anyone with that link can view, fork and edit, and share it as another Snack. Saved Snacks will appear for your account under the Profile tab in the Expo Go app.

## Embed it on your website

Snacks can also be embedded as "live" code previews, like the [React Native docs](https://reactnative.dev/docs/intro-react#your-first-component). Either share a link with the embedded code or use [the embed script](https://github.com/expo/snack/blob/main/docs/embedding-snacks.md) for the live preview. If you use [Docusaurus](https://docusaurus.io/), check out the [remark-snackplayer plugin](https://github.com/facebook/react-native-website/tree/master/plugins/remark-snackplayer).

<SnackEmbed snackId="@brents/hello-world" preview />

<br />

It's also possible to format the code however you like on your website and send the code to run on Snack when requested by the user. See [SnackInline](https://github.com/expo/expo/tree/main/docs/components/plugins/SnackInline.tsx) for how we implement this in the Expo documentation.

<SnackInline>

```js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hello, World!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

</SnackInline>

## Debugging your code

All logs from the web and mobile device previews are visible in toolbar below the editor. To inspect the logs, click on bottom toolbar and go to the "Logs" tab. While it's possible to view logs, it is not possible to connect a JavaScript debugger in Snack, you will need to download your project and run it with `expo-cli` in order to do this. Press the download button in the header bar on the right to download the project to your machine.

## Static analysis

ESLint and TypeScript are integrated with Snack. When making a syntax error or just a typo, you will be warned about the error. TypeScript will give you autocompletion as well. Right click your **App.js** file in the file browser on the left side of the editor and choose "Rename to App.tsx" to enable TypeScript.