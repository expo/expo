# expo-permissions

When it comes to adding functionality that can access potentially sensitive information on a user's device, such as their location, or possibly send them possibly unwanted push notifications, you will need to ask the user for their permission first. Unless you've already asked their permission, then no need. And so we have the `Permissions` module.

If you are deploying your app to the Apple iTunes Store, you should consider adding additional metadata to your app in order to customize the system permissions dialog and explain why your app requires permissions. See more info in the [App Store Deployment Guide](https://docs.expo.io/versions/latest/guides/app-stores.html#system-permissions-dialogs-on-ios).

## Installation

*If your app is running in [Expo](https://expo.io) then everything is already set up for you, just `import { Permissions } from 'expo';`*

Otherwise, you need to install the package from `npm` registry.

`yarn add expo-permissions` or `npm install expo-permissions`

Also, make sure that you have [expo-core](https://github.com/expo/expo-core) installed, as it is required by `expo-permissions` to work properly.

### iOS

Add these dependencies to your `Podfile`:

```ruby
pod 'EXPermissions', path: '../node_modules/expo-permissions/ios'
pod 'EXPermissionsInterface', path: '../node_modules/expo-permissions-interface/ios'
```

and run `pod install` under the parent directory of your `Podfile`.

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
3.  Add `new PermissionsPackage()` to your module registry provider in `MainApplication.java`.

## Methods

### `Expo.Permissions.getAsync(...permissionTypes)`

Determines whether your app has already been granted access to the provided permissions types.

#### Arguments

-   **permissionTypes (_string_)** -- The names of the permissions types.

#### Returns

Returns a `Promise` that is resolved with the information about the permissions, including status, expiration and scope (if it applies to the permission type).
Top-level `status` and `exprires` keys stores combined info of each component permission that is asked for.
If any permission resulted in negative result than that negative result is propagated here, that means top-level values are positive only if all component values are positive.

Examples `[...componentsValues] => topLevelStatus`: 
* `[granted, denied, granted] => denied`
* `[granted, granted, granted] => granted`

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
  const { Permissions } = Expo;
  const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  if (status !== 'granted') {
    alert('Hey! You might want to enable notifications for my app, they are good.');
  }
}

async function checkMultiPermissions() {
  const { Permissions } = Expo;
  const { status, expires, permissions } = await Permissions.getAsync(Permissions.CALENDAR, Permissions.SMS, Permissions.CONTACTS)
  if (status !== 'granted') {
    alert('Hey! You heve not enabled selected permissions');
  }
}
```

### `Expo.Permissions.askAsync(...types)`

Prompt the user for types of permissions. If they have already granted access, response will be success.

#### Arguments

-   **types (_string_)** -- The names of the permissions types.

#### Returns

Same as for `Permissions.getAsync`

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

### `Expo.Permissions.SMS`

The permission type for accessing SMS storage.
(Android only, iOS would return `granted` immediately)

### `Expo.Permissions.SYSTEM_BRIGHTNESS`

The permissions type for changing brighness of the screen

## Android: permissions equivalents inside `app.json`

If you specified `android.permissions` inside your `app.json` ([read more about configuration](https://docs.expo.io/versions/latest/workflow/configuration.html#android))  you have to use values corresponding to their `Expo.Permissions` equivalents. 

| Expo            | Android                                           |
| --------------- | --------------------------------------------------|
| LOCATION        | ACCESS\_COARSE\_LOCATION, ACCESS\_FINE_LOCATION   |
| CAMERA          | CAMERA                                            |
| AUDIO_RECORDING | RECORD_AUDIO                                      |
| CONTACTS        | READ_CONTACTS                                     |
| CAMERA_ROLL     | READ\_EXTERNAL\_STORAGE, WRITE\_EXTERNAL\_STORAGE |
| CALENDAR        | READ\_CALENDAR, WRITE\_CALENDAR                   |
| SMS             | READ_SMS                                          |
