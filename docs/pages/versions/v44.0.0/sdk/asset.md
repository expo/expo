---
title: Asset
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-asset'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-asset`** provides an interface to Expo's asset system. An asset is any file that lives alongside the source code of your app that the app needs at runtime. Examples include images, fonts, and sounds. Expo's asset system integrates with React Native's, so that you can refer to files with `require('path/to/file')`. This is how you refer to static image files in React Native for use in an `Image` component, for example. Check out React Native's [documentation on static image resources](https://reactnative.dev/docs/images#static-image-resources) for more information. This method of referring to static image resources works out of the box with Expo.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-asset" />

## API

```js
import { Asset } from 'expo-asset';
```

<APISection packageName="expo-asset" apiName="Asset" />
