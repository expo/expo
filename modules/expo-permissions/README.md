# expo-permissions

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXPermissions'`

and run `pod install`.

### iOS (no Cocoapods)

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `expo-permissions` and add `EXPermissions.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libEXPermissions.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`).

### Android

1. Append the following lines to `android/settings.gradle`:
   ```gradle
   include ':expo-permissions'
   project(':expo-permissions').projectDir = new File(rootProject.projectDir, '../node_modules/expo-permissions/android')
   ```
   and if not already included
   ```gradle
   include ':expo-permissions-interface'
   project(':expo-permissions-interface').projectDir = new File(rootProject.projectDir, '../node_modules/expo-permissions-interface/android')
   ```
2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
   ```gradle
   compile project(':expo-permissions')
   ```
   and if not already included
   ```gradle
   compile project(':expo-permissions-interface')
   ```

## Introduction

When it comes to adding functionality that can access potentially sensitive information on a user's device, such as their location, or possibly send them possibly unwanted push notifications, you will need to ask the user for their permission first. Unless you've already asked their permission, then no need. And so we have the `Permissions` module.

If you are deploying your app to the Apple iTunes Store, you should consider adding additional metadata to your app in order to customize the system permissions dialog and explain why your app requires permissions. See more info in the [App Store Deployment Guide](../guides/app-stores.html#system-permissions-dialogs-on-ios).

### `Permissions.getAsync(type)`

Determines whether your app has already been granted access to the provided permission type.

#### Arguments

-   **type (_string_)** -- The name of the permission.

#### Returns

Returns a `Promise` that is resolved with the information about the permission, including status, expiration and scope (if it applies to the permission type).

#### Example

```javascript
import { Permissions } from 'expo-permissions';

async function alertIfRemoteNotificationsDisabledAsync() {
  const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  if (status !== 'granted') {
    alert('Hey! You might want to enable notifications for my app, they are good.');
  }
}
```

### `Permissions.askAsync(type)`

Prompt the user for a permission. If they have already granted access, response will be success.

#### Arguments

-   **type (_string_)** -- The name of the permission.

#### Returns

Returns a `Promise` that is resolved with the information about the permission, including status, expiration and scope (if it applies to the permission type).

#### Example

```javascript
import { Location } from 'expo';
import { Permissions } from 'expo-permissions';

async function getLocationAsync() {
  const { status } = await Permissions.askAsync(Permissions.LOCATION);
  if (status === 'granted') {
    return Location.getCurrentPositionAsync({enableHighAccuracy: true});
  } else {
    throw new Error('Location permission not granted');
  }
}
```

### `Permissions.NOTIFICATIONS`

The permission type for user-facing notifications **and** remote push notifications.

> **Note:** On iOS, asking for this permission asks the user not only for permission to register for push/remote notifications, but also for showing notifications as such. At the moment remote notifications will only be received when notifications are permitted to play a sound, change the app badge or be displayed as an alert. As iOS is more detailed when it comes to notifications permissions, this permission status will contain not only `status` and `expires`, but also Boolean values for `allowsSound`, `allowsAlert` and `allowsBadge`.

> **Note:** On iOS, this does not disambiguate `undetermined` from `denied` and so will only ever return `granted` or `undetermined`. This is due to the way the underlying native API is implemented.

> **Note:** Android does not differentiate between permissions for local and remote notifications, so status of permission for `NOTIFICATIONS` should always be the same as the status for `USER_FACING_NOTIFICATIONS`.

### `Permissions.USER_FACING_NOTIFICATIONS`

The permission type for user-facing notifications. This does **not** register your app to receive remote push notifications; see the `NOTIFICATIONS` permission.

> **Note:** iOS provides more detailed permissions, so the permission status will contain not only `status` and `expires`, but also Boolean values for `allowsSound`, `allowsAlert` and `allowsBadge`.

> **Note:** Android does not differentiate between permissions for local and remote notifications, so status of permission for `USER_FACING_NOTIFICATIONS` should always be the same as the status for `NOTIFICATIONS`.

### `Permissions.LOCATION`

The permission type for location access.

### `Permissions.CAMERA`

The permission type for photo and video taking.

### `Permissions.AUDIO_RECORDING`

The permission type for audio recording.

### `Permissions.CONTACTS`

The permission type for reading contacts.

### `Permissions.CAMERA_ROLL`

The permission type for reading or writing to the camera roll.

### `Permissions.CALENDAR`

The permission type for reading or writing to the calendar.

### `Permissions.REMINDERS`

The permission type for reading or writing reminders (iOS only).
