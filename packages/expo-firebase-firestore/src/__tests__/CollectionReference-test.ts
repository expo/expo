import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Path,
} from 'expo-firebase-firestore';

import firebase from 'expo-firebase-app';

export default function test({
  should,
  TestHelpers: {
    firestore: {
      COL_DOC_1,
      COL_DOC_1_PATH,
      TEST_COLLECTION_NAME,
      testCollection,
      testCollectionDoc,
      resetTestCollectionDoc,
    },
  },
}) {
  describe('firestore()', () => {
    describe('CollectionReference', () => {
      beforeEach(() => resetTestCollectionDoc(COL_DOC_1_PATH, COL_DOC_1()));

      it('get id()', () => {
        const firestore = firebase.firestore();

        const reference = new CollectionReference(firestore, new Path(['tests']));
        expect(reference.id).toBe('tests');
      });

      it('get firestore()', () => {
        const firestore = firebase.firestore();

        const reference = new CollectionReference(firestore, new Path(['tests']));
        reference.firestore.should.equal(firestore);
      });

      it('get parent()', () => {
        const firestore = firebase.firestore();

        const reference = new CollectionReference(firestore, new Path(['tests']));
        expect(reference instanceof CollectionReference).toBeTruthy();
        expect(reference.parent).toBe(null);

        const reference2 = new CollectionReference(
          firestore,
          new Path(['tests', 'someDoc', 'someChildCollection'])
        );
        expect(reference2 instanceof CollectionReference).toBeTruthy();

        should.notEqual(reference2.parent, null);
        expect(reference.parent instanceof DocumentReference).toBeTruthy();
      });

      describe('add()', () => {
        it('should create a Document', async () => {
          const collection = testCollection(TEST_COLLECTION_NAME);

          const docRef = await collection.add({
            first: 'Ada',
            last: 'Lovelace',
            born: 1815,
          });

          const doc = await firebase
            .firestore()
            .doc(docRef.path)
            .get();

          expect(doc.data().first).toBe('Ada');

          await firebase
            .firestore()
            .doc(docRef.path)
            .delete();
        });
      });

      describe('doc()', () => {
        it('should create DocumentReference with correct path', async () => {
          const docRef = await testCollectionDoc(COL_DOC_1_PATH);
          expect(docRef.path).toBe(COL_DOC_1_PATH);
        });

        it('should error when supplied an incorrect path', () => {
          expect(
            firebase
              .firestore()
              .collection('collection')
              .doc('invalid/doc')
          ).toThrow('Argument "documentPath" must point to a document.');
        });
      });

      describe('get()', () => {
        it('should retrieve all documents on a collection', async () => {
          const collection = testCollection(TEST_COLLECTION_NAME);

          const querySnapshot = await collection.get();

          expect(querySnapshot.size >= 1).toBe(true);

          querySnapshot.forEach(documentSnapshot => {
            documentSnapshot.should.be.instanceOf(DocumentSnapshot);
          });
        });

        it('should support GetOptions source=`default`', async () => {
          const collection = testCollection(TEST_COLLECTION_NAME);
          const querySnapshot = await collection.get({ source: 'default' });
          expect(querySnapshot.size >= 1).toBe(true);
          querySnapshot.metadata.should.be.an.Object();
          expect(querySnapshot.metadata.fromCache).toBe(false);
        });

        it('should support GetOptions source=`server`', async () => {
          const collection = testCollection(TEST_COLLECTION_NAME);
          const querySnapshot = await collection.get({ source: 'server' });
          expect(querySnapshot.size >= 1).toBe(true);
          querySnapshot.metadata.should.be.an.Object();
          expect(querySnapshot.metadata.fromCache).toBe(false);
        });

        // TODO: Investigate why this isn't returning `fromCache=true`
        xit('should support GetOptions source=`cache`', async () => {
          const collection = testCollection(TEST_COLLECTION_NAME);
          const querySnapshot = await collection.get({ source: 'cache' });
          expect(querySnapshot.size >= 1).toBe(true);
          querySnapshot.metadata.should.be.an.Object();
          expect(querySnapshot.metadata.fromCache).toBe(true);
        });

        it('should error with invalid GetOptions source option', async () => {
          const collectionRef = testCollection(TEST_COLLECTION_NAME);
          try {
            await collectionRef.get(() => {});
            return Promise.reject(new Error('get() did not reject with invalid argument.'));
          } catch (e) {
            // do nothing
          }
          try {
            await collectionRef.get({ source: 'invalid' });
            return Promise.reject(new Error('get() did not reject with invalid source property.'));
          } catch (e) {
            // do nothing
          }
          return Promise.resolve();
        });
      });
    });
  });
}
