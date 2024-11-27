---
title: Modals
description: Learn how to use modals in Expo Router.
---

import { ContentSpotlight } from '~/ui/components/ContentSpotlight';
import { FileTree } from '~/ui/components/FileTree';

Modals are a common user interface pattern in mobile apps. They are used to present content on top of the existing screen and is used for different purposes, such as displaying confirmation alerts or standalone forms. You can create modals in your app using the following methods:

- Use React Native's [`Modal`](https://reactnative.dev/docs/modal) component.
- Use Expo Router's special file-based syntax to create a modal screen within the app's navigation system.

Each approach has its specific use case. Understanding when to use each method is important for creating a positive user experience.

## React Native's Modal component

The `Modal` component is part of React Native's core API. Common use cases include:

- Standalone interactions, such as self-contained tasks that don't need to be part of the navigation system.
- Temporary alerts or confirmation dialogs that are ideal for quick interactions.

Below is an example of a custom `Modal` component that overlays the current screen on different platforms:

<ContentSpotlight file="expo-router/react-native-modal.mp4" />

For most use cases, you can use the `Modal` component and customize it according to your app's user interface requirements. For details on how to use the `Modal` component and its props, see the [React Native documentation](https://reactnative.dev/docs/modal).

## Modal screen using Expo Router

A modal screen is a file created inside the **app** directory and is used as a route within the existing stack. It is used for complex interactions that need to be part of the navigation system, such as multi-step forms where you can link to a specific screen after the process completes.

Below is an example of how a modal screen works on different platforms:

<ContentSpotlight file="expo-router/modal.mp4" />

### Usage

To implement a modal route, create a screen called **modal.tsx** inside the **app** directory. Here's an example file structure:

<FileTree files={['app/_layout.tsx', 'app/index.tsx', 'app/modal.tsx']} />

The above file structure produces a layout where the `index` is the first route in the stack. Inside the root layout file (**app/\_layout.tsx**), you can add the `modal` route in the stack. To present it as a modal, set the `presentation` option to `modal` on the route.

```tsx app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="modal"
        options={{
          /* @info Set the <CODE>presentation</CODE> mode to <CODE>modal</CODE> for the modal route. */
          presentation: 'modal',
          /* @end */
        }}
      />
    </Stack>
  );
}
```

You can use the `Link` component to navigate to the modal screen from the **index.tsx** file.

{/* prettier-ignore */}
```tsx app/index.tsx|collapseHeight=350
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text>Home screen</Text>
      /* @info Use the <CODE>Link</CODE> component to navigate to the modal screen. The <CODE>href</CODE> prop is the route name of the modal screen. */
      <Link href="/modal" style={styles.link}>
        Open modal
      </Link>
      /* @end */
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    paddingTop: 20,
    fontSize: 20,
  },
});
```

The **modal.tsx** presents the contents of the modal.

```tsx app/modal.tsx|collapseHeight=250
import { StyleSheet, Text, View } from 'react-native';

export default function Modal() {
  return (
    <View style={styles.container}>
      <Text>Modal screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### Modal presentation and dismiss behavior

A modal loses its previous context when it is the current screen in the navigator and is presented as a standalone screen. Its presentation and dismissal behavior are different on each platform:

- On Android, the modal slides on top of the current screen. To dismiss it, use the back button to navigate back to the previous screen.
- On iOS, the modal slides from the bottom of the current screen. To dismiss it, swipe it down from the top.
- On web, the modal is presented as a separate route, and the dismiss behavior has to be provided manually using [`router.canGoBack()`](/router/navigating-pages/#imperative-navigation). Here's an example of how to dismiss the modal:

{/* prettier-ignore */}
```tsx app/modal.tsx
import { Link, /* @info Import the <CODE>router</CODE> object which is used to navigate imperatively. */ router /* @end */} from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Modal() {
  /* @info Use <CODE>router.canGoBack()</CODE> to check if the modal is presented as a standalone screen. If the screen was reloaded or navigated to directly, then the modal should be presented as a full screen. You may need to change the UI to account for this. */
  const isPresented = router.canGoBack();
  /* @end */

  return (
    <View style={styles.container}>
      <Text>Modal screen</Text>
      /* @info On web, use <CODE>../</CODE> as a simple way to navigate to the root. This is not analogous to <CODE>goBack</CODE>.*/
      {!isPresented && <Link href="../">Dismiss modal</Link>}
      /* @end */
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### Change status bar appearance on iOS

By default on iOS, the modal has a dark background which hides the status bar. To change the status bar appearance, you can use the `Platform` API to check if the current platform is iOS and then use the [`StatusBar`](/versions/latest/sdk/status-bar/) component to change the appearance inside the **modal.tsx** file.

{/* prettier-ignore */}
```tsx app/modal.tsx|collapseHeight=250
import { StyleSheet, Text, View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Modal() {
  return (
    <View style={styles.container}>
      <Text>Modal screen</Text>
      /* @info Use <CODE>Platform.OS</CODE> to check if the current platform is iOS and then use <CODE>StatusBar</CODE> component to change the appearance. */
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      /* @end */
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## Web modals implementation

<ContentSpotlight file="expo-router/web-modal.mp4" />

The video above demonstrates a modal window that appears over the main content of the web page. The background dims to draw focus to the modal, which contains information for the user. This is typical behavior for web modals, where users can interact with the modal or close it to return to the main page.

You can achieve the above web modal behavior by using the [`transparentModal`](https://reactnavigation.org/docs/stack-navigator/#transparent-modals) presentation mode, styling the overlay and modal content, and utilizing [`react-native-reanimated`](/versions/latest/sdk/reanimated/#installation) to animate the modal's presentation.

Modify your project's root layout (**app/\_layout.tsx**) to add an `options` object to the modal route:

```tsx app/_layout.tsx
import { Stack } from 'expo-router';

/* @info <CODE>unstable_settings</CODE> can be set in any stack's <CODE>_layout.tsx</CODE> file. It is used to define the initial route name for the stack, which ensures that users have a consistent starting point, especially when deep linking. */
export const unstable_settings = {
  initialRouteName: 'index',
};
/* @end */

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="modal"
        options={{
          /* @info Set the <CODE>presentation</CODE> mode to <CODE>transparentModal</CODE> for the modal route.*/
          presentation: 'transparentModal',
          /* @end */
          /* @info (Optional) Set the <CODE>animation</CODE> to <CODE>fade</CODE>.*/
          animation: 'fade',
          /* @end */
          /* @info Prevents showing the header. Useful for the behavior of web modals.*/
          headerShown: false,
          /* @end */
        }}
      />
    </Stack>
  );
}
```

> **info** `unstable_settings` currently works only with `Stack` navigators.

The above example sets the `index` screen as the [`initialRouteName`](/router/advanced/router-settings/#initialroutename) using [`unstable_settings`](/router/advanced/router-settings). This ensures that the transparent modal is always rendered on top of the current screen, even when users navigate to the modal screen via a direct link.

Style the overlay and modal content in **modal.tsx** as shown below:

{/* prettier-ignore */}
```tsx app/modal.tsx|collapseHeight=250
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

export default function Modal() {
  return (
    <Animated.View
      /* @info Fade in animation when the modal is presented.*/
      entering={FadeIn}
      /* @end */
      /* @info This style ensures the view takes the entire screen space, sets the overlay to black with 40% opacity, and centers the content.*/
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000040',
      }}
      /* @end */
    >
      {/* Dismiss modal when pressing outside */}
      <Link href={'/'} asChild>
        <Pressable style={StyleSheet.absoluteFill} />
      </Link>
      <Animated.View
        /* @info Slide in animation when the modal is presented.*/
        entering={SlideInDown}
        /* @end */
        /* @info This view contains the modal content.*/
        style={{
          width: '90%',
          height: '80%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
        /* @end */
      >
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Modal Screen</Text>
        <Link href="/">
          <Text>← Go back</Text>
        </Link>
      </Animated.View>
    </Animated.View>
  );
}
```

Feel free to customize the modal animations and styles to your liking.

## Additional information

### Presentation options

There are different options to present a modal screen using the `presentation` option on Android and iOS.

| Option                      | Description                                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `card`                      | The new screen will be pushed onto a stack. The default animation on Android will vary depending on the OS version and theme. On iOS, it will slide from the side.                                                               |
| `modal`                     | The new screen will be presented modally, allowing for a nested stack to be rendered inside the screen.                                                                                                                          |
| `transparentModal`          | The new screen will be presented modally, with the previous screen remaining visible. This allows the content below to still be seen if the screen has a translucent background.                                                 |
| `containedModal`            | On Android, fallbacks to `modal`. On iOS, uses [`UIModalPresentationCurrentContext`](https://developer.apple.com/documentation/uikit/uimodalpresentationstyle/uimodalpresentationcurrentcontext) modal style.                    |
| `containedTransparentModal` | On Android, fallbacks to `transparentModal`. On iOS, uses [`UIModalPresentationOverCurrentContext`](https://developer.apple.com/documentation/uikit/uimodalpresentationstyle/uimodalpresentationovercurrentcontext) modal style. |
| `fullScreenModal`           | On Android, fallbacks to `modal`. On iOS, uses [`UIModalPresentationFullScreen`](https://developer.apple.com/documentation/uikit/uimodalpresentationstyle/uimodalpresentationfullscreen) modal style.                            |
| `formSheet`                 | On Android, fallbacks to `modal`. On iOS, uses [`UIModalPresentationFormSheet`](https://developer.apple.com/documentation/uikit/uimodalpresentationstyle/uimodalpresentationformsheet) modal style.                              |
