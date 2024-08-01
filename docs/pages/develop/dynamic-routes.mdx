---
title: Dynamic routes
description: Learn about dynamic routes and how you can create them using Expo Router library.
---

import { FileTree } from '~/ui/components/FileTree';

A **dynamic route** allows matching one or multiple paths based on a dynamic segment embedded in the URL. This segment is in the form of a variable, such as a unique identifier, and your app doesn't know the exact segment ahead of time.

This guide explains how to handle dynamic routes with Expo Router.

> This guide continues to build on top of the example and the **app** directory structure used in the previous [File-based routing](/develop/file-based-routing/).

## Dynamic route convention

A dynamic segment of a route is created by wrapping a file's name in square brackets. For example, **[id].tsx**.

> **What is a dynamic segment?** Any segment of a path in a URL that is dynamic. For example, in an app screen where it displays a users list, you might have a path such as `/details/[id]` where the `[id]` is the dynamic segment and displays details based on the `id` of the user.

## Create a dynamic route

Let's consider the following **app** directory structure:

<FileTree
  files={[
    ['app/_layout.tsx', 'Root layout'],
    ['app/(tabs)/_layout.tsx', 'Tab layout'],
    ['app/(tabs)/settings.tsx', "matches '/settings'"],
    ['app/(tabs)/(home)/_layout.tsx', 'Home layout'],
    ['app/(tabs)/(home)/index.tsx', "matches '/'"],
    ['app/(tabs)/(home)/details/[id].tsx', "matches '/details/1'"],

]}
/>

In the above file structure, the `[id]` is used to display information for the route **details/[id].tsx**. The same route will display unique information based on the value of the `id`:

| Route                | Matched URL  |
| -------------------- | ------------ |
| **details/[id].tsx** | `/details/1` |
| **details/[id].tsx** | `/details/2` |

This dynamic segment convention makes sure that when an app user navigates from the home screen to the details screen, they view the correct information for the dynamic segment of the route.

## Use `Link` to navigate to a dynamic route

Navigating from one route to a dynamic route is done by providing query parameters to the `Link` component either statically or using the `href` object.

For example, the following code allows you to navigate to the dynamic route statically using query parameters:

```tsx app/(home)/index.tsx|collapseHeight=300
import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Link href="/details/1">View first user details</Link>
      <Link href="/details/2">View second user details</Link>
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

You can also use the `href` object to provide a `pathname` which takes the value of the dynamic route and passes `params`:

```tsx app/(home)/index.tsx
import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Link
        href={{
          pathname: '/details/[id]',
          params: { id: 'bacon' },
        }}>
        View user details
      </Link>
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

## Access parameters from dynamic segments

Dynamic segments of a URL are accessible with a [route parameter](/router/reference/url-parameters/) in the route component. For example, you can use the [`useLocalSearchParams`](/router/reference/hooks/#uselocalsearchparams) hook which returns the URL parameters for the selected route.

```tsx app/(home)/details/[id].tsx|collapseHeight=300
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text>Details of user {id} </Text>
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

When `/` pushes `/details/1`, the `useLocalSearchParams` returns `{ id: '1' }` because `/details/1` is the selected route.
