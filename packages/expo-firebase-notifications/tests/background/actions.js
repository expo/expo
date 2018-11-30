// @flow
import firebase from 'expo-firebase-app';
// Optional flow type
import type { NotificationOpen } from 'expo-firebase-notifications';

export default async (notificationOpen: NotificationOpen) => {
  if (notificationOpen.action === 'snooze') {
    // handle the action
  }

  console.log('baconground.actions', notificationOpen);
  return Promise.resolve();
};
