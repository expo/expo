---
title: Permissions
---

When it comes to adding functionality that can access potentially sensitive information on a user's device, such as their location, or possibly send them possibly unwanted push notifications, you will need to ask the user for their permission first. Unless you've already asked their permission, then no need. And so we have the `Permissions` module.

If you are deploying your app to the Apple iTunes Store, you must add additional metadata to your app in order to customize the system permissions dialog, and more importantly, explain why your app requires permissions. **Without this explanation, your app may be rejected from the App Store.** See more info in the [App Store Deployment Guide](../../distribution/app-stores/#system-permissions-dialogs-on-ios).

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-permissions`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-permissions).

## Usage

### Manually testing permissions

Often you want to be able to test what happens when you reject a permission to ensure that it has the desired behavior. An operating-system level restriction on both iOS and Android prohibits an app from asking for the same permission more than once (you can imagine how this could be annoying for the user to be repeatedly prompted for permissions). So in order to test different flows involving permissions, you may need to uninstall and reinstall the Expo app. In the simulator this is as easy as deleting the app and expo-cli will automatically install it again next time you launch the project from it.

## API

```js
import * as Permissions from 'expo-permissions';
```

### `Permissions.getAsync(...permissionTypes)`

Determines whether your app has already been granted access to the provided permissions types.

#### Arguments

- **permissionTypes (_string_)** -- The names of the permissions types.

#### Returns

Returns a `Promise` that is resolved with the information about the permissions, including status, expiration and scope (if it applies to the permission type).
Top-level `status` and `expires` keys stores combined info of each component permission that is asked for.
If any permission resulted in a negative result, then that negative result is propagated here; that means top-level values are positive only if all component values are positive.

Examples `[...componentsValues] => topLevelStatus`:

- `[granted, denied, granted] => denied`
- `[granted, granted, granted] => granted`

```javascript
{
  status, // combined status of all component permissions being asked for, if any of has status !== 'granted' then that status is propagated here
  expires, // combined expires of all permissions being asked for, same as status
  permissions: { // an object with an entry for each permission requested
    [Permissions.TYPE]: {
      status,
      expires,
      ... // any additional permission-specific fields
    },
    ...
  },
}
```

#### Example

```javascript
async function alertIfRemoteNotificationsDisabledAsync() {
  const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  if (status !== 'granted') {
    alert('Hey! You might want to enable notifications for my app, they are good.');
  }
}

async function checkMultiPermissions() {
  const { status, expires, permissions } = await Permissions.getAsync(
    Permissions.CALENDAR,
    Permissions.CONTACTS
  );
  if (status !== 'granted') {
    alert('Hey! You heve not enabled selected permissions');
  }
}
```

### `Permissions.askAsync(...types)`

Prompt the user for types of permissions. If they have already granted access, response will be success.

#### Arguments

- **types (_string_)** -- The names of the permissions types.

#### Returns

Same as for `Permissions.getAsync`

#### Example

```javascript
async function getLocationAsync() {
  // permissions returns only for location permissions on iOS and under certain conditions, see Permissions.LOCATION
  const { status, permissions } = await Permissions.askAsync(Permissions.LOCATION);
  if (status === 'granted') {
    return Location.getCurrentPositionAsync({ enableHighAccuracy: true });
  } else {
    throw new Error('Location permission not granted');
  }
}
```

## Permissions types

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

<!-- TODO: Permissions.LOCATION issue (search by this phrase) -->

> **Note:** iOS is not working with this permission being not individually, `Permissions.askAsync(Permissions.SOME_PERMISSIONS, Permissions.LOCATION, Permissions.CAMERA, ...)` would throw.
> On iOS ask for this permission type individually.

> **Note (iOS):** In Expo client this permission will always ask the user for permission to access location data while the app is in use.

> **Note (iOS):** iOS provides more detailed permissions, returning `{ status, permissions: { location: { ios } } }` where `ios` which is an object containing: `{ scope: 'whenInUse' | 'always' | 'none' }`
> If you would like to access location data in a standalone app, note that you'll need to provide location usage descriptions in `app.json`. For more information see [Deploying to App Stores guide](../../distribution/app-stores/#system-permissions-dialogs-on-ios).
>
> **What location usage descriptions should I provide?** Due to the design of the location permission API on iOS we aren't able to provide you with methods for asking for `whenInUse` or `always` location usage permission specifically. However, you can customize the behavior by providing the following sets of usage descriptions:
>
> - if you provide only `NSLocationWhenInUseUsageDescription`, your application will only ever ask for location access permission "when in use",
> - if you provide both `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription`, your application will only ask for "when in use" permission on iOS 10, whereas on iOS 11+ it will show a dialog to the user where he'll be able to pick whether he'd like to give your app permission to access location always or only when the app is in use,
> - if you provide all three: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription` and `NSLocationAlwaysUsageDescription`, your application on iOS 11+ will still show a dialog described above and on iOS 10 it will only ask for "always" location permission.

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

The permission type for reading or writing reminders.
(iOS only, on Android would return `granted` immediately)

### `Permissions.SYSTEM_BRIGHTNESS`

The permissions type for changing brighness of the screen

## Android: permissions equivalents inside `app.json`

In order to request permissions in a standalone Android app (Managed Workflow only), you need to specify the corresponding native permission types in the `android.permissions` key inside `app.json` ([read more about configuration](../../workflow/configuration/#android)). The mapping between `Permissions` values and native permission types is as follows:

| Expo            | Android                                       |
| --------------- | --------------------------------------------- |
| LOCATION        | ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION  |
| CAMERA          | CAMERA                                        |
| AUDIO_RECORDING | RECORD_AUDIO                                  |
| CONTACTS        | READ_CONTACTS                                 |
| CAMERA_ROLL     | READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE |
| CALENDAR        | READ_CALENDAR, WRITE_CALENDAR                 |

For example, if your app asks for `AUDIO_RECORDING` permission at runtime but no other permissions, you should set `android.permissions` to `["RECORD_AUDIO"]` in `app.json`.

> **Note:** If you don't specify `android.permissions` inside your `app.json`, by default your standalone Android app will require all of the permissions listed above.
