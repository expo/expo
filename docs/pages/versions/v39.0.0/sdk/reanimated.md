---
title: Reanimated
sourceCodeUrl: 'https://github.com/software-mansion/react-native-reanimated'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`react-native-reanimated`** provides an API that greatly simplifies the process of creating smooth, powerful, and maintainable animations. From the project's README:

> It provides a more comprehensive, low level abstraction for the Animated library API to be built on top of and hence allow for much greater flexibility especially when it comes to gesture based interactions.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="react-native-reanimated" href="https://github.com/kmagiera/react-native-reanimated#getting-started" />

### Experimental support for v2-alpha

The second major version of this library offers a much easier API, along with significantly improved performance characteristics. It also requires that [TurboModules](https://github.com/react-native-community/discussions-and-proposals/issues/40) are enabled in your app, and [TurboModules are not compatible with JavaScript debugging in Chrome](https://docs.swmansion.com/react-native-reanimated/docs/next/#known-problems-and-limitations). Because of this limitation, you need to opt in to using the alpha version of this library.

> ⏩ If you want to play with v2-alpha in a new project before adding it to an existing project, run `npx crna --template with-reanimated2` to create a project with it configured and ready to use.

To opt in to using TurboModules for react-native-reanimated, add the `experiments.turboModules` key to your **app.json**:

```json
{
  "expo": {
    "experiments": {
      "turboModules": true
    }
  }
}
```

You also need to install the library directly with npm or yarn rather than using `expo install` because we still default to installing the stable react-native-reanimated v1.

```
# This exact version is supported:
npm install react-native-reanimated@2.0.0-alpha.6.1
```

Finally, you'll need to add the babel plugin to **babel.config.js**:

```jsx
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

Note: If you load other babel plugins, the Reanimated plugin has to be listed last in the plugins array.

When you run the project you will get a warning about an incompatible version:

```
Some of your project's dependencies are not compatible with currently installed expo package version:
 - react-native-reanimated - expected version range: ~1.13.0 - actual version installed: 2.0.0-alpha.6.1
```

You can ignore this, as you are intentionally opting in to an experimental feature.

## API Usage

You should refer to the [react-native-reanimated docs](https://github.com/kmagiera/react-native-reanimated#reanimated-overview) for more information on the API and its usage. But the following example (courtesy of that repo) is a quick way to get started.

```js
import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

import Animated, { Easing } from 'react-native-reanimated';

const { Value, timing } = Animated;

export default class Example extends React.Component {
  constructor(props) {
    super(props);
    this._transX = new Value(0);
    this._config = {
      duration: 5000,
      toValue: 180,
      easing: Easing.inOut(Easing.ease),
    };
    this._anim = timing(this._transX, this._config);
  }

  render() {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.box, { transform: [{ translateX: this._transX }] }]} />
        <Button
          onPress={() => {
            this._anim.start();
          }}
          title="Start"
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  box: {
    width: 50,
    height: 50,
    backgroundColor: 'purple',
    borderRadius: 5,
  },
});
```
