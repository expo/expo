---
title: Lottie
---

Expo includes support for [Lottie](https://airbnb.design/lottie/), the animation library from AirBnB.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install lottie-react-native`. In bare apps, also follow the [lottie-react-native linking and configuration instructions](https://github.com/react-native-community/lottie-react-native).

## Usage

import SnackEmbed from '~/components/plugins/SnackEmbed';

<SnackEmbed snackId="@documentation/lottie-example" />

## Importing Lottie

The Lottie SDK currently lives under Expo's **DangerZone** namespace because it's implementation is still in Alpha. You can import it like this:

```javascript
import LottieView from "lottie-react-native";
```

## Using the Lottie API

We pull in the API from [lottie-react-native](https://github.com/airbnb/lottie-react-native#basic-usage), so the documentation there is the best resource to follow.
