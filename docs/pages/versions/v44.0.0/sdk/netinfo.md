---
title: NetInfo
sourceCodeUrl: 'https://github.com/react-native-community/react-native-netinfo'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`@react-native-community/netinfo`** allows you to get information about connection type and connection quality.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="@react-native-community/netinfo" href="https://github.com/react-native-community/react-native-netinfo#getting-started" />

## API

To import this library, use:

```js
import NetInfo from '@react-native-community/netinfo';
```

If you want to grab information about the network connection just once, you can use:

```js
NetInfo.fetch().then(state => {
  console.log('Connection type', state.type);
  console.log('Is connected?', state.isConnected);
});
```

Or, if you'd rather subscribe to updates about the network state (which then allows you to run code/perform actions anytime the network state changes) use:

```js
const unsubscribe = NetInfo.addEventListener(state => {
  console.log('Connection type', state.type);
  console.log('Is connected?', state.isConnected);
});

// To unsubscribe to these update, just use:
unsubscribe();
```

## Accessing the SSID

In order to access the `ssid` property (available under `state.details.ssid`), there are few additional configuration steps:

#### Android & iOS

- Request location permissions with [`Location.requestPermissionsAsync()`](location.md#locationrequestpermissionsasync)

#### iOS only

- Add the `com.apple.developer.networking.wifi-info` entitlement to your app.json file under `ios.entitlements`:

```json
  "ios": {
    "entitlements": {
      "com.apple.developer.networking.wifi-info": true
    }
  }
```

- Check the **Access Wi-Fi Information** box in your app's App Identifier, [which can be found here](https://developer.apple.com/account/resources/identifiers/list)

- Rebuild your app with `expo build:ios`

Read the [react-native-netinfo docs](https://github.com/react-native-community/react-native-netinfo#react-native-communitynetinfo) for more information on the API and usage.
