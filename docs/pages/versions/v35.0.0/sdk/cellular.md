---
title: Cellular
---

Provides information about the user’s cellular service provider, such as its unique identifier, cellular connection type, and whether it allows VoIP calls on its network.

Note: On the iOS simulator, cellular network information cannot be retrieved. 

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-cellular`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-cellular).

## API

```js
import * as Cellular from 'expo-cellular';
```

### Constants

- [`Cellular.allowsVoip`](#cellularallowsvoip)
- [`Cellular.carrier`](#cellularcarrier)
- [`Cellular.isoCountryCode`](#cellularisocountrycode)
- [`Cellular.mobileCountryCode`](#cellularmobilecountrycode)
- [`Cellular.mobileNetworkCode`](#cellularmobilenetworkcode)

### Methods

- [`Cellular.getCellularGenerationAsync()`](#cellulargetcellulargenerationasync)

### Enum Types

- [`Cellular.CellularGeneration`](#cellularcellulargeneration)

### Errors

- [Error Codes](#error-codes)

## Constants

### `Cellular.allowsVoip`

Indicates if the carrier allows making VoIP calls on its network. On Android, this checks whether the system supports SIP-based VoIP API. See [here](https://developer.android.com/reference/android/net/sip/SipManager.html#isVoipSupported(android.content.Context)) to view more information. 

On iOS, if you configure a device for a carrier and then remove the SIM card, this property retains the `boolean` value indicating the carrier’s policy regarding VoIP. If you then install a new SIM card, its VoIP policy `boolean` replaces the previous value of this property.

On web, this returns `null`.

#### Examples

```js
Cellular.allowsVoip; // true or false
```

### `Cellular.carrier`

The name of the user’s home cellular service provider. If the device has dual SIM cards, only the carrier for the currently active SIM card will be returned. On Android, this value is only available when the SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this returns `null`. 

On iOS, if you configure a device for a carrier and then remove the SIM card, this property retains the name of the carrier. If you then install a new SIM card, its carrier name replaces the previous value of this property. The value for this property is `null` if the user never configured a carrier for the device.

On web, this returns `null`.

#### Examples

```js
Cellular.carrier; // "T-Mobile" or "Verizon"
```

### `Cellular.isoCountryCode`

The ISO country code for the user’s cellular service provider. On iOS, the value is `null` if any of the following apply:

* The device is in airplane mode.
* There is no SIM card in the device.
* The device is outside of cellular service range.

On web, this returns `null`.

#### Examples

```js
Cellular.isoCountryCode; // "us" or "au"
```

### `Cellular.mobileCountryCode`

The mobile country code (MCC) for the user’s current registered cellular service provider. On Android, this value is only available when SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this returns `null`. On iOS, the value may be `null` on hardware prior to iPhone 4S when in airplane mode.
Furthermore, the value for this property is `null` if any of the following apply:
* There is no SIM card in the device.
* The device is outside of cellular service range.

On web, this returns `null`.

#### Examples

```js
Cellular.mobileCountryCode; // "310"
```

### `Cellular.mobileNetworkCode`

The mobile network code (MNC) for the user’s cellular service provider. On Android, this value is only available when the SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this returns `null`. On iOS, the value may be `null` on hardware prior to iPhone 4S when in airplane mode.
Furthermore, the value of this property is `null` if any of the following apply:
* There is no SIM card in the device.
* The device is outside of cellular service range.

On web, this returns `null`.

#### Examples

```js
Cellular.mobileNetworkCode; // "260"
```

## Methods

### `Cellular.getCellularGenerationAsync()`

#### Returns

Returns a promise that resolves to a [`Cellular.CellularGeneration`](#cellularcellulargeneration) enum value that represents the current cellular-generation type.

On web, this method uses [`navigator.connection.effectiveType`](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType) to detect the effective type of the connection using a combination of recently observed round-trip time and downlink values. See [`here`](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) to view browser compatibility.

**Examples**

```js
await Cellular.getCellularGenerationAsync();
// CellularGeneration.CELLULAR_4G
```

## Enums

### `Cellular.CellularGeneration`

Describes the current generation of the cellular connection. It is an enum with these possible values:

| Value         | Description                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `UNKNOWN`     | Either we are not currently connected to a cellular network or type could not be determined.                       |
| `CELLULAR_2G` | Currently connected to a 2G cellular network. Includes CDMA, EDGE, GPRS, and IDEN type connections.                |
| `CELLULAR_3G` | Currently connected to a 3G cellular network. Includes EHRPD, EVDO, HSPA, HSUPA, HSDPA, and UTMS type connections. |
| `CELLULAR_4G` | Currently connected to a 4G cellular network. Includes HSPAP and LTE type connections.                             |

## Error Codes

| Code                                         | Description                                                          |
| -------------------------------------------- | -------------------------------------------------------------------- |
| ERR_CELLULAR_GENERATION_UNKNOWN_NETWORK_TYPE | Unable to access network type or not connected to a cellular network |
