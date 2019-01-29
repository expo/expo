import firebase from 'expo-firebase-app';
// Optional flow type
import { RemoteMessage } from 'expo-firebase-messaging';

export default async (message: RemoteMessage) => {
  // handle your message

  console.log('Background.messaging', message);
  return Promise.resolve();
};
