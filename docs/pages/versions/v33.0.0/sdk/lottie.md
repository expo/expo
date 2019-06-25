---
title: Lottie
---

Expo includes support for [Lottie](https://airbnb.design/lottie/), the animation library from AirBnB.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow the [lottie-react-native installation instructions](https://github.com/react-native-community/lottie-react-native).

## Usage

import SnackEmbed from '~/components/plugins/SnackEmbed';

<SnackEmbed snackId="@documentation/lottieexample" />

## Importing Lottie

The Lottie SDK currently lives under Expo's **DangerZone** namespace because it's implementation is still in Alpha. You can import it like this:

```javascript
import { DangerZone } from 'expo';
let { Lottie } = DangerZone;
```

## Using the Lottie API

We pull in the API from [lottie-react-native](https://github.com/airbnb/lottie-react-native#basic-usage), so the documentation there is the best resource to follow.
