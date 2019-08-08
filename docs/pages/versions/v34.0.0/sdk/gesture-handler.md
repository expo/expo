---
title: GestureHandler
---

An API for handling complex gestures. From the project's README:

> This library provides an API that exposes mobile platform specific native capabilities of touch & gesture handling and recognition. It allows for defining complex gesture handling and recognition logic that runs 100% in native thread and is therefore deterministic.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-gesture-handler`. In bare apps, also follow the [react-native-gesture-handler linking and configuration instructions](https://kmagiera.github.io/react-native-gesture-handler/docs/getting-started.html).

## API


Importing gesture handlers:

```js
import { TapGestureHandler, RotationGestureHandler } from 'react-native-gesture-handler';

class ComponentName extends Component { 
  render () {
    return (
      <TapGestureHandler>
        <RotationGestureHandler>
        ...
        </RotationGestureHandler>
      </TapGestureHandler>
    );
  }
}
```

Read the [react-native-gesture-handler docs](https://kmagiera.github.io/react-native-gesture-handler) for more information on the API and usage.

