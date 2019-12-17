---
title: Localization
sourceCodeUrl: "https://github.com/expo/expo/tree/sdk-35/packages/expo-localization"
---

import TableOfContentSection from '~/components/plugins/TableOfContentSection';

You can use this module to Localize your app, and access the locale data on the native device.
Using the popular library [`i18n-js`](https://github.com/fnando/i18n-js) with `expo-localization` will enable you to create a very accessible experience for users.

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator |  Web  |
| ------ | ---------- | ------ | ------ | ------ |
| ✅     |  ✅     | ✅     | ✅     | ✅    |

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-localization`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-localization).

## Usage

```javascript
import React from 'react';
import { Text } from 'react-native';
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
const en = {
  foo: 'Foo',
  bar: 'Bar {{someValue}}',
};
const fr = {
  foo: 'como telle fous',
  bar: 'chatouiller {{someValue}}',
};

i18n.fallbacks = true;
i18n.translations = { fr, en };
i18n.locale = Localization.locale;
export default class LitView extends React.Component {
  render() {
    return (
      <Text style={{ flex: 1, paddingTop: 50, alignSelf: 'center' }}>
        {i18n.t('foo')} {i18n.t('bar', { someValue: Date.now() })}
      </Text>
    );
  }
}
```

## API

```js
import * as Localization from 'expo-localization';
```

<TableOfContentSection title='Constants' contents={['Localization.locale', 'Localization.locales', 'Localization.region', 'Localization.isoCurrencyCodes', 'Localization.timezone', 'Localization.isRTL']} />

<TableOfContentSection title='Methods' contents={['Localization.getLocalizationAsync()']} />

## Constants

This API is mostly synchronous and driven by constants. On iOS the constants will always be correct, on Android you should check if the locale has updated using `AppState` and `Localization.getLocalizationAsync()`. Initally the constants will be correct on both platforms, but on Android a user can change the language and return, more on this later.

### `Localization.locale`

Native device language, returned in standard format. Ex: `en`, `en-US`, `es-US`.

### `Localization.locales`

List of all the native languages provided by the user settings. These are returned in the order the user defines in their native settings.

### `Localization.region`

**Available on iOS and Web.** Region code for your device which came from Region setting in Language & Region. Ex: US, NZ.

### `Localization.isoCurrencyCodes`

A list of all the supported ISO codes.

### `Localization.timezone`

The current time zone in display format. ex: `America/Los_Angeles`

On Web `timezone` is calculated with `Intl.DateTimeFormat().resolvedOptions().timeZone`. For a better guess you could use the `moment-timezone` library but is a very large library and will add significant bloat to your bundle.

### `Localization.isRTL`

This will return `true` if the current language is Right-to-Left.

## Methods

### `Localization.getLocalizationAsync()`

> Android only, on iOS changing the locale settings will cause all the apps to reset.

```js
type NativeEvent = {
  locale: string,
  locales: Array<string>,
  timezone: string,
  isoCurrencyCodes: ?Array<string>,
  region: ?string,
  isRTL: boolean,
};
```

**Example**

```js
// When the app returns from the background on Android...

const { locale } = await Localization.getLocalizationAsync();
```