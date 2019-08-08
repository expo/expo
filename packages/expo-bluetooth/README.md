# expo-bluetooth

## Introduction

Expo Bluetooth provides access to native Bluetooth Low-Energy features in React Native.

### What's not included

- Background scanning: Because of how strict Apple is about this permission, I've prioritized it very low.
- Restoration: React Native state mixed with the asynchronous nature of the native Bluetooth API makes this a very messy and unreliable feature.
- Mesh Networks: Basically completely unrelated to this library.
- Acting as a peripheral: This would make sense as a different library, something that extends `CBPeripheralManager` on iOS the same way we extend the `Central` here. You would also need an extra iOS permission: `NSBluetoothPeripheralUsageDescription`
- Encrypted requests: Feel free to [open a PR.](https://github.com/expo/expo/pull/new)
- Enable/Disable Bluetooth on iOS: Not possible.
- Beacons: This should be in a different library, perhaps building off of this one.

<!-- ## Methods -->

# Permissions

Internally this library is using `expo-permissions` to request the `LOCATION` permission on Android. iOS doesn't need any permission requested.

### `requestPermissionAsync`

### `getPermissionAsync`

## Discovering Devices

Before you can manipulate remote data you need to discover and connect to a bluetooth device.

### `isScanningAsync`

### `startScanningAsync`

This method will start scanning for remote devices. You can provide a lot of customization with the `options` prop. This method will return a promise that resolves into a `CancelScanningCallback` which you can invoke to stop the scan (instead of `stopScanningAsync()`).

```ts
const stopScanning = await Bluetooth.startScanningAsync(
  {
    // Filter out any peripheral that cannot be connected to (Android only)
    androidOnlyConnectable: true,
    androidMatchMode: AndroidMatchMode.Sticky,
  },
  // This method will be invoked everytime a peripheral has been discovered.
  async peripheral => {
    if (peripheral.name === 'cool-device') {
      stopScanning();
    }
  }
);
```

### `stopScanningAsync`

Stop scanning for peripherals. This will invalidate the method returned from `startScanningAsync`.

```ts
await Bluetooth.stopScanningAsync();
```

## Connecting

### `connectAsync`

Connect to a remote peripheral. Connecting enables you to read and write device data.
To cancel a pending connection, use the `disconnectAsync` method.

```ts
try {
  const connectedPeripheral = await Bluetooth.connectAsync(
    peripheral.id,
    {
      // After 5 seconds a timeout error will be thrown.
      timeout: 5000,
      onDisconnect: () => {
        // The peripheral was disconnected, either by `disconnectAsync` or a GATT error.
      },
    },
    {
      // Reconnect on Android
      shouldAutoConnect: true,
    }
  );
} catch (error) {
  console.log(error.message);
}
```

### `disconnectAsync`

Disconnect from a peripheral. On Android this will also close the GATT and refresh the device cache.
This method can also be used to cancel a pending connection.

```ts
await disconnectAsync(peripheral.id);
```

## Loading Data

### `loadPeripheralAsync`

A JS method that can connect and recursively load all of the data for a provided peripheral.

In BLE when you get an object the associated children objects will not be loaded unless you specifically request it.

```ts
const fullyLoadedPeripheral = await Bluetooth.loadPeripheralAsync(
  connectedPeripheral,
  true // Skip connecting...
);
```

### `discoverServicesForPeripheralAsync`

Load all of the services for a connected peripheral.

### `discoverIncludedServicesForServiceAsync`

Load all of the included services for a service.

### `discoverCharacteristicsForServiceAsync`

Load all of the characteristics for a service.

### `discoverDescriptorsForCharacteristicAsync`

Load all of the descriptors for a characteristic.

## Reading & Writing

### `readDescriptorAsync`

Read the `Base64` information from a descriptor.

### `writeDescriptorAsync`

Write data to a remote peripheral

### `setNotifyCharacteristicAsync`

### `readCharacteristicAsync`

Ensure the `CharacteristicProperty.Read` exists in the characteristic's `properties`.

### `writeCharacteristicAsync`

Ensure the `CharacteristicProperty.Write` exists in the characteristic's `properties`.

### `writeCharacteristicWithoutResponseAsync`

Writing data without a response can be up to 3x faster on Android devices. This method is not always available. Ensure the `CharacteristicProperty.WriteWithoutResponse` exists in the characteristic's `properties`.

## Getting Static Data

### `readRSSIAsync`

Given a connected peripheral, this method will return the RSSI value.
This can be used to roughly determine how far a device is from the central.

> RSSI: Received Signal Strength Indicator.

### `getPeripheralsAsync`

Returns a list of all the currently discovered peripherals.

### `getConnectedPeripheralsAsync`

Returns a list of all the currently connected peripherals. Because devices can disconnect sporadically you should update this before using it.

### `getCentralAsync`

Get a static immutable copy of the central manager.

### `getPeripheralAsync`

Get a static immutable copy of a peripheral.

### `getServiceAsync`

### `getCharacteristicAsync`

### `getDescriptorAsync`

Determine if the central is currently scanning or not.

## Syncing Data

You will probably want to sync realtime data changes with your React state. To do this, simply add an observer which will then update the local state.

### `observeUpdates`

The provided method is invoked with every peripheral data change.

### `observeCentralStateAsync`

Invoked whenever the central changes state. The provided callback will be invoked immedietly with the current central state.

# Android Only Methods

All android specific methods can be accessed throught the `Bluetooth.android.` obejct.

## Bonding Devices

Some devices will require extra authentication before they can be manipulated. In this case you will need to create a bond with the device.

If you attempt to read or write to one of these devices, you will get an `AndroidGATTError` with either: `GATTStatusCode.InsufficientAuthentication` or `GATTStatusCode.InsufficientAuthorization` as the error's `code` value.

### `bondAsync`

### `unbondAsync`

### `getBondedPeripheralsAsync`

## Enabling & Disabling Bluetooth

### `enableBluetoothAsync`

Toggle the system's Bluetooth services on or off. Requests cause the system to present a modal which the user can then decide to toggle with.

**Warning:** This method creates unpredictable behavior in the Android BLE API.

### `observeBluetoothEnabled`

Observe bluetooth state changes, either from `enableBluetoothAsync` or the user disabling Bluetooth from any other means. If Bluetooth is not enabled then most of the BLE methods will throw a related error.

### `requestMTUAsync`

Request a new MTU size for a connected device from the range **`0...512`**. The request return value has a very unpredictable timeout.

### `requestConnectionPriorityAsync`

Set a connected peripheral's `Priority`. There is no verifiable return value for determining a successful request, but a multitude of errors could occur.
