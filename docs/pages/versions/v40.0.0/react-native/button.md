---
id: button
title: Button
---

A basic button component that should render nicely on any platform. Supports a minimal level of customization.

If this button doesn't look right for your app, you can build your own button using [TouchableOpacity](touchableopacity.md) or [TouchableWithoutFeedback](touchablewithoutfeedback.md). For inspiration, look at the [source code for this button component](https://github.com/facebook/react-native/blob/master/Libraries/Components/Button.js). Or, take a look at the [wide variety of button components built by the community](https://js.coach/?menu%5Bcollections%5D=React%20Native&page=1&query=button).

```js
<Button
  onPress={onPressLearnMore}
  title="Learn More"
  color="#841584"
  accessibilityLabel="Learn more about this purple button"
/>
```

## Example

```js
import React from 'react';
import { StyleSheet, Button, View, SafeAreaView, Text, Alert } from 'react-native';

const Separator = () => <View style={styles.separator} />;

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>
          The title and onPress handler are required. It is recommended to set accessibilityLabel to
          help make your app usable by everyone.
        </Text>
        <Button title="Press me" onPress={() => Alert.alert('Simple Button pressed')} />
      </View>
      <Separator />
      <View>
        <Text style={styles.title}>
          Adjust the color in a way that looks standard on each platform. On iOS, the color prop
          controls the color of the text. On Android, the color adjusts the background color of the
          button.
        </Text>
        <Button
          title="Press me"
          color="#f194ff"
          onPress={() => Alert.alert('Button with adjusted color pressed')}
        />
      </View>
      <Separator />
      <View>
        <Text style={styles.title}>All interaction for the component are disabled.</Text>
        <Button title="Press me" disabled onPress={() => Alert.alert('Cannot press this one')} />
      </View>
      <Separator />
      <View>
        <Text style={styles.title}>
          This layout strategy lets the title define the width of the button.
        </Text>
        <View style={styles.fixToText}>
          <Button title="Left button" onPress={() => Alert.alert('Left button pressed')} />
          <Button title="Right button" onPress={() => Alert.alert('Right button pressed')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  title: {
    textAlign: 'center',
    marginVertical: 8,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
```

---

# Reference

## Props

### **`onPress`**

Handler to be called when the user taps the button. The first function argument is an event in form of [PressEvent](https://reactnative.dev/docs/pressevent).

| Type     | Required |
| -------- | -------- |
| function | Yes      |

---

### **`title`**

Text to display inside the button. On Android the given title will be converted to the uppercased form.

| Type   | Required |
| ------ | -------- |
| string | Yes      |

---

### `accessibilityLabel`

Text to display for blindness accessibility features.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `color`

Color of the text (iOS), or background color of the button (Android).

| Type                                         | Required | Default                                         |
| -------------------------------------------- | -------- | ----------------------------------------------- |
| [color](https://reactnative.dev/docs/colors) | No       | `'#2196F3'` **(Android)**<hr/>`'#007AFF'` **(iOS)** |

---

### `disabled`

If `true`, disable all interactions for this component.

| Type | Required | Default |
| ---- | -------- | ------- |
| bool | No       | `false` |

---

### `hasTVPreferredFocus` **(TV)**

TV preferred focus.

| Type | Required | Default |
| ---- | -------- | ------- |
| bool | No       | `false` |

---

### `nextFocusDown` **(Android)** **(TV)**

Designates the next view to receive focus when the user navigates down. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusDown).

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `nextFocusForward` **(Android)** **(TV)**

Designates the next view to receive focus when the user navigates forward. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusForward).

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `nextFocusLeft` **(Android)** **(TV)**

Designates the next view to receive focus when the user navigates left. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusLeft).

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `nextFocusRight` **(Android)** **(TV)**

Designates the next view to receive focus when the user navigates right. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusRight).

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `nextFocusUp` **(Android)** **(TV)**

Designates the next view to receive focus when the user navigates up. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusUp).

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `testID`

Used to locate this view in end-to-end tests.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `touchSoundDisabled` **(Android)**

If `true`, doesn't play system sound on touch.

| Type    | Required | Default |
| ------- | -------- | ------- |
| boolean | No       | `false` |
