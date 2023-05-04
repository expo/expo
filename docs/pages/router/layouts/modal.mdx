---
title: Modals
---

Modals are a common pattern in mobile apps. They are a way to present a new screen on top of the current screen. They are often used for things like creating a new account, or for a user to select an option from a list.

<video src="/router/demo/modal.mp4" controls style={{ width: "100%" }} autoplay loop />

You can implement a modal by creating a root layout route that renders certain routes as modals.

```bash title="File System"
app/
  _layout.js
  home.js
  modal.js
```

The layout route `app/_layout.js` has the ability to present components as modals. We'll also add a new route called `modal` that we'll use to render modals.

```js title=app/_layout.js
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="home"
        options={{
          // Hide the header for all other routes.
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          // Set the presentation mode to modal for our modal route.
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
```

```js title=app/home.js
import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Home Screen</Text>
      <Link href="/modal">Present modal</Link>
    </View>
  );
}
```

Now we'll create a modal which adds a back button when the modal has lost its previous context and must be presented as a standalone page.

```js title=app/modal.js
import { View } from "react-native";
import { Link, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Modal() {
  const navigation = useNavigation();
  // If the page was reloaded or navigated to directly, then the modal should be presented as
  // a full screen page. You may need to change the UI to account for this.
  const isPresented = navigation.canGoBack();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {/* Use `../` as a simple way to navigate to the root. This is not analogous to "goBack". */}
      {!isPresented && <Link href="../">Dismiss</Link>}

      {/* Native modals have dark backgrounds on iOS, set the status bar to light content. */}
      <StatusBar style="light" />
    </View>
  );
}
```
