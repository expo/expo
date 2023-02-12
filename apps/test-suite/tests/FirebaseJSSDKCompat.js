import * as FileSystem from 'expo-file-system';
import firebase from 'firebase/compat';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import 'firebase/compat/storage';

// The modules below require browser features and are not compatible within the react-native context.
// import "firebase/compat/analytics";
// import "firebase/compat/remote-config";
// import "firebase/compat/messaging";
// import "firebase/compat/performance";
// import "firebase/compat/installations";

import { expectMethodToThrowAsync } from '../TestUtils';

export const name = 'FirebaseJSSDK (Compat)';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD2gZuX5utrLBAdJoMrAdrMW7Sv9xQ5uBE',
  authDomain: 'expo-payments.firebaseapp.com',
  databaseURL: 'https://expo-payments.firebaseio.com',
  projectId: 'expo-payments',
  storageBucket: 'expo-payments.appspot.com',
  messagingSenderId: '482324271988',
  appId: '1:482324271988:web:9597460d096749b3f8d221',
  measurementId: 'G-498KQSTM5G',
};

export async function test({ describe, it, expect, beforeAll }) {
  beforeAll(() => {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
    } catch {
      // nop
    }
  });

  describe('FirebaseJSSDK', async () => {
    describe('auth', async () => {
      it(`calls auth() succesfully`, () => {
        firebase.auth();
      });
      it(`returns correct sign-in error`, async () => {
        const error = await expectMethodToThrowAsync(() =>
          firebase.auth().signInWithEmailAndPassword('testuser@invaliddomain.com', '0')
        );
        expect(error.code).toBe('auth/operation-not-allowed');
      });
    });

    describe('database', async () => {
      it(`calls database() succesfully`, () => {
        const db = firebase.database();
        expect(db).not.toBeNull();
      });
      it(`reads data once`, async () => {
        let error = null;
        try {
          const snapshot = await firebase.database().ref('/test1').once('value');
          expect(snapshot.val()).toBe('foobar');
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('firestore', async () => {
      it(`calls firestore() succesfully`, () => {
        const db = firebase.firestore();
        expect(db).not.toBeNull();
      });
      it(`gets a collection`, async () => {
        let error = null;
        try {
          const { docs } = await firebase.firestore().collection('tests').get();
          expect(docs.length).toBeGreaterThan(0);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      it(`gets a document`, async () => {
        let error = null;
        try {
          const snapshot = await firebase.firestore().doc('tests/doc1').get();
          expect(snapshot).not.toBeNull();
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('functions', async () => {
      it(`calls functions() succesfully`, () => {
        const functions = firebase.functions();
        expect(functions).not.toBeNull();
      });
      it(`calls the echo function`, async () => {
        let error = null;
        try {
          const message = "I'm a unit test";
          const echoMessage = firebase.functions().httpsCallable('echoMessage');
          const response = await echoMessage({ message });
          const responseMessage = response.data.message;
          expect(responseMessage).toBe(`Hi 👋, you said: ${message}`);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('storage', () => {
      it(`calls storage() succesfully`, () => {
        const storage = firebase.storage();
        expect(storage).not.toBeNull();
      });
      it(`lists all files`, async () => {
        let error = null;
        try {
          const files = await firebase.storage().ref('public').listAll();
          expect(files.items.length).toBeGreaterThan(0);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      it(`downloads a file`, async () => {
        let error = null;
        try {
          const files = await firebase.storage().ref('public').listAll();
          expect(files.items.length).toBeGreaterThan(0);
          const file = files.items[0];
          const downloadUrl = await file.getDownloadURL();
          expect(typeof downloadUrl).toBe('string');
          const startUrl = 'https://firebasestorage.googleapis.com';
          expect(downloadUrl.substring(0, startUrl.length)).toBe(startUrl);
          const { uri } = await FileSystem.downloadAsync(
            downloadUrl,
            FileSystem.documentDirectory + file.name
          );
          expect(typeof uri).toBe('string');
          expect(uri).not.toBeNull();
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      /* it(`upload a file`, async () => {
        let error = null;
        try {
          // REQUIRES AUTH
          const currentUser = firebase.auth ? firebase.auth().currentUser : undefined;
          // const suffix = new Date().toISOString().replace(/\D/g, '');
          const fileContent = new ArrayBuffer(1000);
          const ref = firebase
            .storage()
            .ref(`users/${currentUser.uid}`)
            .child(`unittest`);
          // @ts-ignore
          const uploadTask = ref.put(fileContent);
          await new Promise((resolve, reject) => {
            uploadTask.on(
              firebase.storage.TaskEvent.STATE_CHANGED,
              snapshot => {},
              reject,
              resolve
            );
          });
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });*/
    });
  });
}
