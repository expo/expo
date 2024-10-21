import { Camera } from 'expo-camera';
import { Alert, Linking } from 'react-native';

export async function requestCameraPermissionsAsync(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function alertWithCameraPermissionInstructions(): Promise<void> {
  return Alert.alert(
    'Permission needed',
    'In order to use the QR code scanner, you must give permission for Expo Go to access the camera. You can grant this permission in the Settings app.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Go to Settings',
        onPress: () => Linking.openSettings(),
      },
    ],
    {
      cancelable: true,
    }
  );
}
