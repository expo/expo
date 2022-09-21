---
title: Linking
---

import { ConfigReactNative } from '~/components/plugins/ConfigSection';
import SnackInline from '~/components/plugins/SnackInline';
import { Terminal } from '~/ui/components/Snippet';
import { BoxLink } from '~/ui/components/BoxLink';

URLs are the most powerful way to launch native applications. Native operating systems like macOS, iOS, Android, Windows, etc. have built-in link handling which chooses an app to handle a URL based on the _URL scheme_. The most common _URL schemes_ are `https` and `http` which are delegated to web browsers like Chrome, or Safari. Native apps, like the ones built with React Native, can implement any _URL scheme_, and the JavaScript React layer can handle the URL used to launch the corresponding native app.

## Linking from your app

The [`expo-linking`][expo-linking] API universally abstracts over native linking APIs (like `window.history` on web).

```ts
import * as Linking from 'expo-linking';

Linking.openURL('https://expo.dev');
```

{/* TODO(EvanBacon): Maybe we should move `<A />` to `expo-linking`. */}

Web browsers have additional link functionality like right-click to copy, and hover to preview. You can use the package [`@expo/html-elements`](https://www.npmjs.com/package/@expo/html-elements) to get a universal `<A />` element:

<Terminal cmd={['$ npx expo install @expo/html-elements']} />

```tsx
import { A } from '@expo/html-elements';

export default function App() {
  return <A href="https://google.com">Go to Google</A>;
}
```

This renders an `<a />` on web and a interactive `<Text />` which uses the `Linking` API on native. Routers like React Navigation have built-in [linking components](https://reactnavigation.org/docs/link) that you should use to move around your app.

### Common URL schemes

There are some URL schemes for core functionality that exist on every platform. The following is a non-exhaustive list, but covers the most commonly used schemes.

| Scheme           | Description                                   |
| ---------------- | --------------------------------------------- |
| `https` / `http` | Open web browser app, eg: `https://expo.dev`  |
| `mailto`         | Open mail app, eg: `mailto: support@expo.dev` |
| `tel`            | Open phone app, eg: `tel:+123456789`          |
| `sms`            | Open SMS app, eg: `sms:+123456789`            |

### Custom URL schemes

If you know the custom scheme for another app you can link to it. Some services provide documentation for deep linking, for example the [Lyft deep linking documentation](https://developer.lyft.com/v1/docs/deeplinking) describes how to link directly to a specific pickup location and destination:

```
lyft://ridetype?id=lyft&pickup[latitude]=37.764728&pickup[longitude]=-122.422999&destination[latitude]=37.7763592&destination[longitude]=-122.4242038
```

It's possible that the user doesn't have the Lyft app installed, in which case you may want to open the App / Play Store, or let them know that they need to install it first. We recommend using the library [`react-native-app-link`](https://github.com/fiber-god/react-native-app-link) for these cases.

On iOS, `Linking.canOpenURL` requires additional configuration to query other apps' linking schemes. You can use the `expo.ios.infoPlist` key in your Expo config (**app.json**, **app.config.js**) to specify a list of schemes your app needs to query. For example:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["lyft"]
      }
    }
  }
}
```

If you don't specify this list, `Linking.canOpenURL` may return `false` regardless of whether the device has the app installed. Note that this configuration can only be tested in [development builds](/development/introduction), because it requires native changes that will not be applied when testing in [Expo Go][expo-go].

### Creating URLs

To save you the trouble of inserting a bunch of conditionals based on the environment that you're in and hardcoding urls, we provide some helper methods in our extension of the `Linking` module. When you want to provide a service with a url that it needs to redirect back into your app, you can call `Linking.createURL()` and it will resolve to the following:

- _Custom builds_: `myapp://`
- _Development in Expo Go_: `exp://127.0.0.1:19000`
- _Published app in Expo Go_: `exp://u.expo.dev/[project-id]?channel-name=[channel-name]&runtime-version=[runtime-version]`

You can also change the returned url by passing optional parameters into `Linking.createURL()`. These will be used by your app to receive data, which we will talk about in the next section.

> `Linking.createURL()` is available in `expo-linking@2.0.1` and higher. If you are using an older version, use `Linking.makeUrl()` instead.

To pass some data to an app, you can append it as a path or query string on your url. `Linking.createURL(path, { queryParams })` will construct a working url automatically for you. Example:

```ts
const redirectUrl = Linking.createURL('path/into/app', {
  queryParams: { hello: 'world' },
});
```

This will resolve into the following, depending on the environment:

- _Custom builds_: `myapp://path/into/app?hello=world`
- _Development in Expo Go_: `exp://127.0.0.1:19000/--/path/into/app?hello=world`
- _Published app in Expo Go_: `exp://u.expo.dev/[project-id]?channel-name=[channel-name]&runtime-version=[runtime-version]/--/path/into/app?hello=world`

> Notice in Expo Go that `/--/` is added to the URL when a path is specified. This indicates to Expo Go that the substring after it corresponds to the deep link path, and is not part of the path to the app itself.

### In-app browsers

The [`expo-linking`][expo-linking] API enables you to open a URL with the operating system's preferred application, you can use the [`expo-web-browser`](/versions/latest/sdk/webbrowser) module to open URLs with an in-app browser. In-app browsers are especially useful for secure [authentication](/guides/authentication).

<Terminal cmd={['$ npx expo install expo-web-browser']} />

<SnackInline label="WebBrowser vs Linking" dependencies={["expo-web-browser", "expo-linking"]}>

```js
import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export default function App() {
  return (
    <View style={styles.container}>
      <Button
        title="Open URL with the system browser"
        onPress={() => Linking.openURL('https://expo.dev')}
        style={styles.button}
      />
      <Button
        title="Open URL with an in-app browser"
        onPress={() => WebBrowser.openBrowserAsync('https://expo.dev')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginVertical: 10,
  },
});
```

</SnackInline>

## Linking to your app

To link to your [development build](/development/introduction) or standalone app, you need to specify a custom URL scheme for your app. You can register a scheme in your Expo config (**app.json**, **app.config.js**) by adding a string under the `scheme` key:

```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

Once you build and install your app, you will be able to open it with links to `myapp://`.

> [Expo Prebuild](/workflow/prebuild) automatically adds the app's iOS bundle identifier/Android package as a URL scheme.

<ConfigReactNative abstract>

In **bare** apps, you can use the [`uri-scheme` package][n-uri-scheme] to easily add, remove, list, and open your URIs.

To make your native app handle `myapp://` simply run:

<Terminal cmd={['$ npx uri-scheme add myapp']} />

You should now be able to see a list of all your project's schemes by running:

<Terminal cmd={['$ npx uri-scheme list']} />

You can test it to ensure it works like this:

<Terminal cmd={[
'# Rebuild the native apps, be sure to use an emulator',
'yarn android',
'yarn ios',
'',
'# Open a URI scheme',
'npx uri-scheme open myapp://some/redirect'
]} cmdCopy="yarn android && yarn ios && npx uri-scheme open myapp://some/redirect" />

</ConfigReactNative>

### Linking to Expo Go

[Expo Go][expo-go] uses the `exp://` scheme, but if we link to `exp://` without any address afterwards, it will open the app to the home screen.

In development, your app will live at a url like `exp://127.0.0.1:19000`. When published, an experience will be hosted at a URL like `exp://u.expo.dev/[project-id]?channel-name=[channel-name]&runtime-version=[runtime-version]`, where `u.expo.dev/[project-id]` is the hosted URL that Expo Go fetches from.

You can test this mechanism in your mobile browser by searching `exp://u.expo.dev/F767ADF57-B487-4D8F-9522-85549C39F43F?channel-name=main&runtime-version=exposdk:45.0.0`, this will redirect to your experience in the Expo Go app.

By default `exp://` is replaced with `http://` when opening a URL in Expo Go. Similarly you can use `exps://` to open `https://` URLs. `exps://` does not currently support loading sites with insecure TLS certificates.

### Handling links

Links that launched your app can be observed using the `Linking.useURL` React hook:

```tsx
import * as Linking from 'expo-linking';
import { Text } from 'react-native';

export default function App() {
  const url = Linking.useURL();

  return <Text>URL: {url}</Text>;
}
```

Behind the scenes this hook uses the following imperative API methods:

1. The link that started the app is initially returned with: [`Linking.getInitialURL`](/versions/latest/sdk/linking/#linkinggetinitialurl)
2. Any new links that were triggered while the app was already open are observed with: [`Linking.addEventListener('url', callback)`](/versions/latest/sdk/linking/#linkingaddeventlistenertype-handler)

Learn more in the [API documentation](/versions/latest/sdk/linking).

### Parsing URLs

Parse the **path**, **hostname**, and **query parameters** from a URL with the `Linking.parse()` function. Unlike other URL parsing methods, this function considers nonstandard implementations like [Expo Go linking](#linking-to-expo-go). Example:

```javascript
function App() {
  const url = Linking.useURL();

  if (url) {
    const { hostname, path, queryParams } = Linking.parse(url);

    console.log(
      `Linked to app with hostname: ${hostname}, path: ${path} and data: ${JSON.stringify(
        queryParams
      )}`
    );
  }

  return null;
}
```

## Testing URLs

> Adding schemes will require a rebuilding your custom app.

You can open a URL like:

<Terminal cmd={[
'# Custom builds',
'$ npx uri-scheme open myapp://somepath/into/app?hello=world --ios',
'',
'# Expo Go in development (adjust the `127.0.0.1:19000` to match your dev server URL)',
'$ npx uri-scheme open exp://127.0.0.1:19000/--/somepath/into/app?hello=world --ios']}
/>

You can _also_ open a URL by searching for it on the device's native browser. For example, opening Safari on iOS and typing `exp://` then searching will prompt you to open [Expo Go][expo-go] (if installed).

## Next

<BoxLink title="Deep linking" description="Setup iOS universal links and Android deep links." href="/guides/deep-linking" />

<BoxLink title="Authentication" description="Use linking to implement web-based authentication." href="/guides/authentication" />

<BoxLink title="Routing" description="Setup React Navigation linking for in-app routing." href="https://reactnavigation.org/docs/configuring-links" />

[expo-go]: https://expo.dev/expo-go
[n-uri-scheme]: https://www.npmjs.com/package/uri-scheme
[expo-linking]: /versions/latest/sdk/linking
