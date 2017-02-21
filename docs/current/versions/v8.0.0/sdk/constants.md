---
title: Constants
old_permalink: /versions/v8.0.0/sdk/constants.html
previous___FILE: ./blur-view.md
next___FILE: ./contacts.md
---

System information that remains constant throughout the lifetime of your app.

### `Exponent.Constants.exponentVersion`

The version string of the Exponent client currently running.

### `Exponent.Constants.deviceId`

An identifier that is unique to this particular device and installation of the Exponent client.

### `Exponent.Constants.deviceName`

A human-readable name for the device type.

### `Exponent.Constants.deviceYearClass`

The [device year class](https://github.com/facebook/device-year-class) of this device.

### `Exponent.Constants.sessionId`

A string that is unique to the current session of your app. It is different across apps and across multiple launches of the same app.

### `Exponent.Constants.manifest`

The [manifest](/versions/latest/guides/how-exponent-works#exponent-manifest) object for the app.

### `Exponent.Constants.linkingUri`

When an app is opened due to a deep link, the prefix of the URI without the deep link part.
