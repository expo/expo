---
title: SDK API Reference
---

The Expo SDK provides access to system functionality such as contacts, camera, and social login. It is provided by the npm package [expo](https://www.npmjs.com/package/expo). Install it by running `npm install --save expo` in the root directory of the project. Then you can import modules from it in your JavaScript code as follows:

```javascript
import { Contacts } from 'expo';
```

You can also import all Expo SDK modules:

```javascript
import Expo from 'expo';
```

This allows you to write [`Expo.Contacts.getContactsAsync()`](contacts.html#expocontactsgetcontactsasync "Expo.Contacts.getContactsAsync"), for example.

## SDK Version

Each month there is a new Expo SDK release that typically updates to the
latest version of React Native and includes a variety of bugfixes,
features and improvements to the Expo APIs. It's often useful to know
what version of React Native your Expo project is running on, so the
following table maps Expo SDK versions to their included React Native
version.

| Expo SDK Version | React Native Version |
| ---------------- |:--------------------:|
| 31.0.0           | 0.57.1               |
| 30.0.0           | 0.55.4               |
| 29.0.0           | 0.55.4               |
| 28.0.0           | 0.55.4               |
| 27.0.0           | 0.55.2               |
| 26.0.0           | 0.54.2               |
| 25.0.0           | 0.52.0               |
| 24.0.0           | 0.51.0               |
| 23.0.0           | 0.50.0               |
| 22.0.0           | 0.49.4               |
| 21.0.0           | 0.48.4               |
| 20.0.0           | 0.47.1               |
| 19.0.0           | 0.46.1               |
