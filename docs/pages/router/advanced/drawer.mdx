---
title: Drawer
description: Learn how to use the Drawer layout in Expo Router.
---

import { Terminal } from '~/ui/components/Snippet';
import { Tabs, Tab } from '~/ui/components/Tabs';

To use [drawer navigator](https://reactnavigation.org/docs/drawer-based-navigation) you'll need to install some extra dependencies.

## Installation

<Terminal
  cmd={[
    '$ npx expo install @react-navigation/drawer react-native-gesture-handler react-native-reanimated',
  ]}
/>

<Tabs>

<Tab label="SDK 50 and higher">

No additional configuration is required for SDK 50 and above. [Reanimated Babel plugin](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary#reanimated-babel-plugin) is automatically configured in `babel-preset-expo` when you install the library.

</Tab>

<Tab label="SDK 49 and lower">

Update your **babel.config.js** to include the Reanimated babel plugin:

{/* prettier-ignore */}
```js babel.config.js
module.exports = {
  presets: [
      /* @hide ... */ /* @end */
    ],
    plugins: [
      /* @hide ... */ /* @end */
      'react-native-reanimated/plugin',
    ],
};
```

After you add the Babel plugin, restart your development server and clear the bundler cache using the command:

<Terminal cmd={['$ npx expo start --clear']} />

> If you load other Babel plugins, the Reanimated plugin has to be the last item in the plugins array.

</Tab>

</Tabs>

## Usage

<Tabs>

<Tab label="SDK 50 and higher">

Now you can use the `Drawer` layout to create a drawer navigator. You'll need to wrap the `<Drawer />` in a `<GestureHandlerRootView>` to enable gestures. You only need one `<GestureHandlerRootView>` in your component tree. Any nested routes are not required to be wrapped individually.

```tsx app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer />
    </GestureHandlerRootView>
  );
}
```

To edit the drawer navigation menu labels, titles and screen options specific screens are required as follows:

```tsx app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="index" // This is the name of the page and must match the url from root
          options={{
            drawerLabel: 'Home',
            title: 'overview',
          }}
        />
        <Drawer.Screen
          name="user/[id]" // This is the name of the page and must match the url from root
          options={{
            drawerLabel: 'User',
            title: 'overview',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
```

> **Note:** Be careful when using `react-native-gesture-handler` on the web. It can increase the JavaScript bundle size significantly. Learn more about using [platform-specific modules](/router/advanced/platform-specific-modules/).

</Tab>

<Tab label="SDK 49 and lower">

Now you can use the `Drawer` layout to create a drawer navigator.

```tsx app/_layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return <Drawer />;
}
```

To edit the drawer navigation menu labels, titles and screen options specific screens are required as follows:

```tsx app/_layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Home',
          title: 'overview',
        }}
      />
      <Drawer.Screen
        name="user/[id]" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'User',
          title: 'overview',
        }}
      />
    </Drawer>
  );
}
```

</Tab>

</Tabs>
