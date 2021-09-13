import * as FileSystem from 'expo-file-system';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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

export const name = 'FirebaseJSSDKv9';

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
      initializeApp(FIREBASE_CONFIG);
    } catch (err) {
      // nop
    }
  });

  describe('FirebaseJSSDKv9', async () => {
    describe('auth', async () => {
      it(`calls getAuth() succesfully`, () => {
        const auth = getAuth();
        expect(auth).not.toBeNull();
      });

      it(`returns correct sign-in error`, async () => {
        const auth = getAuth();
        const error = await expectMethodToThrowAsync(() =>
          signInWithEmailAndPassword(auth, 'testuser@invaliddomain.com', '0')
        );
        expect(error.code).toBe('auth/operation-not-allowed');
      });
    });

    describe('database', async () => {
      it(`calls getDatabase() succesfully`, () => {
        const db = getDatabase();
        expect(db).not.toBeNull();
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
        const firestore = getFirestore();
        expect(firestore).not.toBeNull();
      });

      it(`gets a collection`, async () => {
        let error = null;
        try {
          const firestore = getFirestore();
          const q = query(collection(firestore, 'tests'), where('foo', '==', 'bar'));
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
          const firestore = getFirestore();
          const q = query(doc(firestore, 'tests/doc1'));
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
        const functions = getFunctions();
        expect(functions).not.toBeNull();
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
        const storage = getStorage();
        expect(storage).not.toBeNull();
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
}
