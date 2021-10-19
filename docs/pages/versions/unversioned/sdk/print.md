---
title: Print
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-print'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-print`** provides an API for iOS (AirPrint) and Android printing functionality.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-print" />

## API

```js
import * as Print from 'expo-print';
```

<APISection packageName="expo-print" apiName="Print" />

## Page margins

**On iOS** you can set the page margins using the `margins` option:

```js
const { uri } = await Print.printToFileAsync({
  html: 'This page is printed with margins',
  margins: {
    left: 20,
    top: 50,
    right: 20,
    bottom: 100
  }
});
```

**On Android**, if you're using `html` option in `printAsync` or `printToFileAsync`, the resulting print might contain page margins (it depends on the WebView engine).
They are set by `@page` style block and you can override them in your HTML code:

```html
<style>
  @page {
    margin: 20px;
  }
</style>
```

See [@page docs on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@page) for more details.
