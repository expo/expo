---
title: File-based routing
description: Learn about Expo Router which is a file-based routing system and how to use it in your project.
---

import { FileTree } from '~/ui/components/FileTree';

This guide provides basic conventions and guidance for Expo Router and navigation patterns (stack and tabs). To follow along, you can [create a project by using the default template](/get-started/create-a-project/) or install [Expo Router library manually](/router/installation/#manual-installation) in your existing project.

## What is Expo Router?

Expo Router is a routing framework for React Native and web applications. It allows you to manage navigation between screens in your app and use the same components on multiple platforms (Android, iOS and web). It uses a file-based method to determine routes inside your app. It also provides native navigation and is built on top of [React Navigation](https://reactnavigation.org/).

## app directory

The **app** is a special directory. Any file you add to this directory becomes a route inside the native app and reflects the same URL for that route on the web.

## Create a route

In the **app** directory, a route is created by adding a file or a nested directory that includes **index.tsx** file.

For example, to create an initial route of your app, you can add **index.tsx** to the **app** directory with the following code:

```tsx app/index.tsx|collapseHeight=280
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

The **app/index.tsx** file will match the `/` route and after creating this file the **app** directory structure is:

<FileTree files={[['app/index.tsx', "matches '/'"]]} />

### File name conventions

Files named **index** match the parent directory and do not add a path segment. For example, if you expand the app's file structure by adding **app/settings/index.tsx**, it will match the `/settings` route.

<FileTree
  files={[
    ['app/index.tsx', "matches '/'"],
    ['app/settings/index.tsx', "matches '/settings'"],
  ]}
/>

> **Note:** A route file is defined by exporting a React component as the default value. The file must use either `.js`, `.jsx`, `.ts`, or `.tsx` extension.

## \_layout file

Layout files in a directory are used to define shared UI elements such as headers, tab bars so that they persist between different routes.

Any time you create a new project, by default the **app** directory will contain a **root layout** file (**app/\_layout**).

<FileTree
  files={[
    ['app/index.tsx', "matches '/'"],
    ['app/_layout', 'Root layout'],
  ]}
/>

### Root layout

Traditionally, React Native projects are structured with a single root component (defined as **App.js** or **index.js**). Similarly, the first layout file (**\_layout.tsx**) inside the **app** directory is considered to be the single root component.

Between multiple routes, a Root layout file in Expo Router is used to share UI between multiple routes such as injecting global providers, themes, styles, delay splash screen rendering until assets and fonts are loaded, or defining your app's root navigation structure.

For example, the following code exports a default React component called `RootLayout`:

```tsx app/_layout.tsx
export default function RootLayout() {
  return (
	  /* @hide ... */ /* @end */
  )
}
```

> **info** With Expo Router, any React providers defined inside **app/\_layout.tsx** are accessible by any route in your app. To improve performance and cause fewer renders, try to reduce the scope of your providers to only the routes that need them.

## Stack navigator

A stack navigator is a pattern to navigate between different routes in an app. It allows transitioning between screens and managing the navigation history. It is conceptually similar to how a web browser handles the navigation state.

For example, if you want to add a new route `/details`, create **details.tsx** file. This will allow the app user to navigate from the `/` route to `/details`:

```tsx app/details.tsx|collapseHeight=300
import { View, Text, StyleSheet } from 'react-native';

export default function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Text>Details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

After creating this route file, the current file structure looks like:

<FileTree
  files={[
    ['app/index.tsx', "matches '/'"],
    ['app/details.tsx', "matches '/details'"],
    ['app/_layout', 'Root layout'],
  ]}
/>

To allow navigation between two routes (`/` and `/details`), update the Root layout file and add a `Stack` component to it:

```tsx app/_layout.tsx|collapseHeight=440
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
    </Stack>
  );
}
```

`<Stack.Screen name={routeName} />` component in the layout file allows defining routes in a stack.

> **Note:** The `screenOptions` in the above example allows configuring options for all the routes inside a stack. See [Statically configure route options](/router/advanced/stack/#statically-configure-route-options) for more information.

## Navigating between routes

Expo Router uses a built-in component called `Link` to move between routes in an app. This is conceptually similar to how web works with the `<a>` tag and the `href` attribute.

You can use it by importing it from Expo Router library and then passing the `href` prop with the route to navigate as the value of the prop. For example, to navigate from `/` to `/details`, add a `Link` component in the **index.tsx** file:

```tsx app/index.tsx|collapseHeight=300
import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Link href="/details">View details</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### How does `Link` work?

`Link` wraps the children in a `<Text>` by default. You can customize to use a different button component.

Use the `Link` component to wrap the custom button component and the `asChild` prop which forwards all props to the first child of the `Link` component. For more information on the `Link` component's props, see [Navigate between pages](/router/navigating-pages/).

## Groups

A group is created to organize similar routes or a section of the app. Each group has a layout file, and the grouped directory requires a name inside parentheses `(group)`.

For example, you have the `/` and `/details` routes which can be grouped inside **app/(home)** directory. This updates the file structure to:

<FileTree
  files={[
    ['app/_layout.tsx', 'Root layout'],
    ['app/(home)/index.tsx', "matches '/'"],
    ['app/(home)/details.tsx', "matches '/details'"],
    ['app/(home)/_layout.tsx', 'Home layout'],
  ]}
/>

You also need to add **(home)/\_layout.tsx** which is used to define the `Stack` navigator for `/` and `/details` routes.

```tsx app/(home)/_layout.tsx|collapseHeight=440
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
    </Stack>
  );
}
```

The Root layout file also changes and now includes the **(home)** group which further uses **(home)/index** as the initial route of the app.

```tsx app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(home)" />
    </Stack>
  );
}
```

> **Note:** In the above example, the screen options are moved to **(home)/\_layout.tsx** file. This means if you add any route to the Stack navigator inside the Root layout, it will not use the same screen options as the routes inside the Home layout.

## Tab navigator

A tab navigator is a common pattern to navigate between different sections of an app using a tab bar. Expo Router provides a `Tabs` navigation component.

For example, in the current file structure, you have two different sections: Home (`/` and `/details` routes) and Settings (`/settings` route). Adding a special directory **(tabs)**, you can move the existing Home route files inside it and create a **settings.tsx**.

<FileTree
  files={[
    ['app/_layout.tsx', 'Root layout'],
    ['app/(tabs)/_layout.tsx', 'Tab layout'],
    ['app/(tabs)/(home)/index.tsx', "matches '/'"],
    ['app/(tabs)/(home)/details.tsx', "matches '/details'"],
    ['app/(tabs)/(home)/_layout.tsx', 'Home layout'],
    ['app/(tabs)/settings.tsx', "matches '/settings'"],
  ]}
/>

Any file or directory inside **(tabs)** becomes a route in the tab navigator. To switch between different routes using the tab bar, you need to create a layout file inside this directory **(tabs)/\_layout** and export a `TabLayout` component:

```tsx app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
```

> **Note:** In `TabLayout`, the existing Stack navigator for `(home)` is now nested.

To make this work, update the **app/\_layout.tsx** file by adding **(tabs)** as the first route.

```tsx app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

## Not found routes

Expo Router provides a special file **+not-found.tsx** which is used to handle routes that are 404s. This route file matches all unmatched routes from a nested level.

Create this file in the **app** directory:

```tsx +not-found.tsx|collapseHeight=320
import { Link, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops! This screen doesn't exist." }} />
      <View style={styles.container}>
        <Link href="/">Go to home screen</Link>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```
