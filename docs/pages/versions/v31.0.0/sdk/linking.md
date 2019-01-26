---
title: Linking
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

This module allows your app to interact with other apps via deep links. It provides helper methods for constructing and parsing deep links into your app.

This module is an extension of the React Native [Linking module](https://facebook.github.io/react-native/docs/linking.html), meaning that all methods in the RN module can be accessed via `Expo.Linking`, on top of the extra methods provided by Expo (detailed here).

### `Expo.Linking.makeUrl(path, queryParams)`

Helper method for constructing a deep link into your app, given an optional path and set of query parameters.

#### Arguments

-   **path : `string`** -- Any path into your app.
-   **queryParams : `object`** -- An object with a set of query parameters. These will be merged with any Expo-specific parameters that are needed (e.g. release channel) and then appended to the url as a query string.

#### Returns

A URL string which points to your app with the given deep link information.

### `Expo.Linking.parse(url)`

Helper method for parsing out deep link information from a URL.

#### Arguments

-   **url : `string`** -- A URL that points to the currently running experience (e.g. an output of `Expo.Linking.makeUrl()`).

#### Returns

An object with the following keys:

-   **path : `string`** -- The path into the app specified by the url.
-   **queryParams : `object`** -- The set of query parameters specified by the query string of the url.

### `Expo.Linking.parseInitialURLAsync()`

Helper method which wraps React Native's `Linking.getInitalURL()` in `Expo.Linking.parse()`. Parses the deep link information out of the URL used to open the experience initially.

#### Returns

A promise that resolves to an object with the following keys:

-   **path : `string`** -- The path specified by the url used to open the app.
-   **queryParams : `object`** -- The set of query parameters specified by the query string of the url used to open the app.
