import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { initializeApp, getApp } from 'firebase/app';
import {
  initializeAuth,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  PhoneAuthProvider,
} from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getFirestore, query, collection, where, doc, getDocs, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref as storageRef, listAll, getDownloadURL } from 'firebase/storage';

// The modules below require browser features and are not compatible within the react-native context.
// import {...} from "firebase/analytics";
// import {...} from "firebase/remote-config";
// import {...} from "firebase/messaging";
// import {...} from "firebase/performance";
// import {...} from "firebase/installations";

import { expectMethodToThrowAsync } from '../TestUtils';

export const name = 'FirebaseJSSDK';

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

let auth = null;

export async function test({ describe, it, expect }) {
  // Firebase can't reinitialize parts of their SDK, let's try and silently ignore if it fails.
  try {
    initializeApp(FIREBASE_CONFIG);
  } catch {}

  try {
    // We need to use `@react-native-async-storage/async-storage` instead of `react-native`.
    // See: https://github.com/firebase/firebase-js-sdk/issues/1847
    auth = initializeAuth(getApp(), { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {}

  describe('FirebaseJSSDK', async () => {
    describe('auth', async () => {
      it(`calls getAuth() succesfully`, () => {
        expect(auth).not.toBeNull();
      });

      it(`returns correct sign-in error`, async () => {
        const error = await expectMethodToThrowAsync(() =>
          signInWithEmailAndPassword(auth, 'testuser@invaliddomain.com', '0')
        );
        expect(error.code).toBe('auth/operation-not-allowed');
      });
    });

    describe('database', async () => {
      it(`calls getDatabase() succesfully`, () => {
        expect(getDatabase()).not.toBeNull();
      });

      it(`reads data once`, async () => {
        let error = null;
        try {
          const db = getDatabase();
          const reference = ref(db, '/test1');
          onValue(reference, (snapshot) => {
            expect(snapshot.val()).toBe('foobar');
          });
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('firestore', async () => {
      it(`calls getFirestore() succesfully`, () => {
        expect(getFirestore()).not.toBeNull();
      });

      it(`gets a collection`, async () => {
        let error = null;
        try {
          const q = query(collection(getFirestore(), 'tests'), where('foo', '==', 'bar'));
          const querySnapshot = await getDocs(q);
          expect(querySnapshot.size).toBe(1);
          querySnapshot.forEach((doc) => {
            expect(doc.data().foo).toBe('bar');
          });
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });

      it(`gets a document`, async () => {
        let error = null;
        try {
          const q = query(doc(getFirestore(), 'tests/doc1'));
          const querySnapshot = await getDoc(q);
          expect(querySnapshot).not.toBeNull();
          const data = querySnapshot.data();
          expect(data.foo).toBe('bar');
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('functions', async () => {
      it(`calls getFunctions() succesfully`, () => {
        expect(getFunctions()).not.toBeNull();
      });

      it(`calls the echo function`, async () => {
        let error = null;
        try {
          const functions = getFunctions();
          const message = "I'm a unit test";
          const echoMessage = httpsCallable(functions, 'echoMessage');
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
      it(`calls getStorage() succesfully`, () => {
        expect(getStorage()).not.toBeNull();
      });

      it(`lists all files`, async () => {
        let error = null;
        try {
          const storage = getStorage();
          const publicRef = storageRef(storage, 'public');
          const files = await listAll(publicRef);
          expect(files.items.length).toBeGreaterThan(0);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });

      it(`downloads a file`, async () => {
        let error = null;
        try {
          const storage = getStorage();
          const publicRef = storageRef(storage, 'public');
          const files = await listAll(publicRef);
          expect(files.items.length).toBeGreaterThan(0);
          const file = files.items[0];
          const downloadUrl = await getDownloadURL(file);
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
    });
  });

  describe('regression', () => {
    // see: https://github.com/firebase/firebase-js-sdk/issues/5638
    describe('firebase/auth', () => {
      it('exports signInWithPhoneNumber', () => {
        expect(signInWithPhoneNumber).not.toBe(undefined);
      });

      it('exports PhoneAuthProvider', () => {
        expect(PhoneAuthProvider).not.toBe(undefined);
      });
    });
  });
}

/**
 * This is a replacement for the internal `getReactNativePersistence`.
 * When this function is exposed, or if Firebase switches to the new AsyncStorage, we can remove this.
 *
 * @see https://github.com/firebase/firebase-js-sdk/blob/cdada6c68f9740d13dd6674bcb658e28e68253b6/packages/auth/src/platform_react_native/persistence/react_native.ts#L42-L85
 * @see https://github.com/firebase/firebase-js-sdk/issues/1847#issuecomment-929482013
 */
function getReactNativePersistence(storage) {
  // https://github.com/firebase/firebase-js-sdk/blob/6dacc2400fdcf4432ed1977ca1eb148da6db3fc5/packages/auth/src/core/persistence/index.ts#L33
  const STORAGE_AVAILABLE_KEY = '__sak';

  return class PersistenceExpo {
    type = 'LOCAL';

    /** @return {Promise<boolean>} */
    async _isAvailable() {
      try {
        if (!storage) {
          return false;
        }
        await storage.setItem(STORAGE_AVAILABLE_KEY, '1');
        await storage.removeItem(STORAGE_AVAILABLE_KEY);
        return true;
      } catch {
        return false;
      }
    }

    /**
     * @param {string} key
     * @param {Record<string, unknown>|string} value
     * @return {Promise<void>}
     */
    _set(key, value) {
      return storage.setItem(key, JSON.stringify(value));
    }

    /**
     * @param {string} key
     * @param {Record<string, unknown>|string} value
     * @return {Promise<Record<string, unknown>|string|null>}
     */
    async _get(key) {
      const json = await storage.getItem(key);
      return json ? JSON.parse(json) : null;
    }

    /**
     * @param {string} key
     * @return {Promise<void>}
     */
    _remove(key) {
      return storage.removeItem(key);
    }

    /**
     * @param {string} key
     * @param {(value: Record<string, unknown>|string|null) => void} _listener
     * @return {void}
     */
    _addListener(_key, _listener) {
      // Listeners are not supported for React Native storage.
    }

    /**
     * @param {string} key
     * @param {(value: Record<string, unknown>|string|null) => void} _listener
     * @return {void}
     */
    _removeListener(_key, _listener) {
      // Listeners are not supported for React Native storage.
    }
  };
}
