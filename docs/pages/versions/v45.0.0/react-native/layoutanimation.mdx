---
id: layoutanimation
title: LayoutAnimation
---

Automatically animates views to their new positions when the next layout happens.

A common way to use this API is to call it before updating the state hook in functional components and calling `setState` in class components.

Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:

```js
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
```

## Example

```js
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const App = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={style.container}>
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
          setExpanded(!expanded);
        }}>
        <Text>Press me to {expanded ? 'collapse' : 'expand'}!</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={style.tile}>
          <Text>I disappear sometimes!</Text>
        </View>
      )}
    </View>
  );
};

const style = StyleSheet.create({
  tile: {
    backgroundColor: 'lightgrey',
    borderWidth: 0.5,
    borderColor: '#d6d7da',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default App;
```

---

# Reference

## Methods

### `configureNext()`

```js
static configureNext(config, onAnimationDidEnd?, onAnimationDidFail?)
```

Schedules an animation to happen on the next layout.

#### Parameters:

| Name               | Type     | Required | Description                         |
| ------------------ | -------- | -------- | ----------------------------------- |
| config             | object   | Yes      | See config description below.       |
| onAnimationDidEnd  | function | No       | Called when the animation finished. |
| onAnimationDidFail | function | No       | Called when the animation failed.   |

The `config` parameter is an object with the keys below. [`create`](layoutanimation.md#create) returns a valid object for `config`, and the [`Presets`](layoutanimation.md#presets) objects can also all be passed as the `config`.

- `duration` in milliseconds
- `create`, optional config for animating in new views
- `update`, optional config for animating views that have been updated
- `delete`, optional config for animating views as they are removed

The config that's passed to `create`, `update`, or `delete` has the following keys:

- `type`, the [animation type](layoutanimation.md#types) to use
- `property`, the [layout property](layoutanimation.md#properties) to animate (optional, but recommended for `create` and `delete`)
- `springDamping` (number, optional and only for use with `type: Type.spring`)
- `initialVelocity` (number, optional)
- `delay` (number, optional)
- `duration` (number, optional)

---

### `create()`

```js
static create(duration, type, creationProp)
```

Helper that creates an object (with `create`, `update`, and `delete` fields) to pass into [`configureNext`](layoutanimation.md#configurenext). The `type` parameter is an [animation type](layoutanimation.md#types), and the `creationProp` parameter is a [layout property](layoutanimation.md#properties).

**Example:**

```js
import React, { useState } from 'react';
import { View, Platform, UIManager, LayoutAnimation, StyleSheet, Button } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const App = () => {
  const [boxPosition, setBoxPosition] = useState('left');

  const toggleBox = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(500, LayoutAnimation.Types.spring, LayoutAnimation.Properties.scaleXY)
    );
    setBoxPosition(boxPosition === 'left' ? 'right' : 'left');
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Toggle Layout" onPress={toggleBox} />
      </View>
      <View style={[styles.box, boxPosition === 'left' ? null : styles.moveRight]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  box: {
    height: 100,
    width: 100,
    borderRadius: 5,
    margin: 8,
    backgroundColor: 'blue',
  },
  moveRight: {
    alignSelf: 'flex-end',
    height: 200,
    width: 200,
  },
  buttonContainer: {
    alignSelf: 'center',
  },
});

export default App;
```

## Properties

### Types

An enumeration of animation types to be used in the [`create`](layoutanimation.md#create) method, or in the `create`/`update`/`delete` configs for [`configureNext`](layoutanimation.md#configurenext). (example usage: `LayoutAnimation.Types.easeIn`)

| Types         |
| ------------- |
| spring        |
| linear        |
| easeInEaseOut |
| easeIn        |
| easeOut       |
| keyboard      |

---

### Properties

An enumeration of layout properties to be animated to be used in the [`create`](layoutanimation.md#create) method, or in the `create`/`update`/`delete` configs for [`configureNext`](layoutanimation.md#configurenext). (example usage: `LayoutAnimation.Properties.opacity`)

| Properties |
| ---------- |
| opacity    |
| scaleX     |
| scaleY     |
| scaleXY    |

---

### Presets

A set of predefined animation configs to pass into [`configureNext`](layoutanimation.md#configurenext).

| Presets       | Value                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| easeInEaseOut | `create(300, 'easeInEaseOut', 'opacity')`                                                                                                                             |
| linear        | `create(500, 'linear', 'opacity')`                                                                                                                                    |
| spring        | `{ duration: 700, create: { type: 'linear', property: 'opacity' }, update: { type: 'spring', springDamping: 0.4 }, delete: { type: 'linear', property: 'opacity' } }` |

---

### `easeInEaseOut`

Calls `configureNext()` with `Presets.easeInEaseOut`.

---

### `linear`

Calls `configureNext()` with `Presets.linear`.

---

### `spring`

Calls `configureNext()` with `Presets.spring`.

**Example:**

```js
import React, { useState } from 'react';
import { View, Platform, UIManager, LayoutAnimation, StyleSheet, Button } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const App = () => {
  const [firstBoxPosition, setFirstBoxPosition] = useState('left');
  const [secondBoxPosition, setSecondBoxPosition] = useState('left');
  const [thirdBoxPosition, setThirdBoxPosition] = useState('left');

  const toggleFirstBox = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFirstBoxPosition(firstBoxPosition === 'left' ? 'right' : 'left');
  };

  const toggleSecondBox = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
    setSecondBoxPosition(secondBoxPosition === 'left' ? 'right' : 'left');
  };

  const toggleThirdBox = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setThirdBoxPosition(thirdBoxPosition === 'left' ? 'right' : 'left');
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="EaseInEaseOut" onPress={toggleFirstBox} />
      </View>
      <View style={[styles.box, firstBoxPosition === 'left' ? null : styles.moveRight]} />
      <View style={styles.buttonContainer}>
        <Button title="Linear" onPress={toggleSecondBox} />
      </View>
      <View style={[styles.box, secondBoxPosition === 'left' ? null : styles.moveRight]} />
      <View style={styles.buttonContainer}>
        <Button title="Spring" onPress={toggleThirdBox} />
      </View>
      <View style={[styles.box, thirdBoxPosition === 'left' ? null : styles.moveRight]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  box: {
    height: 100,
    width: 100,
    borderRadius: 5,
    margin: 8,
    backgroundColor: 'blue',
  },
  moveRight: {
    alignSelf: 'flex-end',
  },
  buttonContainer: {
    alignSelf: 'center',
  },
});

export default App;
```
