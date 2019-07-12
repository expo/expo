The Expo SDK provides universal access to device and system functionality such as **contacts**, **camera**, and Geolocation. It is provided by the npm package [expo](https://www.npmjs.com/package/expo), this is installed by default in every managed Expo project. You can import modules from it in your JavaScript code as follows:

```javascript
import { Contacts } from 'expo';
```

You can also import all Expo SDK modules:

```javascript
import * as Expo from 'expo';
```

This allows you to write [`Expo.Contacts.getContactsAsync()`](../sdk/contacts/#getcontactsasync), for example.

## SDK Version

Each month there is a new Expo SDK release that typically updates to the
latest version of React Native and includes a variety of bugfixes,
features and improvements to the Expo APIs. It's often useful to know
what version of React Native your Expo project is running on, so the
following table maps Expo SDK versions to their included React Native
version.

| Expo SDK Version | React Native Version |
| ---------------- | :------------------: |
| 32.0.0           |        0.57.1        |
| 31.0.0           |        0.57.1        |
| 30.0.0           |        0.55.4        |
| 29.0.0           |        0.55.4        |
| 28.0.0           |        0.55.4        |
| 27.0.0           |        0.55.2        |
| 26.0.0           |        0.54.2        |
| 25.0.0           |        0.52.0        |
| 24.0.0           |        0.51.0        |
| 23.0.0           |        0.50.0        |
| 22.0.0           |        0.49.4        |
| 21.0.0           |        0.48.4        |
| 20.0.0           |        0.47.1        |
| 19.0.0           |        0.46.1        |
