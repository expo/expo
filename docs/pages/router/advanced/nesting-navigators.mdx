---
title: Nesting navigators
description: Learn how to nest navigators in Expo Router.
hasVideoLink: true
---

import { FileTree } from '~/ui/components/FileTree';
import { VideoBoxLink } from '~/ui/components/VideoBoxLink';

> **warning** Navigation UI elements (Link, Tabs, Stack) may move out of the Expo Router library in the future.

<VideoBoxLink
  videoId="izZv6a99Roo"
  title="Using a Stack Navigator with Expo Router"
  description="Navigate between screens, pass params between screens, create dynamic routes, and configure the screen titles and animations."
  className="mb-6"
/>

Nesting navigators allow rendering a navigator inside the screen of another navigator. This guide is an extension of [React Navigation: Nesting navigators](https://reactnavigation.org/docs/nesting-navigators) to Expo Router. It provides an example of how nesting navigators work when using Expo Router.

## Example

Consider the following file structure which is used as an example:

<FileTree
  files={[
    'src/app/_layout.tsx',
    'src/app/index.tsx',
    'src/app/home/_layout.tsx',
    'src/app/home/feed.tsx',
    'src/app/home/messages.tsx',
  ]}
/>

In the above example, **src/app/home/feed.tsx** matches `/home/feed`, and **src/app/home/messages.tsx** matches `/home/messages`.

```tsx src/app/_layout.tsx
import { Stack } from 'expo-router';

export default Stack;
```

Both **src/app/home/\_layout.tsx** and **src/app/index.tsx** below are nested in the **src/app/\_layout.tsx** layout so that it will be rendered as a stack.

```tsx src/app/home/_layout.tsx
import { Tabs } from 'expo-router';

export default Tabs;
```

```tsx src/app/index.tsx
import { Link } from 'expo-router';

export default function Root() {
  return <Link href="/home/messages">Navigate to nested route</Link>;
}
```

Both **src/app/home/feed.tsx** and **src/app/home/messages.tsx** below are nested in the **home/\_layout.tsx** layout, so it will be rendered as a tab.

```tsx src/app/home/feed.tsx
import { View, Text } from 'react-native';

export default function Feed() {
  return (
    <View>
      <Text>Feed screen</Text>
    </View>
  );
}
```

```tsx src/app/home/messages.tsx
import { View, Text } from 'react-native';

export default function Messages() {
  return (
    <View>
      <Text>Messages screen</Text>
    </View>
  );
}
```

## Stack inside native tabs

When using native tabs, you can nest a `<Stack />` layout inside each tab to support headers and pushing screens. For a complete example, see [Use Stacks inside tabs](/router/advanced/native-tabs/#use-stacks-inside-tabs).

## Navigate to a screen in a nested navigator

In React Navigation, navigating to a specific nested screen can be controlled by passing the screen name in params. This renders the specified nested screen instead of the initial screen for that nested navigator.

For example, from the initial screen inside the `root` navigator, you want to navigate to a screen called `media` inside `settings` (a nested navigator). In React Navigation, this is done as shown in the example below:

```jsx React Navigation
navigation.navigate('root', {
  screen: 'settings',
  params: {
    screen: 'media',
  },
});
```

In Expo Router, you can use `router.push()` to achieve the same result. There is no need to pass the screen name in the params explicitly.

```jsx Expo Router
router.push('/root/settings/media');
```
