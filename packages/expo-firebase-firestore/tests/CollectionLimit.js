export default function test({
  should,
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  sinon,
  jasmine,
  firebase,
  TestHelpers: {
    firestore: { COL_DOC_1, cleanCollection, TEST_COLLECTION_NAME_DYNAMIC },
  },
}) {
  describe('firestore()', () => {
    beforeEach(async () => {
      await cleanCollection(TEST_COLLECTION_NAME_DYNAMIC);

      const collection = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

      await Promise.all([
        collection.doc('col1').set(COL_DOC_1()),
        collection.doc('col2').set({ ...COL_DOC_1(), daz: 2 }),
        collection.doc('col3').set({ ...COL_DOC_1(), daz: 3 }),
        collection.doc('col4').set({ ...COL_DOC_1(), daz: 4 }),
        collection.doc('col5').set({ ...COL_DOC_1(), daz: 5 }),
      ]);
    });

    describe('CollectionReference', () => {
      describe('limit()', () => {
        it('correctly works with get()', async () =>
          firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .limit(3)
            .get()
            .then(querySnapshot => {
              should.equal(querySnapshot.size, 3);
            }));

        it('correctly works with onSnapshot()', async () => {
          const collectionRef = firebase
            .firestore()
            .collection(TEST_COLLECTION_NAME_DYNAMIC)
            .limit(3);

          const callback = sinon.spy();

          // Test
          let unsubscribe;
          await new Promise(resolve2 => {
            unsubscribe = collectionRef.onSnapshot(snapshot => {
              callback(snapshot.size);
              resolve2();
            });
          });

          // Assertions
          callback.should.be.calledWith(3);

          // Tear down
          unsubscribe();
        });
      });
    });
  });
}
