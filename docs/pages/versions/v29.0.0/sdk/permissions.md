---
title: Permissions
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

When it comes to adding functionality that can access potentially sensitive information on a user's device, such as their location, or possibly send them possibly unwanted push notifications, you will need to ask the user for their permission first. Unless you've already asked their permission, then no need. And so we have the `Permissions` module.

If you are deploying your app to the Apple iTunes Store, you should consider adding additional metadata to your app in order to customize the system permissions dialog and explain why your app requires permissions. See more info in the [App Store Deployment Guide](../../distribution/app-stores/#system-permissions-dialogs-on-ios).

## Manually testing permissions

Often you want to be able to test what happens when you reject a permission to ensure that it has the desired behavior. An operating-system level restriction on both iOS and Android prohibits an app from asking for the same permission more than once (you can imagine how this could be annoying for the user to be repeatedly prompted for permissions). So in order to test different flows involving permissions, you may need to uninstall and reinstall the Expo app. In the simulator this is as easy as deleting the app and expo-cli will automatically install it again next time you launch the project from it.

### `Expo.Permissions.getAsync(type)`

Determines whether your app has already been granted access to the provided permission type.

#### Arguments

-   **type : `string`** -- The name of the permission.

#### Returns

Returns a `Promise` that is resolved with the information about the permission, including status, expiration and scope (if it applies to the permission type).

#### Example

```javascript
async function alertIfRemoteNotificationsDisabledAsync() {
  const { Permissions } = Expo;
  const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  if (status !== 'granted') {
    alert('Hey! You might want to enable notifications for my app, they are good.');
  }
}
```

### `Expo.Permissions.askAsync(type)`

Prompt the user for a permission. If they have already granted access, response will be success.

#### Arguments

-   **type : `string`** -- The name of the permission.

#### Returns

Returns a `Promise` that is resolved with the information about the permission, including status, expiration and scope (if it applies to the permission type).

#### Example

```javascript
async function getLocationAsync() {
  const { Location, Permissions } = Expo;
  const { status } = await Permissions.askAsync(Permissions.LOCATION);
  if (status === 'granted') {
    return Location.getCurrentPositionAsync({enableHighAccuracy: true});
  } else {
    throw new Error('Location permission not granted');
  }
}
```

### `Expo.Permissions.NOTIFICATIONS`

The permission type for user-facing notifications **and** remote push notifications.

> **Note:** On iOS, asking for this permission asks the user not only for permission to register for push/remote notifications, but also for showing notifications as such. At the moment remote notifications will only be received when notifications are permitted to play a sound, change the app badge or be displayed as an alert. As iOS is more detailed when it comes to notifications permissions, this permission status will contain not only `status` and `expires`, but also Boolean values for `allowsSound`, `allowsAlert` and `allowsBadge`.

> **Note:** On iOS, this does not disambiguate `undetermined` from `denied` and so will only ever return `granted` or `undetermined`. This is due to the way the underlying native API is implemented.

> **Note:** Android does not differentiate between permissions for local and remote notifications, so status of permission for `NOTIFICATIONS` should always be the same as the status for `USER_FACING_NOTIFICATIONS`.

### `Expo.Permissions.USER_FACING_NOTIFICATIONS`

The permission type for user-facing notifications. This does **not** register your app to receive remote push notifications; see the `NOTIFICATIONS` permission.

> **Note:** iOS provides more detailed permissions, so the permission status will contain not only `status` and `expires`, but also Boolean values for `allowsSound`, `allowsAlert` and `allowsBadge`.

> **Note:** Android does not differentiate between permissions for local and remote notifications, so status of permission for `USER_FACING_NOTIFICATIONS` should always be the same as the status for `NOTIFICATIONS`.

### `Expo.Permissions.LOCATION`

The permission type for location access.

### `Expo.Permissions.CAMERA`

The permission type for photo and video taking.

### `Expo.Permissions.AUDIO_RECORDING`

The permission type for audio recording.

### `Expo.Permissions.CONTACTS`

The permission type for reading contacts.

### `Expo.Permissions.CAMERA_ROLL`

The permission type for reading or writing to the camera roll.

### `Expo.Permissions.CALENDAR`

The permission type for reading or writing to the calendar.

### `Expo.Permissions.REMINDERS`

The permission type for reading or writing reminders (iOS only).

### `Expo.Permissions.SMS`
SDK API
The permission for accesing SMS storage.

### Permissions equivalents inside `app.json`

If you specified `android.permissions` inside your `app.json` ([read more about configuration](../../workflow/configuration/#android))  you have to use values corresponding to their `Expo.Permissions` equivalents.

| Expo            | Android                                       |
| --------------- | --------------------------------------------- |
| LOCATION        | ACCESS\_COARSE\_LOCATION, ACCESS\_FINE_LOCATION  |
| CAMERA          | CAMERA                                        |
| AUDIO_RECORDING | RECORD_AUDIO                                  |
| CONTACTS        | READ_CONTACTS                                 |
| CAMERA_ROLL     | READ\_EXTERNAL\_STORAGE, WRITE\_EXTERNAL\_STORAGE |
| CALENDAR        | READ\_CALENDAR, WRITE\_CALENDAR                 |
