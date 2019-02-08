---
title: GestureHandler
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

An API for handling complex gestures. From the project's README:

> This library provides an API that exposes mobile platform specific native capabilities of touch & gesture handling and recognition. It allows for defining complex gesture handling and recognition logic that runs 100% in native thread and is therefore deterministic.

Read the [react-native-gesture-handler docs](https://kmagiera.github.io/react-native-gesture-handler) for more information on the API and usage.

```js
import { GestureHandler } from 'expo';

// You can alternatively import from the react-native-gesture-handler package.
// The Expo import is an alias for it and ensures that you have the correct
// version of the package for the version of Expo that you are using
// import GestureHandler from 'react-native-gesture-handler';
```
