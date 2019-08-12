---
title: NetInfo
---

This API allows you to get information about connection type and connection quality.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install @react-native-community/netinfo`. In bare apps, make sure you also follow the [react-native-netinfo linking and configuration instructions](https://github.com/react-native-community/react-native-netinfo#getting-started).

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
