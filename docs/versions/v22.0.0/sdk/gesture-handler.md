---
title: GestureHandler
---

An API for handling complex gestures. From the project's README:

> This library provides an API that exposes mobile platform specific native capabilities of touch & gesture handling and recognition. It allows for defining complex gesture handling and recognition logic that runs 100% in native thread and is therefore deterministic.

This API is available under the `DangerZone` namespace for the time being, as it is based on the quickly-improving [react-native-gesture-handler](https://github.com/kmagiera/react-native-gesture-handler). We recommend seeing the README on the project's GitHub repository for documentation and usage examples. No native setup is required for using this API within Expo or ExpoKit.

## Clarifications (as of SDK 22)

If you read the release notes for SDK 22, you'll see a lot of new features added to `react-native-gesture-handler`. Our native component list example shows you Swipeable interactions.
https://github.com/expo/native-component-list/blob/8ece68e1d3bdef345b8639446a9323172d82433e/screens/GestureHandler/AppleStyleSwipeableRow.js

```es6
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
```

In this example we're importing directly from `react-native-gesture-handler`. We mention `DangerZone`.

While you _can_ do this, we don't recommend it. GestureHandler is undergoing a lot of changes. Importing it from `DangerZone` is a reminder (and an easy way to search!) for things that could potentially break your app in future builds.

This is how you _should_ be using `GestureHandler` in your app:

```
import { DangerZone } from 'expo'
const { RectButton } = DangerZone.GestureHandler
```

In this case, `Swipeable` lives in a top level folder of `react-native-gesture-handler`. In the future, you'll most likely import it like everything else:

```
const { Swipeable } = DangerZone.GestureHandler
```
