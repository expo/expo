---
title: Platform-specific Modules
description: Learn how to switch modules based on the platform in Expo Router.
---

> **warning** Platform specific extensions were added in Expo Router `3.5.0`. Follow this guide only if you are using an older version of Expo Router.

import { FileTree } from '~/ui/components/FileTree';

While building your app, you may want to show specific content based on the current platform. Platform-specific modules can make the experience more native to a given platform. The following sections describe the ways you can achieve this with Expo Router.

## Platform module

You can use the [`Platform`](https://reactnative.dev/docs/platform-specific-code#platform-module) module from React Native to detect the current platform and render the appropriate content based on the result. For example, you can render a `Tabs` layout on native and a custom layout on the web.

```tsx app/_layout.tsx
import { Platform } from 'react-native';
import { Link, Slot, Tabs } from 'expo-router';

export default function Layout() {
  if (Platform.OS === 'web') {
    // Use a basic custom layout on web.
    return (
      <div style={{ flex: 1 }}>
        <header>
          <Link href="/">Home</Link>
          <Link href="/settings">Settings</Link>
        </header>
        <Slot />
      </div>
    );
  }
  // Use a native bottom tabs layout on native platforms.
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

## Platform specific extensions

Metro bundler's platform-specific extensions (for example, **.ios.tsx** or **.native.tsx**) are not supported in the **app** directory. This ensures that routes are universal across platforms for deep linking. However, you can create platform-specific files outside the **app** directory and use them from within the **app** directory.

Consider the following project:

<FileTree
  files={[
    'app/_layout.tsx',
    'app/index.tsx',
    'app/about.tsx',
    'components/about.tsx',
    'components/about.ios.tsx',
    'components/about.web.tsx',
  ]}
/>

For example, the designs require you to build different `about` screens for each platform. In that case, you can create a component for each platform in the **components** directory using platform extensions. When imported, Metro will ensure the correct component version is used based on the current platform. You can then re-export the component as a screen in the **app** directory.

```tsx app/about.tsx
export { default } from '../components/about';
```

> **info** **Best practice:** Always provide a file without a platform extension to ensure every platform has a default implementation.
