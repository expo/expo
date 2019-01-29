import firebase from 'expo-firebase-app';

import { Platform } from 'expo-core';

const { OS } = Platform;

const androidTestConfig = {
  // firebase android sdk completely ignores client id
  clientId: '305229645282-j8ij0jev9ut24odmlk9i215pas808ugn.apps.googleusercontent.com',
  appId: '1:305229645282:android:af36d4d29a83e04c',
  apiKey: 'AIzaSyCzbBYFyX8d6VdSu7T4s10IWYbPc-dguwM',
  databaseURL: 'https://rnfirebase-b9ad4.firebaseio.com',
  storageBucket: 'rnfirebase-b9ad4.appspot.com',
  messagingSenderId: '305229645282',
  projectId: 'rnfirebase-b9ad4',
};

const iosTestConfig = {
  clientId: '305229645282-22imndi01abc2p6esgtu1i1m9mqrd0ib.apps.googleusercontent.com',
  androidClientId: androidTestConfig.clientId,
  appId: '1:305229645282:ios:af36d4d29a83e04c',
  apiKey: 'AIzaSyAcdVLG5dRzA1ck_fa_xd4Z0cY7cga7S5A',
  databaseURL: 'https://rnfirebase-b9ad4.firebaseio.com',
  storageBucket: 'rnfirebase-b9ad4.appspot.com',
  messagingSenderId: '305229645282',
  projectId: 'rnfirebase-b9ad4',
};

function rand(from = 1, to = 9999) {
  const r = Math.random();
  return Math.floor(r * (to - from + from));
}

describe('Core', () => {
  describe('Firebase', () => {
    xit('it should create js apps for natively initialized apps', () => {
      // N/A in Expo
      expect(firebase.app()._nativeInitialized).toBe(true);
      return Promise.resolve();
    });

    it('natively initialized apps should have options available in js', () => {
      expect(firebase.app().options.apiKey).toBe(
        OS === 'ios' ? iosTestConfig.apiKey : androidTestConfig.apiKey
      );
      expect(firebase.app().options.appId).toBe(
        OS === 'ios' ? iosTestConfig.appId : androidTestConfig.appId
      );
      expect(firebase.app().options.databaseURL).toBe(iosTestConfig.databaseURL);
      expect(firebase.app().options.messagingSenderId).toBe(iosTestConfig.messagingSenderId);
      expect(firebase.app().options.projectId).toBe(iosTestConfig.projectId);
      expect(firebase.app().options.storageBucket).toBe(iosTestConfig.storageBucket);
      return Promise.resolve();
    });

    it('it should resolve onReady for natively initialized apps', () => firebase.app().onReady());

    it('it should initialize dynamic apps', async () => {
      const name = `testscoreapp${rand()}`;
      return firebase
        .initializeApp(OS === 'ios' ? iosTestConfig : androidTestConfig, name)
        .onReady()
        .then(newApp => {
          expect(newApp.name).toBe(name.toUpperCase());
          expect(newApp.toString()).toBe(name.toUpperCase());
          expect(newApp.options.apiKey).toBe(
            (OS === 'ios' ? iosTestConfig : androidTestConfig).apiKey
          );
          // TODO add back in when android sdk support for deleting apps becomes available
          // return newApp.delete();
        });
    });

    it('SDK_VERSION should return a string version', () => {
      expect(typeof firebase.SDK_VERSION).toBe('string');
    });
  });

  describe('App', () => {
    it('apps should provide an array of apps', () => {
      expect(!!firebase.apps.length).toBe(true);
      expect(firebase.apps.includes(firebase.app('[DEFAULT]'))).toBe(true);
      return Promise.resolve();
    });

    xit('delete default app is unsupported', () => {
      expect(firebase.app().delete()).toThrow(
        'Unable to delete the default native firebase app instance.'
      );
    });

    it('extendApp should error if an object is not supplied', () => {
      expect(firebase.app().extendApp('string')).toThrow(
        "Missing required argument of type 'Object' for method 'extendApp()'."
      );
    });

    it('extendApp should error if a protected property is supplied', () => {
      expect(
        firebase.app().extendApp({
          database: {},
        })
      ).toThrow("Property 'database' is protected and can not be overridden by extendApp.");
    });

    it('extendApp should provide additional functionality', () => {
      const extension = {};
      firebase.app().extendApp({
        extension,
      });
      expect(firebase.app().extension).toBe(extension);
    });
  });
});
