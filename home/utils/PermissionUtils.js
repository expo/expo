import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Permissions from 'expo-permissions';
import { Alert, Linking, Platform } from 'react-native';

const PermissionName = {
  [Permissions.CAMERA]: 'The Camera',
  [Permissions.LOCATION]: 'GPS',
  [Permissions.CAMERA_ROLL]: 'The Gallery',
  [Permissions.AUDIO_RECORDING]: 'The Microphone',
  [Permissions.NOTIFICATIONS]: 'Push Notifications',
  [Permissions.USER_FACING_NOTIFICATIONS]: 'Notifications',
  [Permissions.CONTACTS]: 'Your Contacts',
  [Permissions.CALENDAR]: 'Calendar',
  [Permissions.REMINDERS]: 'Reminders',
};

// Use a controlled prompt to ensure you retain access to the permission prompt.
// If the user rejects the controlled prompt, you can always prompt them again when they're ready.
// Otherwise you'll need to redirect the user to the system settings.
export async function controlledPromptAsync(permission, permissionReason, redirectReason) {
  const { status } = await Permissions.getAsync(permission);
  if (status === 'denied') {
    return requestAsync(permission, false, permissionReason || redirectReason);
  } else if (status === 'granted') {
    return true;
  }

  return new Promise(resolve => {
    Alert.alert(
      `Please Turn On ${PermissionName[permission]}`,
      permissionReason,
      [
        {
          text: 'Not Now',
          onPress: () => resolve(false),
        },
        {
          text: 'OK',
          onPress: async () => {
            const enabled = await requestAsync(
              permission,
              true,
              redirectReason || permissionReason
            );
            resolve(enabled);
          },
        },
      ],
      { cancelable: true }
    );
  });
}

export async function requestAsync(permission, shouldRequest, redirectReason) {
  let status;
  if (shouldRequest) {
    status = (await Permissions.askAsync(permission)).status;
  } else {
    status = (await Permissions.getAsync(permission)).status;
  }
  if (status === 'denied' || (status === 'undetermined' && shouldRequest)) {
    // Prompt to open settings and change the permission manually.
    // When the user changes the permissions the app will reset so we should
    // just return false regardless at this point.
    return new Promise(resolve => {
      Alert.alert(
        'Oh no!',
        redirectReason,
        [
          {
            text: 'Nevermind',
            onPress: () => resolve(false),
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              if (Platform.OS === 'android') {
                const { manifest: { android: { package: packageName } = {} } = {} } = Constants;
                try {
                  await IntentLauncher.startActivityAsync(
                    IntentLauncher.ACTION_APPLICATION_DETAILS_SETTINGS,
                    { data: 'package:' + packageName }
                  );
                } catch (error) {
                  alert(`Couldn't open settings automatically.`);
                }
              } else {
                await Linking.openURL('app-settings:');
              }
              resolve(false);
            },
          },
        ],
        { cancelable: true }
      );
    });
  }
  return status === 'granted';
}

export async function requestQRAysnc() {
  return await controlledPromptAsync(
    Permissions.CAMERA,
    'In order to use the QR Code scanner you need to provide camera permissions'
  );
}

export async function requestCameraAysnc() {
  return await controlledPromptAsync(
    Permissions.CAMERA,
    'In order to take photos you need to grant access to the camera'
  );
}

export async function requestCameraRollAysnc() {
  return await controlledPromptAsync(
    Permissions.CAMERA_ROLL,
    'You need to grant permission in order to select media from the gallery'
  );
}

export async function requestLocationAysnc() {
  return await controlledPromptAsync(
    Permissions.LOCATION,
    'Location permissions are required in order to use this feature',
    'You can manually enable this permission at any time in the "Location Services" section of the Settings app.'
  );
}
