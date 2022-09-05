---
title: Localization
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-localization'
packageName: 'expo-localization'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';
import { Terminal } from '~/ui/components/Snippet';

**`expo-localization`** allows you to Localize your app, customizing the experience for specific regions, languages, or cultures. It also provides access to the locale data on the native device.
Using the popular library [`i18n-js`](https://github.com/fnando/i18n-js) with `expo-localization` will enable you to create a very accessible experience for users.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Usage

Let's make our app support English and Japanese. To achive this install the i18n package `i18n-js`:

<Terminal cmd={['$ npx expo install i18n-js']} />

Then, configure the languages for your app.

```tsx
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Set the key-value pairs for the different languages you want to support.
const i18n = new I18n({
  en: { welcome: 'Hello' },
  ja: { welcome: 'こんにちは' },
});

// Set the locale once at the beginning of your app.
i18n.locale = Localization.locale;
```

### API Design Tips

- You may want to refrain from localizing text for certain things, like names. In this case you can define them _once_ in your default language and reuse them with `i18n.enableFallback = true;`.
- When a user changes the device's language, your app will reset. This means you can set the language once, and don't need to update any of your React components to account for the language changes.
- On iOS, you can add `"CFBundleAllowMixedLocalizations": true` to your `ios.infoPlist` property [in your app.json](/workflow/configuration/#ios) so that your app supports the retrieval of localized strings from frameworks.
  - This will allow you to translate app metadata, including the homescreen display name! Read [here](/distribution/app-stores#localizing-your-ios-app) for details.

### Full Demo

<SnackInline label="Localization" dependencies={['expo-localization', 'i18n-js']}>

```tsx
import { View, StyleSheet, Text } from 'react-native';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Set the key-value pairs for the different languages you want to support.
const translations = {
  en: { welcome: 'Hello', name: 'Charlie' },
  ja: { welcome: 'こんにちは' },
};
const i18n = new I18n(translations);

// Set the locale once at the beginning of your app.
i18n.locale = Localization.locale;

// When a value is missing from a language it'll fallback to another language with the key present.
i18n.enableFallback = true;
// To see the fallback mechanism uncomment line below to force app to use Japanese language.
// i18n.locale = 'ja';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {i18n.t('welcome')} {i18n.t('name')}
      </Text>
      <Text>Current locale: {i18n.locale}</Text>
      <Text>Device locale: {Localization.locale}</Text>
    </View>
  );
}

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
    marginBottom: 16,
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

<APISection packageName="expo-localization" apiName="Localization" />
