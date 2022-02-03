---
title: Localization
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-41/packages/expo-localization'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-localization`** allows you to Localize your app, customizing the experience for specific regions, languages, or cultures. It also provides access to the locale data on the native device.
Using the popular library [`i18n-js`](https://github.com/fnando/i18n-js) with `expo-localization` will enable you to create a very accessible experience for users.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-localization" />

## Usage

Let's make our app support English and Japanese.

- Install the i18n package `i18n-js`

  ```sh
  yarn add i18n-js
  ```

- Configure the languages for your app.

  ```tsx
  import * as Localization from 'expo-localization';
  import i18n from 'i18n-js';
  // Set the key-value pairs for the different languages you want to support.
  i18n.translations = {
    en: { welcome: 'Hello' },
    ja: { welcome: 'こんにちは' },
  };
  // Set the locale once at the beginning of your app.
  i18n.locale = Localization.locale;
  ```

### API Design Tips

- You may want to refrain from localizing text for certain things, like names. In this case you can define them _once_ in your default language and reuse them with `i18n.fallbacks = true;`.
- When a user changes the device's language, your app will reset. This means you can set the language once, and don't need to update any of your React components to account for the language changes.
- On iOS, you can add `"CFBundleAllowMixedLocalizations": true` to your `ios.infoPlist` property [in your app.json](/workflow/configuration/#ios) so that your app supports the retrieval of localized strings from frameworks.
  - This will allow you to translate app metadata, including the homescreen display name! Read [here](/distribution/app-stores#localizing-your-ios-app) for details.

### Full Demo

<SnackInline label="Localization" dependencies={['expo-localization', 'i18n-js']}>

```tsx
import * as React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';

// Set the key-value pairs for the different languages you want to support.
i18n.translations = {
  en: { welcome: 'Hello', name: 'Charlie' },
  ja: { welcome: 'こんにちは' },
};
// Set the locale once at the beginning of your app.
i18n.locale = Localization.locale;
// When a value is missing from a language it'll fallback to another language with the key present.
i18n.fallbacks = true;

export default App => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {i18n.t('welcome')} {i18n.t('name')}
      </Text>
    </View>
  );
};

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  text: {
    fontSize: 20,
  },
});
/* @end */
```

</SnackInline>

## API

```ts
import * as Localization from 'expo-localization';
```

### Behavior

This API is mostly synchronous and driven by constants. On iOS the constants will always be correct, on Android you should check if the locale has updated using `AppState` and `Localization.getLocalizationAsync()`. Initially the constants will be correct on both platforms, but on Android a user can change the language and return, more on this later.

## Constants

### `Localization.locale`

An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag), consisting of a two-character language code and optional script, region and variant codes. Ex: `en`, `en-US`, `zh-Hans`, `zh-Hans-CN`, `en-emodeng`.

### `Localization.locales`

List of all the native languages provided by the user settings. These are returned in the order the user defines in their native settings.

### `Localization.region`

The region code for your device that comes from the Region setting under Language & Region on iOS. This value is always available on iOS, but might return `null` on Android or web. Ex: `US`, `NZ`, `null`.

### `Localization.isoCurrencyCodes`

A list of all the supported language ISO codes.

### `Localization.timezone`

The current timezone in display format. Ex: `America/Los_Angeles`.

On Web `timezone` is calculated with `Intl.DateTimeFormat().resolvedOptions().timeZone`. For a better estimation you could use the `moment-timezone` package but it will add significant bloat to your website's bundle size.

### `Localization.isRTL`

Returns if the system's language is written from Right-to-Left. This can be used to build features like [bidirectional icons](https://material.io/design/usability/bidirectionality.html).

### `Localization.isMetric`

Boolean value that indicates whether the system uses the metric system. On Android and web, this is inferred from the current region.

### `Localization.currency`

Three-character ISO 4217 currency code. Not available on web. Ex: `USD`, `EUR`, `CNY`, `null`.

### `Localization.decimalSeparator`

Decimal separator used for formatting numbers. Ex: `,`, `.`.

### `Localization.digitGroupingSeparator`

Grouping separator used when formatting numbers larger than 1000. Ex: `.`, ` `, `,`.

## Methods

### `Localization.getLocalizationAsync()`

> Android only, on iOS changing the locale settings will cause all the apps to reset.

```js
type NativeEvent = {
  currency?: string;
  decimalSeparator: string;
  digitGroupingSeparator: string;
  isoCurrencyCodes: ?Array<string>,
  isMetric: boolean;
  isRTL: boolean,
  locale: string,
  locales: Array<string>,
  timezone: string,
  region: ?string,
};
```

**Example**

```js
// When the app returns from the background on Android...

const { locale } = await Localization.getLocalizationAsync();
```
