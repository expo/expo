---
title: 'Implementing a checkbox in React Native'
---

One fairly common component that is not offered out of the box by React Native is the mighty checkbox. There are several packages available on npm, however it is simple enough to implement yourself, and by doing so you have full customization and control over the look and feel of your checkbox.

## Understanding the checkbox

A checkbox is basically a button that exists in one of two state - it is checked or it isn't. This makes it a perfect candidate for the `useState()` hook. Our first iteration will render a button that toggles between checked and unchecked states. When the checkbox is checked, we'll render a checkmark icon in the center of the button.

_Note: You can find more information about using icons in your Expo project here: https://docs.expo.io/guides/icons/_

```jsx
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function MyCheckbox() {
  const [checked, onChange] = useState(false);

  function onCheckmarkPress() {
    onChange(!checked);
  }

  return (
    <Pressable
      style={[styles.checkboxContainer, checked && styles.checkboxContainerChecked]}
      onPress={onCheckmarkPress}>
      {checked && <Ionicons name="checkmark" size={24} color="white" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'coral',
    backgroundColor: 'transparent',
  },

  checkboxContainerChecked: {
    backgroundColor: 'coral',
  },
});
```

_Note: https://icons.expo.fyi is a great resource for finding all of the icons available in the @expo/vector-icons package._

## Controlling the checkbox

This checkbox isn't useful in this state because the `checked` value is only accessible from within the component - more often than not you'll want to control the checkbox from outside. This is achievable by defining `checked` and `onChange` as props that are passed into the checkbox:

```jsx
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function MyCheckbox({ checked, onChange }) {
  function onCheckmarkPress() {
    onChange(!checked);
  }

  return (
    <Pressable
      style={[styles.checkboxContainer, checked && styles.checkboxContainerChecked]}
      onPress={onCheckmarkPress}>
      {checked && <Ionicons name="checkmark" size={24} color="white" />}
    </Pressable>
  );
}

// ...styles
```

_Note: This pattern is referred to as a "controlled component" - you can read more about them here: https://reactjs.org/docs/forms.html#controlled-components_

Now the checkbox can be fully controlled from a parent component like so:

```jsx
import React, { useState } from 'react';
import MyCheckbox from './MyCheckbox';

function MyForm() {
  const [checked, onChange] = useState(false);

  return <MyCheckbox checked={checked} onChange={onChange} />;
}
```

## Extending the interface

It's common enough to need to render different styles when the checkmark is `checked` and when it is not. Let's add this to the checkbox's props and make it more reusable:

```jsx
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function MyCheckbox({ checked, onChange, activeButtonStyle, inactiveButtonStyle, iconProps }) {
  function onCheckmarkPress() {
    onChange(!checked);
  }

  return (
    <Pressable style={checked ? activeButtonStyle : inactiveButtonStyle} onPress={onCheckmarkPress}>
      {checked && <Ionicons name="checkmark" size={24} color="white" {...iconProps} />}
    </Pressable>
  );
}

```

Now this checkbox ticks all of the boxes of what it should be. It toggles between `checked` states, can be controlled and its styles are fully customizable.