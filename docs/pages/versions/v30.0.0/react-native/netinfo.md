---
id: netinfo
title: NetInfo
---

NetInfo exposes info about online/offline status

```javascript
NetInfo.getConnectionInfo().then(connectionInfo => {
  console.log(
    'Initial, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType
  );
});
function handleFirstConnectivityChange(connectionInfo) {
  console.log(
    'First change, type: ' +
      connectionInfo.type +
      ', effectiveType: ' +
      connectionInfo.effectiveType
  );
  NetInfo.removeEventListener('connectionChange', handleFirstConnectivityChange);
}
NetInfo.addEventListener('connectionChange', handleFirstConnectivityChange);
```

### ConnectionType enum

`ConnectionType` describes the type of connection the device is using to communicate with the network.

Cross platform values for `ConnectionType`:

- `none` - device is offline
- `wifi` - device is online and connected via wifi, or is the iOS simulator
- `cellular` - device is connected via Edge, 3G, WiMax, or LTE
- `unknown` - error case and the network status is unknown

Android-only values for `ConnectionType`:

- `bluetooth` - device is connected via Bluetooth
- `ethernet` - device is connected via Ethernet
- `wimax` - device is connected via WiMAX

### EffectiveConnectionType enum

Cross platform values for `EffectiveConnectionType`:

- `2g`
- `3g`
- `4g`
- `unknown`

### Android

To request network info, you need to add the following line to your app's `AndroidManifest.xml`:

`<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`

### Methods

- [`addEventListener`](../netinfo/#addeventlistener)
- [`removeEventListener`](../netinfo/#removeeventlistener)
- [`getConnectionInfo`](../netinfo/#getconnectioninfo)
- [`isConnectionExpensive`](../netinfo/#isconnectionexpensive)

### Properties

- [`isConnected`](../netinfo/#isconnected)

---

# Reference

## Methods

### `addEventListener()`

```javascript
NetInfo.addEventListener(eventName, handler);
```

Adds an event handler.

**Parameters:**

| Name      | Type                           | Required | Description            |
| --------- | ------------------------------ | -------- | ---------------------- |
| eventName | enum(connectionChange, change) | Yes      | The change event name. |
| handler   | function                       | Yes      | Listener function.     |

Supported events:

- `connectionChange`: Fires when the network status changes. The argument to the event handler is an object with keys:
  - `type`: A `ConnectionType` (listed above)
  - `effectiveType`: An `EffectiveConnectionType` (listed above)
- `change`: This event is deprecated. Listen to `connectionChange` instead. Fires when the network status changes. The argument to the event handler is one of the deprecated connectivity types listed above.

---

### `removeEventListener()`

```javascript
NetInfo.removeEventListener(eventName, handler);
```

Removes the listener for network status changes.

**Parameters:**

| Name      | Type                           | Required | Description            |
| --------- | ------------------------------ | -------- | ---------------------- |
| eventName | enum(connectionChange, change) | Yes      | The change event name. |
| handler   | function                       | Yes      | Listener function.     |

---

### `getConnectionInfo()`

```javascript
NetInfo.getConnectionInfo();
```

Returns a promise that resolves to an object with `type` and `effectiveType` keys whose values are a [`ConnectionType`](../netinfo/#connectiontype-enum) and an [`EffectiveConnectionType`](../netinfo/#effectiveconnectiontype-enum)), respectively.

---

### `isConnectionExpensive()`

```javascript
NetInfo.isConnectionExpensive();
```

Available on Android. Detect if the current active connection is metered or not. A network is classified as metered when the user is sensitive to heavy data usage on that connection due to monetary costs, data limitations or battery/performance issues.

```javascript
NetInfo.isConnectionExpensive()
  .then(isConnectionExpensive => {
    console.log('Connection is ' + (isConnectionExpensive ? 'Expensive' : 'Not Expensive'));
  })
  .catch(error => {
    console.error(error);
  });
```

## Properties

### `isConnected`

Available on all platforms. Asynchronously fetch a boolean to determine internet connectivity.

```javascript
NetInfo.isConnected.fetch().then(isConnected => {
  console.log('First, is ' + (isConnected ? 'online' : 'offline'));
});
function handleFirstConnectivityChange(isConnected) {
  console.log('Then, is ' + (isConnected ? 'online' : 'offline'));
  NetInfo.isConnected.removeEventListener('connectionChange', handleFirstConnectivityChange);
}
NetInfo.isConnected.addEventListener('connectionChange', handleFirstConnectivityChange);
```
