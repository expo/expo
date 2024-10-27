---
title: Layout routes
description: Learn how to define shared UI elements such as tab bars and headers.
---

import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';

import { BoxLink } from '~/ui/components/BoxLink';
import { FileTree } from '~/ui/components/FileTree';

By default, routes fill the entire screen. Moving between them is a full-page transition with no animation. In native apps, users expect shared elements like headers and tab bars to persist between pages. These are created using **layout routes**.

## Create a layout route

To create a layout route for a directory, create a file named **\_layout.tsx** in the directory, and export a React component as `default`.

```tsx app/home/_layout.tsx
import { Slot } from 'expo-router';

export default function HomeLayout() {
  return <Slot />;
}
```

From the above example, **Slot** will render the current child route, think of this like the `children` prop in React. This component can be wrapped with other components to create a layout.

```tsx app/home/_layout.tsx
import { Slot } from 'expo-router';

export default function HomeLayout() {
  return (
    <>
      <Header />
      <Slot />
      <Footer />
    </>
  );
}
```

Expo Router supports adding a single layout route for a given directory. If you want to use multiple layout routes, add multiple directories:

<FileTree files={['app/_layout.tsx', 'app/home/_layout.tsx', 'app/home/index.tsx']} />

```tsx app/_layout.tsx
import { Tabs } from 'expo-router';

export default function Layout() {
  return <Tabs />;
}
```

```tsx app/home/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack />;
}
```

If you want multiple layout routes without modifying the URL, you can use [groups](#groups).

## Groups

You can prevent a segment from showing in the URL by using the group syntax `()`.

- **app/root/home.tsx** matches `/root/home`
- **app/(root)/home.tsx** matches `/home`

This is useful for adding layouts without adding additional segments to the URL. You can add as many groups as you want.

Groups are also good for organizing sections of the app. In the following example, we have **app/(app)** which is where the main app lives, and **app/(aux)** which is where auxiliary pages live. This is useful for adding pages which you want to link to externally, but don't need to be part of the main app.

<FileTree
  files={[
    'app/(app)/index.tsx',
    'app/(app)/user.tsx',
    'app/(aux)/terms-of-service.tsx',
    'app/(aux)/privacy-policy.tsx',
  ]}
/>

## Native layouts

One of the best advantages to React Native is being able to use native UI components. Expo Router provides a few drop-in native layouts that you can use to easily achieve familiar native behavior. To change between truly-native layouts on certain platforms and custom layouts on others, see [Platform-specific modules](/router/advanced/platform-specific-modules).

```tsx app/home/_layout.tsx
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ ... }} />
  );
}
```

Learn more about the built-in layouts:

<BoxLink
  title="Stack navigation"
  Icon={BookOpen02Icon}
  description="Render a stack of screens like a deck of cards with a header on top. This is a native stack navigator that uses native animations and gestures."
  href="/router/advanced/stack"
/>

<BoxLink
  title="Tab navigation"
  Icon={BookOpen02Icon}
  description="Render screens with a tab bar below them."
  href="/router/advanced/tabs"
/>

<BoxLink
  title="Drawers"
  Icon={BookOpen02Icon}
  description="Add a drawer which can be pulled over the current context."
  href="/router/advanced/drawer"
/>

<BoxLink
  title="Modals"
  Icon={BookOpen02Icon}
  description="Implement native modals which float over the current context."
  href="/router/advanced/modals"
/>

## Advanced

Expo Router supports additional conventions and systems to build complex UIs that native app users expect. These are not required to use Expo Router but are available if you need them.

<BoxLink
  title="Nesting navigators"
  Icon={BookOpen02Icon}
  description="Add multiple layouts to a route."
  href="/router/advanced/nesting-navigators"
/>

<BoxLink
  title="Shared Routes"
  Icon={BookOpen02Icon}
  description="Create routes which appear in multiple places simultaneously, while using the same URL."
  href="/router/advanced/shared-routes"
/>
