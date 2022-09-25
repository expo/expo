---
title: 'Implementing a checkbox for Expo and React Native apps'
---

import SnackInline from '~/components/plugins/SnackInline';

One fairly common component that is not offered out of the box by Expo is the mighty checkbox. There are several packages available on npm; however, it is simple enough to implement yourself, and by doing so you have full customization and control over the look and feel of your checkbox.

## Understanding the checkbox

A checkbox is basically a button that exists in one of two states — it is checked or it isn't. This makes it a perfect candidate for the `useState()` hook. Our first iteration will render a button that toggles between checked and unchecked states. When the checkbox is checked, we'll render a checkmark icon in the center of the button.

> You can find more information about using icons in your Expo project in our [Icons guide](/guides/icons/).

<SnackInline>

```jsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons';

function MyCheckbox() {
  const [checked, onChange] = useState(false);

  function onCheckmarkPress() {
    onChange(!checked);
  }

  return (
    <Pressable
      style={[styles.checkboxBase, checked && styles.checkboxChecked]}
      onPress={onCheckmarkPress}>
      {checked && <Ionicons name="checkmark" size={24} color="white" />}
    </Pressable>
  );
}

export default function App() {
  return (
    <View style={styles.appContainer}>
      <Text style={styles.appTitle}>Checkbox Example</Text>

      <View style={styles.checkboxContainer}>
        <MyCheckbox />
        <Text style={styles.checkboxLabel}>{`⬅️ Click!`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'coral',
    backgroundColor: 'transparent',
  },

  checkboxChecked: {
    backgroundColor: 'coral',
  },

  appContainer: {
    flex: 1,
    alignItems: 'center',
  },

  appTitle: {
    marginVertical: 16,
    fontWeight: 'bold',
    fontSize: 24,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkboxLabel: {
    marginLeft: 8,
    fontWeight: 500,
    fontSize: 18,
  },
});
```

</SnackInline>

> Note: https://icons.expo.fyi is a great resource for finding all of the icons available in the @expo/vector-icons package.

## Controlling the checkbox

This checkbox isn't useful in this state because the `checked` value is accessible only from within the component — more often than not you'll want to control the checkbox from outside. This is achievable by defining `checked` and `onChange` as props that are passed into the checkbox:

<SnackInline>

```jsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

function MyCheckbox({
  /* @info Define checked and onChange as props instead of state */ checked,
  onChange /* @end */,
}) {
  function onCheckmarkPress() {
    onChange(!checked);
  }

  return (
    <Pressable
      style={[styles.checkboxBase, checked && styles.checkboxChecked]}
      onPress={onCheckmarkPress}>
      {checked && <Ionicons name="checkmark" size={24} color="white" />}
    </Pressable>
  );
}

function App() {
  /* @info Move the checked and onChange values outside of the checkbox component */
  const [checked, onChange] = useState(false);
  /* @end */

  return (
    <View style={styles.appContainer}>
      <Text style={styles.appTitle}>Checkbox Example</Text>

      <View style={styles.checkboxContainer}>
        <MyCheckbox
          /* @info Pass the checked and onChange props to the checkbox */ checked={checked}
          onChange={onChange} /* @end */
        />
        <Text style={styles.checkboxLabel}>{`⬅️ Click!`}</Text>
      </View>
    </View>
  );
}

export default App;

const styles = StyleSheet.create({
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'coral',
    backgroundColor: 'transparent',
  },

  checkboxChecked: {
    backgroundColor: 'coral',
  },

  appContainer: {
    flex: 1,
    alignItems: 'center',
  },

  appTitle: {
    marginVertical: 16,
    fontWeight: 'bold',
    fontSize: 24,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkboxLabel: {
    marginLeft: 8,
    fontWeight: 500,
    fontSize: 18,
  },
});
```

</SnackInline>

> Note: This pattern is referred to as a "controlled component" — you can read more about them here: https://reactjs.org/docs/forms.html#controlled-components.

## Extending the interface

It's common enough to need to render different styles when the checkmark is `checked` and when it is not. Let's add this to the checkbox's props and make it more reusable:

<SnackInline>

```jsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

function MyCheckbox({
  checked,
  onChange,
  /* @info Add style and icon props to make the checkbox reusable throughout your codebase */ buttonStyle = {},
  activeButtonStyle = {},
  inactiveButtonStyle = {},
  activeIconProps = {},
  inactiveIconProps = {},
  /* @end */
}) {
  function onCheckmarkPress() {
    onChange(!checked);
  }

  /* @info Set icon props based on the checked value */
  const iconProps = checked ? activeIconProps : inactiveIconProps; /* @end */

  return (
    <Pressable
      style={[
        buttonStyle,
        /* @info Pass the active / inactive style props to the button based on the current checked value */ checked
          ? activeButtonStyle
          : inactiveButtonStyle,
        /* @end */
      ]}
      onPress={onCheckmarkPress}>
      {checked && (
        <Ionicons
          name="checkmark"
          size={24}
          color="white"
          /* @info Pass along any custom icon properties to the Icon component */
          {...iconProps}
          /* @end */
        />
      )}
    </Pressable>
  );
}

function App() {
  const [checked, onChange] = useState(false);

  return (
    <View style={styles.appContainer}>
      <Text style={styles.appTitle}>Checkbox Example</Text>

      <View style={styles.checkboxContainer}>
        <MyCheckbox
          checked={checked}
          onChange={onChange}
          /* @info Pass in base and active styles for the checkbox */
          buttonStyle={styles.checkboxBase}
          activeButtonStyle={styles.checkboxChecked}
          /* @end */
        />
        <Text style={styles.checkboxLabel}>{`⬅️ Click!`}</Text>
      </View>
    </View>
  );
}

export default App;

const styles = StyleSheet.create({
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'coral',
    backgroundColor: 'transparent',
  },

  checkboxChecked: {
    backgroundColor: 'coral',
  },

  appContainer: {
    flex: 1,
    alignItems: 'center',
  },

  appTitle: {
    marginVertical: 16,
    fontWeight: 'bold',
    fontSize: 24,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkboxLabel: {
    marginLeft: 8,
    fontWeight: 500,
    fontSize: 18,
  },
});
```

</SnackInline>

Now this checkbox ticks all of the boxes of what it should be. It toggles between `checked` states, can be controlled, and its styles are fully customizable.
