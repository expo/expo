---
title: Lottie
sourceCodeUrl: 'https://github.com/react-native-community/lottie-react-native'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

Expo includes support for [Lottie](https://airbnb.design/lottie/), the animation library from AirBnB.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="lottie-react-native" href="https://github.com/react-native-community/lottie-react-native" />

## Usage

import SnackEmbed from '~/components/plugins/SnackEmbed';

<SnackEmbed snackId="@documentation/lottie-example" />

## Importing Lottie

 You can import it like this:

```javascript
import LottieView from 'lottie-react-native';
```

## Known Issues

> The Lottie SDK is currently considered to be under Expo's "DangerZone" because it's implementation is still in Alpha.
- Importing Lottie 3 files causes the previewer to crash without a visible error, because Expo relies on `lottie-react-native` v2.

## Using the Lottie API

We pull in the API from [lottie-react-native](https://github.com/airbnb/lottie-react-native#basic-usage), so the documentation there is the best resource to follow.
