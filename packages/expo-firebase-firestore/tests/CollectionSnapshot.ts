import { SnapshotError } from 'expo-firebase-firestore';

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
    firestore: {
      COL_DOC_1,
      DOC_2_PATH,
      COL_DOC_1_PATH,
      cleanCollection,
      resetTestCollectionDoc,
      TEST_COLLECTION_NAME_DYNAMIC,
    },
  },
  sinon,
  helpers: { sleep },
}) {
  describe('firestore()', () => {
    describe('CollectionReference', () => {
      describe('onSnapshot()', () => {
        beforeEach(async () => {
          await sleep(50);
          await cleanCollection(TEST_COLLECTION_NAME_DYNAMIC);
          await sleep(50);
        });

        it('QuerySnapshot has correct properties', async () => {
          const collection = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

          const snapshot = await collection.get();
          snapshot.docChanges.should.be.an.Array();
          snapshot.empty.should.equal(true);
          snapshot.metadata.should.be.an.Object();
          snapshot.query.should.be.an.Object();
        });

        it('DocumentChange has correct properties', async () => {
          const collection = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

          await resetTestCollectionDoc();

          // Test
          let changes;
          let unsubscribe;
          await new Promise(resolve => {
            unsubscribe = collection.onSnapshot(snapshot => {
              changes = snapshot.docChanges;
              resolve();
            });
          });

          // Assertions
          changes.should.be.a.Array();
          changes[0].doc.should.be.an.Object();
          changes[0].newIndex.should.be.a.Number();
          changes[0].oldIndex.should.be.a.Number();
          changes[0].type.should.be.a.String();

          // Tear down
          unsubscribe();
        });

        it('calls callback with the initial data and then when document changes', async () => {
          const callback = sinon.spy();
          const collection = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

          const newDocValue = { ...COL_DOC_1(), foo: 'updated' };

          // Test
          let unsubscribe;
          let resolved = false;
          await new Promise(resolve => {
            unsubscribe = collection.onSnapshot(snapshot => {
              if (snapshot && snapshot.docs.length) {
                callback(snapshot.docs[0].data());
              } else {
                callback(null);
              }

              if (!resolved) {
                resolved = true;
                resolve();
              }
            });
          });

          callback.should.be.calledOnce();

          await firebase
            .firestore()
            .doc(COL_DOC_1_PATH)
            .set(newDocValue);

          await sleep(25);

          // Assertions
          callback.should.be.calledTwice();
          callback.getCall(1).args[0].foo.should.equal('updated');

          // Tear down
          unsubscribe();
        });

        it('calls callback with the initial data and then when document is added', async () => {
          const colDoc = await resetTestCollectionDoc();
          await sleep(50);

          const collectionRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

          const newDocValue = { foo: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            unsubscribe = collectionRef.onSnapshot(snapshot => {
              snapshot.forEach(doc => callback(doc.data()));
              resolve2();
            });
          });

          callback.should.be.calledWith(colDoc);

          const docRef = firebase.firestore().doc(DOC_2_PATH);
          await docRef.set(newDocValue);

          await sleep(25);

          // Assertions

          callback.should.be.calledWith(colDoc);
          callback.should.be.calledWith(newDocValue);
          callback.should.be.calledThrice();

          // Tear down

          unsubscribe();
        });

        it("doesn't call callback when the ref is updated with the same value", async () => {
          const colDoc = await resetTestCollectionDoc();
          await sleep(50);

          const collectionRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            unsubscribe = collectionRef.onSnapshot(snapshot => {
              snapshot.forEach(doc => {
                callback(doc.data());
              });
              resolve2();
            });
          });

          callback.should.be.calledWith(colDoc);

          const docRef = firebase.firestore().doc(COL_DOC_1_PATH);
          await docRef.set(colDoc);

          await sleep(150);

          // Assertions

          callback.should.be.calledOnce(); // Callback is not called again

          // Tear down

          unsubscribe();
        });

        it('allows binding multiple callbacks to the same ref', async () => {
          const colDoc = await resetTestCollectionDoc();
          await sleep(50);

          // Setup
          const collectionRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

          const newDocValue = { ...colDoc, foo: 'updated' };

          const callbackA = sinon.spy();
          const callbackB = sinon.spy();

          // Test
          let unsubscribeA;
          let unsubscribeB;
          await new Promise(resolve2 => {
            unsubscribeA = collectionRef.onSnapshot(snapshot => {
              snapshot.forEach(doc => callbackA(doc.data()));
              resolve2();
            });
          });
          await new Promise(resolve2 => {
            unsubscribeB = collectionRef.onSnapshot(snapshot => {
              snapshot.forEach(doc => callbackB(doc.data()));
              resolve2();
            });
          });

          callbackA.should.be.calledWith(colDoc);
          callbackA.should.be.calledOnce();

          callbackB.should.be.calledWith(colDoc);
          callbackB.should.be.calledOnce();

          const docRef = firebase.firestore().doc(COL_DOC_1_PATH);
          await docRef.set(newDocValue);

          await sleep(25);

          callbackA.should.be.calledWith(newDocValue);
          callbackB.should.be.calledWith(newDocValue);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledTwice();

          // Tear down

          unsubscribeA();
          unsubscribeB();
        });

        it('listener stops listening when unsubscribed', async () => {
          const colDoc = await resetTestCollectionDoc();
          await sleep(50);

          // Setup
          const collectionRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);
          const newDocValue = { ...colDoc, foo: 'updated' };

          const callbackA = sinon.spy();
          const callbackB = sinon.spy();

          // Test
          let unsubscribeA;
          let unsubscribeB;
          await new Promise(resolve2 => {
            unsubscribeA = collectionRef.onSnapshot(snapshot => {
              snapshot.forEach(doc => callbackA(doc.data()));
              resolve2();
            });
          });
          await new Promise(resolve2 => {
            unsubscribeB = collectionRef.onSnapshot(snapshot => {
              snapshot.forEach(doc => callbackB(doc.data()));
              resolve2();
            });
          });

          callbackA.should.be.calledWith(colDoc);
          callbackA.should.be.calledOnce();

          callbackB.should.be.calledWith(colDoc);
          callbackB.should.be.calledOnce();

          const docRef = firebase.firestore().doc(COL_DOC_1_PATH);
          await docRef.set(newDocValue);

          await sleep(25);

          callbackA.should.be.calledWith(newDocValue);
          callbackB.should.be.calledWith(newDocValue);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledTwice();

          // Unsubscribe A

          unsubscribeA();

          await docRef.set(colDoc);

          await sleep(25);

          callbackB.should.be.calledWith(colDoc);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledThrice();

          // Unsubscribe B

          unsubscribeB();

          await docRef.set(newDocValue);

          await sleep(25);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledThrice();
        });

        it('supports options and callback', async () => {
          const colDoc = await resetTestCollectionDoc();
          await sleep(50);

          const collectionRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);
          const newDocValue = { ...colDoc, foo: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            unsubscribe = collectionRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              snapshot => {
                snapshot.forEach(doc => callback(doc.data()));
                resolve2();
              }
            );
          });

          callback.should.be.calledWith(colDoc);

          const docRef = firebase.firestore().doc(COL_DOC_1_PATH);
          await docRef.set(newDocValue);

          await sleep(25);

          // Assertions

          callback.should.be.calledWith(newDocValue);

          // Tear down

          unsubscribe();
        });

        it('supports observer', async () => {
          const colDoc = await resetTestCollectionDoc();
          await sleep(50);

          const collectionRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);
          const newDocValue = { ...colDoc, foo: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            const observer = {
              next: snapshot => {
                snapshot.forEach(doc => callback(doc.data()));
                resolve2();
              },
            };
            unsubscribe = collectionRef.onSnapshot(observer);
          });

          callback.should.be.calledWith(colDoc);

          const docRef = firebase.firestore().doc(COL_DOC_1_PATH);
          await docRef.set(newDocValue);

          await sleep(25);

          // Assertions

          callback.should.be.calledWith(newDocValue);
          callback.should.be.calledTwice();

          // Tear down

          unsubscribe();
        });

        it('supports options and observer', async () => {
          const colDoc = await resetTestCollectionDoc();
          await sleep(50);

          const collectionRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);
          const newDocValue = { ...colDoc, foo: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            const observer = {
              next: snapshot => {
                snapshot.forEach(doc => callback(doc.data()));
                resolve2();
              },
              error: () => {},
            };
            unsubscribe = collectionRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              observer
            );
          });

          callback.should.be.calledWith(colDoc);

          const docRef = firebase.firestore().doc(COL_DOC_1_PATH);
          await docRef.set(newDocValue);

          await sleep(25);

          // Assertions

          callback.should.be.calledWith(newDocValue);

          // Tear down

          unsubscribe();
        });

        it('snapshot error returns instance of SnapshotError', () => {
          let unsubscribe;
          const { reject, resolve, promise } = Promise.defer();
          const collection = firebase.firestore().collection('blocked-collection');

          const observer = {
            next: () => {
              unsubscribe();
              reject(new Error('Did not error!'));
            },
            error: snapshotError => {
              // expect(snapshotError instanceof SnapshotError).toBeTruthy();
              snapshotError.should.be.instanceOf(SnapshotError);
              snapshotError.code.should.be.a.String();
              snapshotError.path.should.be.a.String();
              snapshotError.appName.should.be.a.String();
              snapshotError.message.should.be.a.String();
              snapshotError.nativeErrorMessage.should.be.a.String();
              snapshotError.appName.should.equal('[DEFAULT]');
              snapshotError.path.should.equal('blocked-collection');
              snapshotError.code.should.equal('firestore/permission-denied');
              resolve();
            },
          };

          unsubscribe = collection.onSnapshot(observer);
          return promise;
        });

        it('errors when invalid parameters supplied', async () => {
          const colRef = firebase.firestore().collection(TEST_COLLECTION_NAME_DYNAMIC);

          (() => {
            colRef.onSnapshot(() => {}, 'error');
          }).should.throw('Query.onSnapshot failed: Second argument must be a valid function.');
          (() => {
            colRef.onSnapshot({
              next: () => {},
              error: 'error',
            });
          }).should.throw('Query.onSnapshot failed: Observer.error must be a valid function.');
          (() => {
            colRef.onSnapshot({
              next: 'error',
            });
          }).should.throw('Query.onSnapshot failed: Observer.next must be a valid function.');
          (() => {
            colRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              () => {},
              'error'
            );
          }).should.throw('Query.onSnapshot failed: Third argument must be a valid function.');
          (() => {
            colRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              {
                next: () => {},
                error: 'error',
              }
            );
          }).should.throw('Query.onSnapshot failed: Observer.error must be a valid function.');
          (() => {
            colRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              {
                next: 'error',
              }
            );
          }).should.throw('Query.onSnapshot failed: Observer.next must be a valid function.');
          (() => {
            colRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              'error'
            );
          }).should.throw(
            'Query.onSnapshot failed: Second argument must be a function or observer.'
          );
          (() => {
            colRef.onSnapshot({
              error: 'error',
            });
          }).should.throw(
            'Query.onSnapshot failed: First argument must be a function, observer or options.'
          );
          (() => {
            colRef.onSnapshot();
          }).should.throw('Query.onSnapshot failed: Called with invalid arguments.');
        });
      });
    });
  });
}
