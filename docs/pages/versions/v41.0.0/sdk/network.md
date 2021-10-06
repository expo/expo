---
title: Network
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-41/packages/expo-network'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-network`** provides useful information about the device's network such as its IP address, MAC address, and airplane mode status.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-network" />

## Configuration

On Android, this module requires permissions to access the network and Wi-Fi state. The permissions `ACCESS_NETWORK_STATE` and `ACCESS_WIFI_STATE` are added automatically.

## API

```js
import * as Network from 'expo-network';
```

## Methods

### `Network.getNetworkStateAsync()`

Gets the device's current network connection state.

On web, [`navigator.connection.type`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/connection) is not available on browsers. So if there is an active network connection, the field `type` returns `NetworkStateType.UNKNOWN`. Otherwise, it returns `NetworkStateType.NONE`.

#### Returns

A `Promise` that resolves to an object with the following fields:

- **type (_NetworkStateType_)** -- a [`NetworkStateType`](#networknetworkstatetype) enum value that represents the current network connection type.

- **isConnected (_boolean_)** -- if there is an active network connection. Note that this does not mean that internet is reachable. This field is `false` if the `type` is either `Network.NetworkStateType.NONE` or `Network.NetworkStateType.UNKNOWN`, `true` otherwise.

- **isInternetReachable (_boolean_)** -- if the internet is reachable with the currently active network connection. On Android, this depends on `NetInfo.isConnected()` (API level < 29) or `ConnectivityManager.getActiveNetwork()` (API level >= 29). On iOS, this value will always be the same as `isConnected`.

**Examples**

```js
await Network.getNetworkStateAsync();
// {
//   type: NetworkStateType.CELLULAR,
//   isConnected: true,
//   isInternetReachable: true,
// }
```

### `Network.getIpAddressAsync()`

Gets the device's current IPv4 address. Returns `0.0.0.0` if the IP address could not be retrieved.

On web, this method uses the third-party [`ipify service`](https://www.ipify.org/) to get the public IP address of the current device.

#### Returns

A `Promise` that resolves to a `string` of the current IP address of the device's main network interface. Can only be IPv4 address.

**Examples**

```js
await Network.getIpAddressAsync();
// "92.168.32.44"
```

### `Network.getMacAddressAsync(interfaceName?)`

> **This method is deprecated and will be removed in a future SDK version.**

Gets the specified network interface's MAC address.

Beginning with iOS 7 and Android 11, non-system applications can no longer access the device's MAC address. In SDK 41 and above, this method will always resolve to a predefined value that isn't useful.

If you need to identify the device, use the `getIosIdForVendorAsync()` method / `androidId` property of the `expo-application` unimodule instead.

#### Arguments (Android Only)

- **interfaceName (_string | null_)** -- A string representing interface name (`eth0`, `wlan0`) or `null` (default), meaning the method should fetch the MAC address of the first available interface.

#### Returns

A `Promise` that resolves to the value `"02:00:00:00:00:00"`.

### `Network.isAirplaneModeEnabledAsync()`

**Android only.** Tells if the device is in airplane mode.

#### Returns

Returns a `Promise` that resolves to the `boolean` value for whether the device is in airplane mode or not.

**Examples**

```js
await Network.isAirplaneModeEnabledAsync();
// false
```

## Enums

### `Network.NetworkStateType`

An enum of the different types of devices supported by Expo, with these values:

- **`NONE`** -- no active network connection detected.
- **`UNKNOWN`** -- the connection type could not be determined.
- **`CELLULAR`** -- active network connection over mobile data or [`DUN-specific`](https://developer.android.com/reference/android/net/ConnectivityManager#TYPE_MOBILE_DUN) mobile connection when setting an upstream connection for tethering.
- **`WIFI`** -- active network connection over Wifi.
- **`BLUETOOTH`** -- active network connection over Bluetooth.
- **`ETHERNET`** -- active network connection over Ethernet.
- **`WIMAX`** -- active network connection over Wimax.
- **`VPN`** -- active network connection over VPN.
- **`OTHER`** -- active network connection over other network connection types.

## Error Codes

| Code                                    | Description                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ERR_NETWORK_IP_ADDRESS                  | On Android, there may be an unknown Wifi host when trying to access `WifiManager` in `getIpAddressAsync`. On iOS, no network interfaces could be retrieved.                                |
| ERR_NETWORK_UNDEFINED_INTERFACE         | An undefined `interfaceName` was passed as an argument in `getMacAddressAsync`.                                                                                                            |
| ERR_NETWORK_SOCKET_EXCEPTION            | An error was encountered in creating or accessing the socket in `getMacAddressAsync`.                                                                                                      |
| ERR_NETWORK_INVALID_PERMISSION_INTERNET | There are invalid permissions for [`android.permission.ACCESS_WIFI_STATE`](https://developer.android.com/reference/android/Manifest.permission#ACCESS_WIFI_STATE) in `getMacAddressAsync`. |
| ERR_NETWORK_NO_ACCESS_NETWORKINFO       | Unable to access network information                                                                                                                                                       |
