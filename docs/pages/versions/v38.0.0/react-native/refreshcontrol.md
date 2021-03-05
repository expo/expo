---
id: refreshcontrol
title: RefreshControl
---

This component is used inside a ScrollView or ListView to add pull to refresh functionality. When the ScrollView is at `scrollY: 0`, swiping down triggers an `onRefresh` event.

## Example

```js
import React from 'react';
import { ScrollView, RefreshControl, StyleSheet, Text, SafeAreaView } from 'react-native';
import Constants from 'expo-constants';

const wait = (timeout) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
};

const App = () => {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);

    wait(2000).then(() => setRefreshing(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text>Pull down to see RefreshControl indicator</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'pink',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
```

**Note:** `refreshing` is a controlled prop, this is why it needs to be set to true in the `onRefresh` function otherwise the refresh indicator will stop immediately.

---

# Reference

## Props

Inherits [View Props](view.md#props).

### `refreshing`

Whether the view should be indicating an active refresh.

| Type | Required |
| ---- | -------- |
| bool | Yes      |

---

### `onRefresh`

Called when the view starts refreshing.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `colors`

The colors (at least one) that will be used to draw the refresh indicator.

| Type                        | Required | Platform |
| --------------------------- | -------- | -------- |
| array of [color](https://reactnative.dev/docs/colors) | No       | Android  |

---

### `enabled`

Whether the pull to refresh functionality is enabled.

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `progressBackgroundColor`

The background color of the refresh indicator.

| Type               | Required | Platform |
| ------------------ | -------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       | Android  |

---

### `progressViewOffset`

Progress view top offset

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `size`

Size of the refresh indicator, see RefreshControl.SIZE.

| Type                                                                   | Required | Platform |
| ---------------------------------------------------------------------- | -------- | -------- |
| enum(RefreshLayoutConsts.SIZE.DEFAULT, RefreshLayoutConsts.SIZE.LARGE) | No       | Android  |

---

### `tintColor`

The color of the refresh indicator.

| Type               | Required | Platform |
| ------------------ | -------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       | iOS      |

---

### `title`

The title displayed under the refresh indicator.

| Type   | Required | Platform |
| ------ | -------- | -------- |
| string | No       | iOS      |

---

### `titleColor`

Title color.

| Type               | Required | Platform |
| ------------------ | -------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       | iOS      |
