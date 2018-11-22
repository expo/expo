export default function test({
  should,
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
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
        collection.doc('col1').set({ ...COL_DOC_1(), foo: 'bar0' }),
        collection.doc('col2').set({
          ...COL_DOC_1(),
          foo: 'bar1',
          daz: 234,
          object: { daz: 234 },
          timestamp: new Date(2017, 2, 11, 10, 0, 0),
        }),
        collection.doc('col3').set({
          ...COL_DOC_1(),
          foo: 'bar2',
          daz: 345,
          object: { daz: 345 },
          timestamp: new Date(2017, 2, 12, 10, 0, 0),
        }),
        collection.doc('col4').set({
          ...COL_DOC_1(),
          foo: 'bar3',
          daz: 456,
          object: { daz: 456 },
          timestamp: new Date(2017, 2, 13, 10, 0, 0),
        }),
        collection.doc('col5').set({
          ...COL_DOC_1(),
          foo: 'bar4',
          daz: 567,
          object: { daz: 567 },
          timestamp: new Date(2017, 2, 14, 10, 0, 0),
        }),
      ]);
    });

    describe('CollectionReference', () => {
      describe('cursors', () => {
        describe('endAt', () => {
          it('handles dates', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('timestamp')
              .endAt(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234, 345]);
              }));

          it('handles numbers', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('daz')
              .endAt(345)
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234, 345]);
              }));

          it('handles strings', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .endAt('bar2')
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234, 345]);
              }));

          it('handles snapshots', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .get();

            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .endAt(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234, 345]);
              });
          });

          it('works with FieldPath', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('timestamp'))
              .endAt(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234, 345]);
              }));

          it('handles snapshots with FieldPath', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('foo'))
              .get();
            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .endAt(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234, 345]);
              });
          });
        });

        describe('endBefore', () => {
          it('handles dates', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('timestamp')
              .endBefore(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234]);
              }));

          it('handles numbers', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('daz')
              .endBefore(345)
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234]);
              }));

          it('handles strings', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .endBefore('bar2')
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234]);
              }));

          it('handles snapshots', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .get();

            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .endBefore(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234]);
              });
          });

          it('works with FieldPath', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('timestamp'))
              .endBefore(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234]);
              }));

          it('handles snapshots with FieldPath', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('foo'))
              .get();
            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .endBefore(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [123, 234]);
              });
          });
        });

        describe('startAt', () => {
          it('handles dates', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('timestamp')
              .startAt(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [345, 456, 567]);
              }));

          it('handles numbers', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('daz')
              .startAt(345)
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [345, 456, 567]);
              }));

          it('handles strings', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .startAt('bar2')
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [345, 456, 567]);
              }));

          it('handles snapshots', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .get();
            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .startAt(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [345, 456, 567]);
              });
          });

          it('works with FieldPath', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('timestamp'))
              .startAt(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [345, 456, 567]);
              }));

          it('handles snapshots with FieldPath', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('foo'))
              .get();
            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .startAt(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 3);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [345, 456, 567]);
              });
          });
        });

        describe('startAfter', () => {
          it('handles dates', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('timestamp')
              .startAfter(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [456, 567]);
              }));

          it('handles numbers', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('daz')
              .startAfter(345)
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [456, 567]);
              }));

          it('handles strings', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .startAfter('bar2')
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [456, 567]);
              }));

          it('handles snapshot', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .get();
            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .startAfter(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [456, 567]);
              });
          });

          it('works with FieldPath', () =>
            firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('timestamp'))
              .startAfter(new Date(2017, 2, 12, 10, 0, 0))
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [456, 567]);
              }));

          it('handles snapshots with FieldPath', async () => {
            const collectionSnapshot = await firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy(new firebase.firestore.FieldPath('foo'))
              .get();

            return firebase
              .firestore()
              .collection(TEST_COLLECTION_NAME_DYNAMIC)
              .orderBy('foo')
              .startAfter(collectionSnapshot.docs[2])
              .get()
              .then(querySnapshot => {
                should.equal(querySnapshot.size, 2);
                should.deepEqual(querySnapshot.docs.map(doc => doc.data().daz), [456, 567]);
              });
          });
        });

        describe('orderBy()', () => {
          it('errors if called after startAt', () => {
            (() => {
              firebase
                .firestore()
                .collection(TEST_COLLECTION_NAME_DYNAMIC)
                .startAt({})
                .orderBy('test');
            }).should.throw(
              'Cannot specify an orderBy() constraint after calling startAt(), startAfter(), endBefore() or endAt().'
            );
          });

          it('errors if called after startAfter', () => {
            (() => {
              firebase
                .firestore()
                .collection(TEST_COLLECTION_NAME_DYNAMIC)
                .startAfter({})
                .orderBy('test');
            }).should.throw(
              'Cannot specify an orderBy() constraint after calling startAt(), startAfter(), endBefore() or endAt().'
            );
          });

          it('errors if called after endBefore', () => {
            (() => {
              firebase
                .firestore()
                .collection(TEST_COLLECTION_NAME_DYNAMIC)
                .endBefore({})
                .orderBy('test');
            }).should.throw(
              'Cannot specify an orderBy() constraint after calling startAt(), startAfter(), endBefore() or endAt().'
            );
          });

          it('errors if called after endAt', () => {
            (() => {
              firebase
                .firestore()
                .collection(TEST_COLLECTION_NAME_DYNAMIC)
                .endAt({})
                .orderBy('test');
            }).should.throw(
              'Cannot specify an orderBy() constraint after calling startAt(), startAfter(), endBefore() or endAt().'
            );
          });
        });
      });
    });
  });
}
