import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import {
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
  // if (Platform.OS === 'android') {
  //   await setNotificationChannelAsync('default', {
  //     name: 'default',
  //     importance: AndroidImportance.MAX,
  //     vibrationPattern: [0, 250, 250, 250],
  //     lightColor: '#FF231F7C',
  //   });
  // }

  if (isDevice) {
    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token permission!');
      throw new Error('Failed to get push token permission!');
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // Here we use EAS projectId
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error('Project ID not found');
    }
    const token = (
      await getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log(token);
    return token;
  } else {
    console.error('Must use physical device for Push Notifications');
    return '';
  }
}
