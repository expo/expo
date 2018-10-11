import { Platform } from 'react-native';

const android = {
  // firebase android sdk completely ignores client id
  clientId: '305229645282-j8ij0jev9ut24odmlk9i215pas808ugn.apps.googleusercontent.com',
  appId: '1:305229645282:android:af36d4d29a83e04c',
  apiKey: 'AIzaSyCzbBYFyX8d6VdSu7T4s10IWYbPc-dguwM',
  databaseURL: 'https://rnfirebase-b9ad4.firebaseio.com',
  storageBucket: 'rnfirebase-b9ad4.appspot.com',
  messagingSenderId: '305229645282',
  projectId: 'rnfirebase-b9ad4',
};

const ios = {
  clientId: '305229645282-22imndi01abc2p6esgtu1i1m9mqrd0ib.apps.googleusercontent.com',
  androidClientId: android.clientId,
  appId: '1:305229645282:ios:af36d4d29a83e04c',
  apiKey: 'AIzaSyAcdVLG5dRzA1ck_fa_xd4Z0cY7cga7S5A',
  databaseURL: 'https://rnfirebase-b9ad4.firebaseio.com',
  storageBucket: 'rnfirebase-b9ad4.appspot.com',
  messagingSenderId: '305229645282',
  projectId: 'rnfirebase-b9ad4',
};

const testConfig = Platform.select({
  ios,
  android,
});

import firebase from './firebase';
export default async function startAppAsync() {
  await firebase.initializeApp(testConfig).onReady();
}
