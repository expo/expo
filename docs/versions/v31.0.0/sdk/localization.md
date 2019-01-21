---
title: Localization
---

You can use this module to Localize your app, and access the locale data on the native device.
Using the popular library [`i18n-js`](https://github.com/fnando/i18n-js) with `expo-localization` will enable you to create a very accessible experience for users.

## Usage

```javascript
import React from 'react';
import { Text } from 'react-native';
import { Localization } from 'expo-localization';
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
      <Text>
        {i18n.t('foo')} {i18n.t('bar', { someValue: Date.now() })}
      </Text>
    );
  }
}
```

## API

### Constants

This API is mostly synchronous and driven by constants. On iOS the constants will always be correct, on Android you should check if the locale has updated using `AppState` and `Expo.Localization.getLocalizationAsync()`. Initally the constants will be correct on both platforms, but on Android a user can change the language and return, more on this later.

#### `Localization.locale: string`

Native device language, returned in standard format. ex: `en-US`, `es-US`.

#### `Localization.locales: Array<string>`

List of all the native languages provided by the user settings. These are returned in the order the user defines in their native settings.

#### `Localization.country: ?string`

Country code for your device.

#### `Localization.isoCurrencyCodes: ?Array<string>`

A list of all the supported ISO codes.

#### `Localization.timezone: string`

The current time zone in display format. ex: `America/Los_Angeles`

#### `Localization.isRTL: boolean`

This will return `true` if the current language is Right-to-Left.

### Methods

#### `Localization.getLocalizationAsync(): Promise<Localization>`

> Android only, on iOS changing the locale settings will cause all the apps to reset.

```js
type NativeEvent = {
  locale: string,
  locales: Array<string>,
  timezone: string,
  isoCurrencyCodes: ?Array<string>,
  country: ?string,
  isRTL: boolean,
};
```

**Example**

```js
// When the app returns from the background on Android...

const { locale } = await Localization.getLocalizationAsync();
```
