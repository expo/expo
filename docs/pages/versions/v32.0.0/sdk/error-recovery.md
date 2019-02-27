---
title: ErrorRecovery
---

Utilities for helping you gracefully handle crashes due to fatal JavaScript errors.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. It is not available to [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native apps.

## API

```js
import { ErrorRecovery } from 'expo';
```

### `ErrorRecovery.setRecoveryProps(props)`

Set arbitrary error recovery props. If your project crashes in production as a result of a fatal JS error, Expo will reload your project. If you've set these props, they'll be passed to your reloaded project's initial props under `exp.errorRecovery`. [Read more about error handling with Expo](../../guides/errors/).

#### Arguments

-   **props (_object_)** -- An object which will be passed to your reloaded project's initial props if the project was reloaded as a result of a fatal JS error.

#