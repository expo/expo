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

The Lottie SDK currently lives under Expo's **DangerZone** namespace because it's implementation is still in Alpha. You can import it like this:

```javascript
import LottieView from 'lottie-react-native';
```

## Using the Lottie API

We pull in the API from [lottie-react-native](https://github.com/airbnb/lottie-react-native#basic-usage), so the documentation there is the best resource to follow.
