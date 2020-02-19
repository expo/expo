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

Read the [react-native-netinfo docs](https://github.com/react-native-community/react-native-netinfo#react-native-communitynetinfo) for more information on the API and usage.
