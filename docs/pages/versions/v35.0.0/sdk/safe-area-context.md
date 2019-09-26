---
title: SafeAreaContext
---

A flexible API for accessing device safe area inset information. This allows you to position your content appropriately around notches, status bars, home indicators, and other such device and operating system interface elements.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-safe-area-context`. In bare apps, make sure you also follow the [react-native-safe-area-context linking instructions](https://github.com/th3rdwave/react-native-safe-area-context#getting-started).

## API

Add `SafeAreaProvider` in your app root component:

```js
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      ...
    </SafeAreaProvider>
  );
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
      <SafeAreaConsumer>
        {insets => <View style={{ paddingTop: insets.top }} />}
      </SafeAreaConsumer>
    );
  }
}
```