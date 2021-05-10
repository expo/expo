---
title: ErrorRecovery
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-error-recovery'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';

This module provides utilities for helping you gracefully handle crashes due to fatal JavaScript errors.

<PlatformsSection android emulator ios simulator web />

## Installation

This API is pre-installed in [managed](../../../introduction/managed-vs-bare.md#managed-workflow) apps. It is not available to [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native apps. To use it in a [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-error-recovery).

## API

```js
import * as ErrorRecovery from 'expo-error-recovery';
```

### `ErrorRecovery.setRecoveryProps(props)`

Set arbitrary error recovery props. If your project crashes in production as a result of a fatal JS error, Expo will reload your project. If you've set these props, they'll be passed to your reloaded project's initial props under `exp.errorRecovery`. [Read more about error handling with Expo](../../../guides/errors.md).

#### Arguments

- **props (_object_)** -- An object which will be passed to your reloaded project's initial props if the project was reloaded as a result of a fatal JS error.

#
