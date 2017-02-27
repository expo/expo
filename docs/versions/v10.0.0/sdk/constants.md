---
title: Constants
old_permalink: /versions/v10.0.0/sdk/constants.html
previous___FILE: ./blur-view.md
next___FILE: ./contacts.md
---

System information that remains constant throughout the lifetime of your app.

-   `Exponent.Constants.appOwnership`
    Returns `exponent`, `standalone`, or `guest`. If `exponent`, the experience is running inside of the Expo client. If `standalone`, it is a [standalone app](../guides/building-standalone-apps.html#building-standalone-apps). If `guest`, it has been opened through a link from a standalone app.

-   `Exponent.Constants.exponentVersion`
    The version string of the Expo client currently running.

-   `Exponent.Constants.deviceId`
    An identifier that is unique to this particular device and installation of the Expo client.

-   `Exponent.Constants.deviceName`
    A human-readable name for the device type.

-   `Exponent.Constants.deviceYearClass`
    The [device year class](https://github.com/facebook/device-year-class) of this device.

-   `Exponent.Constants.isDevice`
    `true` if the app is running on a device, `false` if running in a simulator or emulator.

-   `Exponent.Constants.platform`

    -   `ios`

        -   `platform`
            The Apple internal model identifier for this device, e.g. `iPhone1,1`.

        -   `model`
            The human-readable model name of this device, e.g. `iPhone 7 Plus`.

-   `Exponent.Constants.sessionId`
    A string that is unique to the current session of your app. It is different across apps and across multiple launches of the same app.

-   `Exponent.Constants.statusBarHeight`
    The default status bar height for the device. Does not factor in changes when location tracking is in use or a phone call is active.

-   `Exponent.Constants.manifest`
    The [manifest](../guides/how-exponent-works.html#exponent-manifest) object for the app.

-   `Exponent.Constants.linkingUri`
    When an app is opened due to a deep link, the prefix of the URI without the deep link part. This value depends on `Exponent.Constants.appOwnership`: it may be different if your app is running standalone vs. in the Expo client.
