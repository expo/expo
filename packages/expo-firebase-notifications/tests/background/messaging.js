// @flow
import firebase from 'expo-firebase-app';
// Optional flow type
import type { RemoteMessage } from 'expo-firebase-messaging';

export default async (message: RemoteMessage) => {
  // handle your message

  console.log('Background.messaging', message);
  return Promise.resolve();
};
