# BlurView

A React component that renders a native blur view on iOS and falls back to a semi-transparent view on Android. A common usage of this is for navigation bars, tab bars, and modals.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-blur).

## API

```js
// in managed apps:
import { BlurView } from 'expo';

// in bare apps:
import { BlurView } from 'expo-blur';
```

**Props**

| Name      | Type                       | Description                                                                                                         |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| tint      | `'light' 'default' 'dark'` | On iOS and Safari this controls the filter style (Blur Effect), and the low opacity color on unsupported platforms. |
| intensity | `number`                   | From 1 to 100 to control the Blur radius on iOS and Safari, opacity on Android and Chrome                           |
