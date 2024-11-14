---
title: Color themes
description: Learn how to support light and dark modes in your app.
---

import { Collapsible } from '~/ui/components/Collapsible';
import { ContentSpotlight } from '~/ui/components/ContentSpotlight';
import { SnackInline, Terminal } from '~/ui/components/Snippet';

It's common for apps to support light and dark color schemes. Here is an example of how supporting both modes looks in an Expo project:

<ContentSpotlight file="guides/color-schemes.mp4" />

## Configuration

> **info** For Android and iOS projects, additional configuration is required to support switching between light and dark mode. For web, no additional configuration is required.

To configure supported appearance styles, you can use the [`userInterfaceStyle`](/versions/latest/config/app/#userinterfacestyle) property in your project's [app config](/versions/latest/config/app). By default, this property is set to `automatic` when you create a new project with the [default template](/get-started/create-a-project/).

Here is an example configuration:

```json app.json
{
  "expo": {
    "userInterfaceStyle": "automatic"
  }
}
```

You can also configure `userInterfaceStyle` property for a specific platforms by setting either [`android.userInterfaceStyle`](/versions/latest/config/app/#userinterfacestyle-2) or [`ios.userInterfaceStyle`](/versions/latest/config/app/#userinterfacestyle-1) to the preferred value.

> **info** The app will default to the `light` style if this property is absent.

When you are creating a development build, you have to install [`expo-system-ui`](/versions/latest/sdk/system-ui/#installation) to support the appearance styles for Android. Otherwise, the `userInterfaceStyle` property is ignored.

<Terminal cmd={['$ npx expo install expo-system-ui']} />

If the project is misconfigured and doesn't have `expo-system-ui` installed, the following warning will be shown in the terminal:

<Terminal
  cmd={[
    '» android: userInterfaceStyle: Install expo-system-ui in your project to enable this feature.',
  ]}
/>

You can also use the following command to check if the project is misconfigured:

<Terminal cmd={['$ npx expo config --type introspect']} />

<Collapsible summary="Using bare React Native app?">

#### Android

Ensure that the `uiMode` flag is present on your `MainActivity` (and any other activities where this behavior is desired) in **AndroidManifest.xml**:

```xml
<activity android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode">
```

Implement the `onConfigurationChanged` method in **MainActivity.java**:

```java
/* @info Import the <CODE>Intent</CODE> and <CODE>Configuration</CODE> classes. */
import android.content.Intent;
import android.content.res.Configuration;
/* @end */
public class MainActivity extends ReactActivity {
  /* @hide ... */ /* @end */

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    Intent intent = new Intent("onConfigurationChanged");
    intent.putExtra("newConfig", newConfig);
    sendBroadcast(intent);
  }
  /* @hide ... */ /* @end */
}
```

#### iOS

You can configure supported styles with the [`UIUserInterfaceStyle`](https://developer.apple.com/documentation/bundleresources/information_property_list/uiuserinterfacestyle) key in your app **Info.plist**. Use `Automatic` to support both light and dark modes.

</Collapsible>

### Supported appearance styles

The `userInterfaceStyle` property supports the following values:

- `automatic`: Follow system appearance settings and notify about any change the user makes.
- `light`: Restrict the app to support light theme only.
- `dark`: Restrict the app to support dark theme only.

## Detect the color scheme

To detect the color scheme in your project, use `Appearance` or `useColorScheme` from `react-native`:

```tsx app/index.tsx
import { Appearance, useColorScheme } from 'react-native';
```

Then, you can use `useColorScheme()` hook as shown below:

```tsx app/index.tsx
function MyComponent() {
  let colorScheme = useColorScheme();

  if (colorScheme === 'dark') {
    // render some dark thing
  } else {
    // render some light thing
  }
}
```

In some cases, you will find it helpful to get the current color scheme imperatively with [`Appearance.getColorScheme()` or listen to changes with `Appearance.addChangeListener()`](https://reactnative.dev/docs/appearance).

## Additional information

### Minimal example

<SnackInline label="useColorScheme example" dependencies={['expo-status-bar']}>

{/* prettier-ignore */}
```tsx
import { Text, StyleSheet, View, /* @info Import <CODE>useColorScheme</CODE> from react-native */ useColorScheme /* @end */ } from 'react-native';
/* @info Automatically switches bar style based on theme. */
import { StatusBar } from 'expo-status-bar';
/* @end */

export default function App() {
  const colorScheme = useColorScheme();

  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle =
    colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <Text style={[styles.text, themeTextStyle]}>Color scheme: {colorScheme}</Text>
      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
  },
  lightContainer: {
    backgroundColor: '#d0d0c0',
  },
  darkContainer: {
    backgroundColor: '#242c40',
  },
  lightThemeText: {
    color: '#242c40',
  },
  darkThemeText: {
    color: '#d0d0c0',
  },
});
```

</SnackInline>

### Tips

While you are developing your project, you can change your simulator's or device's appearance by using the following shortcuts:

- If using an Android Emulator, you can run `adb shell "cmd uimode night yes"` to enable dark mode, and `adb shell "cmd uimode night no"` to disable dark mode.
- If using a physical Android device or an Android Emulator, you can toggle the system dark mode setting in the device's settings.
- If working with an iOS emulator locally, you can use the <kbd>Cmd ⌘</kbd> + <kbd>Shift</kbd> + <kbd>a</kbd> shortcut to toggle between light and dark modes.
