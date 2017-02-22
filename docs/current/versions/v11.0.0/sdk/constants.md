---
title: Constants
old_permalink: /versions/v11.0.0/sdk/constants.html
previous___FILE: ./blur-view.md
next___FILE: ./contacts.md
---

System information that remains constant throughout the lifetime of your app.

- `Exponent.Constants.appOwnership`

  Returns `exponent`, `standalone`, or `guest`. If `exponent`, the experience is running inside of the Exponent client. If `standalone`, it is a [standalone app](/versions/v11.0.0/guides/building-standalone-apps#building-standalone-apps). If `guest`, it has been opened through a link from a standalone app.

- `Exponent.Constants.exponentVersion`

  The version string of the Exponent client currently running.

- `Exponent.Constants.deviceId`

  An identifier that is unique to this particular device and installation of the Exponent client.

- `Exponent.Constants.deviceName`

  A human-readable name for the device type.

- `Exponent.Constants.deviceYearClass`

  The [device year class](https://github.com/facebook/device-year-class) of this device.

- `Exponent.Constants.isDevice`

  `true` if the app is running on a device, `false` if running in a simulator or emulator.

- `Exponent.Constants.platform`

  - `ios`
    - `platform`

      The Apple internal model identifier for this device, e.g. `iPhone1,1`.

    - `model`

      The human-readable model name of this device, e.g. `iPhone 7 Plus`.

    - `userInterfaceIdiom`

      The user interface idiom of this device, i.e. whether the app is running on an iPhone or an iPad. Current supported values are ``handset`` and ``tablet``. Apple TV and CarPlay will show up as ``unsupported``.

- `Exponent.Constants.sessionId`

  A string that is unique to the current session of your app. It is different across apps and across multiple launches of the same app.

- `Exponent.Constants.statusBarHeight`

  The default status bar height for the device. Does not factor in changes when location tracking is in use or a phone call is active.

- `Exponent.Constants.systemFonts`

  A list of the system font names available on the current device.

- `Exponent.Constants.manifest`

  The [manifest](/versions/v11.0.0/guides/how-exponent-works#exponent-manifest) object for the app.

- `Exponent.Constants.linkingUri`

  When an app is opened due to a deep link, the prefix of the URI without the deep link part. This value depends on `Exponent.Constants.appOwnership`: it may be different if your app is running standalone vs. in the Exponent client.
