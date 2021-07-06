---
title: GestureHandler
sourceCodeUrl: 'https://github.com/kmagiera/react-native-gesture-handler'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

An API for handling complex gestures. From the project's README:

> This library provides an API that exposes mobile platform specific native capabilities of touch & gesture handling and recognition. It allows for defining complex gesture handling and recognition logic that runs 100% in native thread and is therefore deterministic.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="react-native-gesture-handler" href="https://kmagiera.github.io/react-native-gesture-handler/docs/getting-started.html" />

## API

Importing gesture handlers:

```js
import { TapGestureHandler, RotationGestureHandler } from 'react-native-gesture-handler';

class ComponentName extends Component {
  render() {
    return (
      <TapGestureHandler>
        <RotationGestureHandler>...</RotationGestureHandler>
      </TapGestureHandler>
    );
  }
}
```

Read the [react-native-gesture-handler docs](https://kmagiera.github.io/react-native-gesture-handler) for more information on the API and usage.
