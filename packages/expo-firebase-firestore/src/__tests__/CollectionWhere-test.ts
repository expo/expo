import firebase from 'expo-firebase-app';

const should = require('should');

export default function test({
  contextify,
  TestHelpers: {
    firestore: { COL_DOC_1, COL_DOC_1_PATH, TEST_COLLECTION_NAME_DYNAMIC, resetTestCollectionDoc },
  },
}) {
  describe('firestore()', () => {
    describe('CollectionReference', () => {
      beforeEach(() => resetTestCollectionDoc(COL_DOC_1_PATH, COL_DOC_1()));
      describe('where()', () => {
        it('`array-contains` a string value', async () => {
          const found = await firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('arrString', 'array-contains', 'a')
            .get();

          expect(found.size).toBe(1);
          found.forEach(documentSnapshot => {
            should.deepEqual(documentSnapshot.data().arrString, contextify(['a', 'b', 'c', 'd']));
          });

          const notFound = await firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('arrString', 'array-contains', 'f')
            .get();

          expect(notFound.size).toBe(0);
        });

        it('`array-contains` a number value', async () => {
          const found = await firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('arrNumber', 'array-contains', 1)
            .get();

          expect(found.size).toBe(1);
          found.forEach(documentSnapshot => {
            should.deepEqual(documentSnapshot.data().arrNumber, contextify([1, 2, 3, 4]));
          });

          const notFound = await firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('arrNumber', 'array-contains', 5)
            .get();

          expect(notFound.size).toBe(0);
        });

        // TODO: below tests should also check the inverse to ensure working as
        // TODO: currently there is only one document in the collection so might be false positives in future
        it('== boolean value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('baz', '==', true)
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
              querySnapshot.forEach(documentSnapshot => {
                expect(documentSnapshot.data().baz).toBe(true);
              });
            }));

        it('== string value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('foo', '==', 'bar')
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
              querySnapshot.forEach(documentSnapshot => {
                expect(documentSnapshot.data().foo).toBe('bar');
              });
            }));

        it('== null value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('naz', '==', null)
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
              querySnapshot.forEach(documentSnapshot => {
                expect(documentSnapshot.data().naz).toBe(null);
              });
            }));

        it('== date value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('timestamp', '==', COL_DOC_1().timestamp)
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
            }));

        it('== GeoPoint value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('geopoint', '==', COL_DOC_1().geopoint)
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
            }));

        it('>= number value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('daz', '>=', 123)
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
              querySnapshot.forEach(documentSnapshot => {
                expect(documentSnapshot.data().daz).toBe(123);
              });
            }));

        it('>= GeoPoint value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('geopoint', '>=', new firebase.firestore.GeoPoint(-1, -1))
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
            }));

        it('<= float value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('gaz', '<=', 12.1234666)
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
              querySnapshot.forEach(documentSnapshot => {
                expect(documentSnapshot.data().gaz).toBe(12.1234567);
              });
            }));

        it('FieldPath', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where(new firebase.firestore.FieldPath('baz'), '==', true)
            .get()
            .then(querySnapshot => {
              expect(querySnapshot.size).toBe(1);
              querySnapshot.forEach(documentSnapshot => {
                expect(documentSnapshot.data().baz).toBe(true);
              });
            }));
      });
    });
  });
}
