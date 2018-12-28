---
title: Lottie
---

Expo includes support for [Lottie](https://airbnb.design/lottie/), the animation library from AirBnB.

${<SnackEmbed snackId="Byu2WM2af" />}


## Importing Lottie

The Lottie SDK currently lives under Expo's **DangerZone** namespace because it's implementation is still in Alpha. You can import it like this:

```javascript
import { DangerZone } from 'expo';
let { Lottie } = DangerZone;
```

## Using the Lottie API

We pull in the API from [lottie-react-native](https://github.com/airbnb/lottie-react-native#basic-usage), so the documentation there is the best resource to follow.
