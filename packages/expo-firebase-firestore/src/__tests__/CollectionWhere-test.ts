const should = require('should');

export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
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

          should.equal(found.size, 1);
          found.forEach(documentSnapshot => {
            should.deepEqual(documentSnapshot.data().arrString, contextify(['a', 'b', 'c', 'd']));
          });

          const notFound = await firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('arrString', 'array-contains', 'f')
            .get();

          should.equal(notFound.size, 0);
        });

        it('`array-contains` a number value', async () => {
          const found = await firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('arrNumber', 'array-contains', 1)
            .get();

          should.equal(found.size, 1);
          found.forEach(documentSnapshot => {
            should.deepEqual(documentSnapshot.data().arrNumber, contextify([1, 2, 3, 4]));
          });

          const notFound = await firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('arrNumber', 'array-contains', 5)
            .get();

          should.equal(notFound.size, 0);
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
              should.equal(querySnapshot.size, 1);
              querySnapshot.forEach(documentSnapshot => {
                should.equal(documentSnapshot.data().baz, true);
              });
            }));

        it('== string value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('foo', '==', 'bar')
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
              querySnapshot.forEach(documentSnapshot => {
                should.equal(documentSnapshot.data().foo, 'bar');
              });
            }));

        it('== null value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('naz', '==', null)
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
              querySnapshot.forEach(documentSnapshot => {
                should.equal(documentSnapshot.data().naz, null);
              });
            }));

        it('== date value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('timestamp', '==', COL_DOC_1().timestamp)
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
            }));

        it('== GeoPoint value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('geopoint', '==', COL_DOC_1().geopoint)
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
            }));

        it('>= number value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('daz', '>=', 123)
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
              querySnapshot.forEach(documentSnapshot => {
                should.equal(documentSnapshot.data().daz, 123);
              });
            }));

        it('>= GeoPoint value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('geopoint', '>=', new firebase.firestore.GeoPoint(-1, -1))
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
            }));

        it('<= float value', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where('gaz', '<=', 12.1234666)
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
              querySnapshot.forEach(documentSnapshot => {
                should.equal(documentSnapshot.data().gaz, 12.1234567);
              });
            }));

        it('FieldPath', () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .where(new firebase.firestore.FieldPath('baz'), '==', true)
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 1);
              querySnapshot.forEach(documentSnapshot => {
                should.equal(documentSnapshot.data().baz, true);
              });
            }));
      });
    });
  });
}
