---
title: Cellular
---

Provides information about the user’s cellular service provider, such as its unique identifier, cellular connection type ,and whether it allows VoIP calls on its network.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-device).

## API

```js
import * as Cellular from 'expo-cellular';
```

### Constants

- [`Cellular.allowsVoip`](#) (iOS only)
- [`Cellular.carrier`](#) (iOS only)
- [`Cellular.isoCountryCode`](#) (iOS only)
- [`Cellular.mobileCountryCode`](#) (iOS only)
- [`Cellular.mobileNetworkCode`](#) (iOS only)


### Methods

- [`Cellular.getCellularGenerationAsync()`](#)


### Enum Types

- [`Cellular.CellularGeneration`](#)

### Errors

- [Error Codes](#error-codes)

## Constants

### `Cellular.allowsVoip`

The device brand. The consumer-visible brand of the product/hardware. On web, this value is `null`.

#### Examples

```js
Cellular.allowsVoip; // 
```

### `Cellular.carrier`

The actual device manufacturer of the product/hardware. On web, this value is `null`.

#### Examples

```js
Cellular.carrier; // 
```

### `Cellular.isoCountryCode`


#### Examples

```js
Cellular.isoCountryCode; // 
```

### `Cellular.mobileCountryCode`


#### Examples

```js
Cellular.mobileCountryCode; // 
```

### `Cellular.mobileNetworkCode`


#### Examples

```js
Cellular.mobileNetworkCode; // 
```



## Methods

### `Cellular.getCellularGenerationAsync()`


#### Returns

Returns a Promise that resolves to a `number` that represents the milliseconds since last reboot. Android devices does not count time spent in deep sleep. On web, this throws an `UnavailabilityError`.

**Examples**

```js
await Cellular.getCellularGenerationAsync();
// 
```


## Enums

### `Cellular.CellularGeneration`

Describes the current generation of the `cellular` connection. It is an enum with these possible values:

| Value     | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| `null`    | Either we are not currently connected to a cellular network or type could not be determined                       |
| `2g`      | Currently connected to a 2G cellular network. Includes CDMA, EDGE, GPRS, and IDEN type connections                |
| `3g`      | Currently connected to a 3G cellular network. Includes EHRPD, EVDO, HSPA, HSUPA, HSDPA, and UTMS type connections |
| `4g`      | Currently connected to a 4G cellular network. Includes HSPAP and LTE type connections                             |


## Error Codes

| Code                           | Description                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| ERR_CELLULAR | Error code thrown  |
