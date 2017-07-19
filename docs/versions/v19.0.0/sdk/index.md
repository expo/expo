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
| 17.0.0           | 0.44.0               |
| 16.0.0           | 0.43.1               |
| 15.0.0           | 0.42.0               |
| 14.0.0           | 0.41.0               |
| 13.0.0           | 0.40.0               |
| 12.0.0           | 0.37.0               |
| 11.0.0           | 0.37.0               |
| 10.0.0           | 0.33.0               |
