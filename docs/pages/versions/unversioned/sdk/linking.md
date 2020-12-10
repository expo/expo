---
title: Linking
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo/src/Linking'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

This module allows your app to interact with other apps via deep links. It provides helper methods for constructing and parsing deep links into your app.

This module is an extension of the React Native [Linking module](https://reactnative.dev/docs/linking.html), meaning that all methods in the RN module can be accessed via `Linking`, on top of the extra methods provided by Expo (detailed here). **These methods only apply to the managed workflow, you cannot use them in a bare React Native app**.

For information and examples on how to use this API and the `react-native` Linking API in your app, take a look at [this guide](../../../workflow/linking.md).

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-linking" />

## API

```js
import * as Linking from 'expo-linking';
```

## Methods

### `Linking.makeUrl(path, queryParams)`

Helper method for constructing a deep link into your app, given an optional path and set of query parameters.

#### Arguments

- **path (_string_)** -- Any path into your app.
- **queryParams (_object_)** -- An object with a set of query parameters. These will be merged with any Expo-specific parameters that are needed (e.g. release channel) and then appended to the url as a query string.

#### Returns

A URL string which points to your app with the given deep link information.

### `Linking.parse(url)`

Helper method for parsing out deep link information from a URL.

#### Arguments

- **url (_string_)** -- A URL that points to the currently running experience (e.g. an output of `Linking.makeUrl()`).

#### Returns

An object with the following keys:

- **path (_string_)** -- The path into the app specified by the url.
- **queryParams (_object_)** -- The set of query parameters specified by the query string of the url.

### `Linking.parseInitialURLAsync()`

Helper method which wraps React Native's `Linking.getInitialURL()` in `Linking.parse()`. Parses the deep link information out of the URL used to open the experience initially.

#### Returns

A promise that resolves to an object with the following keys:

- **path (_string_)** -- The path specified by the url used to open the app.
- **queryParams (_object_)** -- The set of query parameters specified by the query string of the url used to open the app.

## Hooks

### `Linking.useUrl()`

Returns the initial URL followed by any subsequent changes to the URL.
