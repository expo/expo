---
title: SafeAreaContext
sourceCodeUrl: 'https://github.com/th3rdwave/react-native-safe-area-context'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`react-native-safe-area-context`** provides a flexible API for accessing device safe area inset information. This allows you to position your content appropriately around notches, status bars, home indicators, and other such device and operating system interface elements.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="react-native-safe-area-context" href="https://github.com/th3rdwave/react-native-safe-area-context#getting-started" />

## API

Add `SafeAreaProvider` in your app root component:

```js
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  return <SafeAreaProvider>...</SafeAreaProvider>;
}
```

Usage with the hooks API:

```js
import { useSafeArea } from 'react-native-safe-area-context';

function HookComponent() {
  const insets = useSafeArea();

  return <View style={{ paddingTop: insets.top }} />;
}
```

Usage with context consumer API:

```js
import { SafeAreaConsumer } from 'react-native-safe-area-context';

class ClassComponent extends React.Component {
  render() {
    return (
      <SafeAreaConsumer>{insets => <View style={{ paddingTop: insets.top }} />}</SafeAreaConsumer>
    );
  }
}
```

## Migrating from CSS

#### Before

In a web-only app, you would use CSS environment variables to get the size of the screen's safe area insets.

`styles.css`

```css
div {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-bottom: env(safe-area-inset-bottom);
  padding-right: env(safe-area-inset-right);
}
```

#### After

Universally, the hook `useSafeArea()` can provide access to this information.

`App.js`

```jsx
import { useSafeArea } from 'react-native-safe-area-context';

function App() {
  const insets = useSafeArea();

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingBottom: insets.bottom,
        paddingRight: insets.right,
      }}
    />
  );
}
```

### Web SSR

If you are doing server side rendering on the web, you can use `initialSafeAreaInsets` to inject values based on the device the user has, or simply pass zero. Otherwise, insets measurement will break rendering your page content since it is async.

### Optimization

To speed up the initial render, you can import `initialWindowSafeAreaInsets` from this package and set it as the `initialSafeAreaInsets` prop on the provider as described in Web SSR. You cannot do this if your provider remounts, or you are using `react-native-navigation`.

```js
import { SafeAreaProvider, initialWindowSafeAreaInsets } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider initialSafeAreaInsets={initialWindowSafeAreaInsets}>...</SafeAreaProvider>
  );
}
```
