import { SnapshotError } from 'expo-firebase-firestore';

export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  should,
  sinon,
  helpers: { sleep },
  TestHelpers: {
    firestore: {
      test2DocRef,
      COL2_DOC_1,
      COL2_DOC_1_ID,
      cleanCollection,
      COL2_DOC_1_PATH,
      resetTestCollectionDoc,
      TEST_COLLECTION_NAME_DYNAMIC,
    },
  },
}) {
  describe('firestore()', () => {
    describe('DocumentReference', async () => {
      await resetTestCollectionDoc(COL2_DOC_1_PATH, COL2_DOC_1());

      describe('class', () => {
        it('should return instance methods', () => {
          const document = test2DocRef(COL2_DOC_1_ID);
          document.should.have.property('firestore');
          // TODO: Remaining checks
        });
      });

      describe('id', () => {
        it('should return document id', () => {
          const document = test2DocRef(COL2_DOC_1_ID);
          document.id.should.equal(COL2_DOC_1_ID);
        });
      });

      describe('parent', () => {
        it('should return parent collection', () => {
          const document = test2DocRef(COL2_DOC_1_ID);
          document.parent.id.should.equal(TEST_COLLECTION_NAME_DYNAMIC);
        });
      });

      describe('collection()', () => {
        it('should return a child collection', () => {
          const document = test2DocRef(COL2_DOC_1_ID);
          const collection = document.collection('pages');
          collection.id.should.equal('pages');
        });

        it('should error if invalid collection path supplied', () => {
          (() => {
            test2DocRef(COL2_DOC_1_ID).collection('pages/page1');
          }).should.throw('Argument "collectionPath" must point to a collection.');
        });
      });

      describe('delete()', () => {
        it('should delete Document', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, COL2_DOC_1());
          await test2DocRef(COL2_DOC_1_ID).delete();
          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          should.equal(doc.exists, false);
        });
      });

      describe('get()', () => {
        it('DocumentSnapshot should have correct properties', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, COL2_DOC_1());
          const snapshot = await test2DocRef(COL2_DOC_1_ID).get();
          snapshot.id.should.equal(COL2_DOC_1_ID);
          snapshot.metadata.should.be.an.Object();
        });

        it('should support GetOptions source=`default`', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, COL2_DOC_1());
          const snapshot = await test2DocRef(COL2_DOC_1_ID).get({
            source: 'default',
          });
          snapshot.id.should.equal(COL2_DOC_1_ID);
          snapshot.metadata.should.be.an.Object();
          should.equal(snapshot.metadata.fromCache, false);
        });

        it('should support GetOptions source=`server`', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, COL2_DOC_1());
          const snapshot = await test2DocRef(COL2_DOC_1_ID).get({
            source: 'server',
          });
          snapshot.id.should.equal(COL2_DOC_1_ID);
          snapshot.metadata.should.be.an.Object();
          should.equal(snapshot.metadata.fromCache, false);
        });

        // TODO: For some reason when using `cache` it's not seeing the data as available, even if
        // first requesting it from the server, although interestingly it works fine in the old
        // tests app
        xit('should support GetOptions source=`cache`', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, COL2_DOC_1());
          const ref = test2DocRef(COL2_DOC_1_ID);
          // Make sure the reference data is populated in the cache
          await ref.get({ source: 'server' });
          // Retrieve the cached version
          const snapshot = await ref.get({ source: 'cache' });
          snapshot.id.should.equal(COL2_DOC_1_ID);
          snapshot.metadata.should.be.an.Object();
          should.equal(snapshot.metadata.fromCache, true);
        });

        it('should error with invalid GetOptions source option', async () => {
          const docRef = test2DocRef(COL2_DOC_1_ID);
          try {
            await docRef.get(() => {});
            return Promise.reject(new Error('get() did not reject with invalid argument.'));
          } catch (e) {
            // do nothing
          }
          try {
            await docRef.get({ source: 'invalid' });
            return Promise.reject(new Error('get() did not reject with invalid source property.'));
          } catch (e) {
            // do nothing
          }
          return Promise.resolve();
        });
      });

      describe('onSnapshot()', () => {
        beforeEach(async () => {
          await sleep(50);
          await cleanCollection(TEST_COLLECTION_NAME_DYNAMIC);
          await sleep(50);
        });

        it('snapshot error returns instance of SnapshotError', () => {
          let unsubscribe;
          const { reject, resolve, promise } = Promise.defer();
          const collection = firebase.firestore().doc('blocked-collection/nope');

          const observer = {
            next: () => {
              unsubscribe();
              reject(new Error('Did not error!'));
            },
            error: snapshotError => {
              snapshotError.should.be.instanceOf(SnapshotError);
              snapshotError.code.should.be.a.String();
              snapshotError.path.should.be.a.String();
              snapshotError.appName.should.be.a.String();
              snapshotError.message.should.be.a.String();
              snapshotError.nativeErrorMessage.should.be.a.String();
              snapshotError.appName.should.equal('[DEFAULT]');
              snapshotError.path.should.equal('blocked-collection/nope');
              snapshotError.code.should.equal('firestore/permission-denied');
              resolve();
            },
          };

          unsubscribe = collection.onSnapshot(observer);
          return promise;
        });

        it('calls callback with the initial data and then when value changes', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });
          const docRef = test2DocRef(COL2_DOC_1_ID);
          const currentDataValue = { name: 'doc1' };
          const newDataValue = { name: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            unsubscribe = docRef.onSnapshot(snapshot => {
              callback(snapshot.data());
              resolve2();
            });
          });

          callback.should.be.calledWith(currentDataValue);

          // Update the document

          await docRef.set(newDataValue);

          await sleep(50);

          // Assertions

          callback.should.be.calledWith(newDataValue);
          callback.should.be.calledTwice();

          // Tear down

          unsubscribe();
        });

        it("doesn't call callback when the ref is updated with the same value", async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });
          const docRef = test2DocRef(COL2_DOC_1_ID);
          const currentDataValue = { name: 'doc1' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            unsubscribe = docRef.onSnapshot(snapshot => {
              callback(snapshot.data());
              resolve2();
            });
          });

          callback.should.be.calledWith(currentDataValue);

          await docRef.set(currentDataValue);

          await sleep(50);

          // Assertions

          callback.should.be.calledOnce(); // Callback is not called again

          // Tear down

          unsubscribe();
        });

        it('allows binding multiple callbacks to the same ref', async () => {
          // Setup
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });
          const docRef = test2DocRef(COL2_DOC_1_ID);
          const currentDataValue = { name: 'doc1' };
          const newDataValue = { name: 'updated' };

          const callbackA = sinon.spy();
          const callbackB = sinon.spy();

          // Test
          let unsubscribeA;
          let unsubscribeB;
          await new Promise(resolve2 => {
            unsubscribeA = docRef.onSnapshot(snapshot => {
              callbackA(snapshot.data());
              resolve2();
            });
          });

          await new Promise(resolve2 => {
            unsubscribeB = docRef.onSnapshot(snapshot => {
              callbackB(snapshot.data());
              resolve2();
            });
          });

          callbackA.should.be.calledWith(currentDataValue);
          callbackA.should.be.calledOnce();

          callbackB.should.be.calledWith(currentDataValue);
          callbackB.should.be.calledOnce();

          await docRef.set(newDataValue);

          await sleep(50);

          callbackA.should.be.calledWith(newDataValue);
          callbackB.should.be.calledWith(newDataValue);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledTwice();

          // Tear down

          unsubscribeA();
          unsubscribeB();
        });

        // TODO Flakey
        xit('listener stops listening when unsubscribed', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });

          // Setup
          const docRef = test2DocRef(COL2_DOC_1_ID);
          const currentDataValue = { name: 'doc1' };
          const newDataValue = { name: 'updated' };

          const callbackA = sinon.spy();
          const callbackB = sinon.spy();

          // Test
          let unsubscribeA;
          let unsubscribeB;
          await new Promise(resolve2 => {
            unsubscribeA = docRef.onSnapshot(snapshot => {
              callbackA(snapshot.data());
              resolve2();
            });
          });

          await new Promise(resolve2 => {
            unsubscribeB = docRef.onSnapshot(snapshot => {
              callbackB(snapshot.data());
              resolve2();
            });
          });

          callbackA.should.be.calledWith(currentDataValue);
          callbackA.should.be.calledOnce();

          callbackB.should.be.calledWith(currentDataValue);
          callbackB.should.be.calledOnce();

          await docRef.set(newDataValue);

          await sleep(50);

          callbackA.should.be.calledWith(newDataValue);
          callbackB.should.be.calledWith(newDataValue);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledTwice();

          // Unsubscribe A

          unsubscribeA();

          await docRef.set(currentDataValue);

          await sleep(50);

          callbackB.should.be.calledWith(currentDataValue);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledThrice();

          // Unsubscribe B

          unsubscribeB();

          await docRef.set(newDataValue);

          await sleep(50);

          callbackA.should.be.calledTwice();
          callbackB.should.be.calledThrice();
        });

        it('supports options and callbacks', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });
          const docRef = test2DocRef(COL2_DOC_1_ID);
          const currentDataValue = { name: 'doc1' };
          const newDataValue = { name: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            unsubscribe = docRef.onSnapshot({ includeMetadataChanges: true }, snapshot => {
              callback(snapshot.data());
              resolve2();
            });
          });

          callback.should.be.calledWith(currentDataValue);

          // Update the document

          await docRef.set(newDataValue);

          await sleep(50);

          // Assertions

          callback.should.be.calledWith(newDataValue);

          // Tear down

          unsubscribe();
        });

        it('supports observer', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });
          const docRef = test2DocRef(COL2_DOC_1_ID);
          const currentDataValue = { name: 'doc1' };
          const newDataValue = { name: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            const observer = {
              next: snapshot => {
                callback(snapshot.data());
                resolve2();
              },
            };
            unsubscribe = docRef.onSnapshot(observer);
          });

          callback.should.be.calledWith(currentDataValue);

          // Update the document

          await docRef.set(newDataValue);

          await sleep(50);

          // Assertions

          callback.should.be.calledWith(newDataValue);
          callback.should.be.calledTwice();

          // Tear down

          unsubscribe();
        });

        it('supports options and observer', async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });
          const docRef = test2DocRef(COL2_DOC_1_ID);
          const currentDataValue = { name: 'doc1' };
          const newDataValue = { name: 'updated' };

          const callback = sinon.spy();

          // Test

          let unsubscribe;
          await new Promise(resolve2 => {
            const observer = {
              next: snapshot => {
                callback(snapshot.data());
                resolve2();
              },
              error: () => {},
            };
            unsubscribe = docRef.onSnapshot({ includeMetadataChanges: true }, observer);
          });

          callback.should.be.calledWith(currentDataValue);

          // Update the document

          await docRef.set(newDataValue);

          await sleep(50);

          // Assertions

          callback.should.be.calledWith(newDataValue);

          // Tear down

          unsubscribe();
        });

        it('errors when invalid parameters supplied', async () => {
          const docRef = test2DocRef(COL2_DOC_1_ID);
          (() => {
            docRef.onSnapshot(() => {}, 'error');
          }).should.throw(
            'DocumentReference.onSnapshot failed: Second argument must be a valid function.'
          );
          (() => {
            docRef.onSnapshot({
              next: () => {},
              error: 'error',
            });
          }).should.throw(
            'DocumentReference.onSnapshot failed: Observer.error must be a valid function.'
          );
          (() => {
            docRef.onSnapshot({
              next: 'error',
            });
          }).should.throw(
            'DocumentReference.onSnapshot failed: Observer.next must be a valid function.'
          );
          (() => {
            docRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              () => {},
              'error'
            );
          }).should.throw(
            'DocumentReference.onSnapshot failed: Third argument must be a valid function.'
          );
          (() => {
            docRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              {
                next: () => {},
                error: 'error',
              }
            );
          }).should.throw(
            'DocumentReference.onSnapshot failed: Observer.error must be a valid function.'
          );
          (() => {
            docRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              {
                next: 'error',
              }
            );
          }).should.throw(
            'DocumentReference.onSnapshot failed: Observer.next must be a valid function.'
          );
          (() => {
            docRef.onSnapshot(
              {
                includeMetadataChanges: true,
              },
              'error'
            );
          }).should.throw(
            'DocumentReference.onSnapshot failed: Second argument must be a function or observer.'
          );
          (() => {
            docRef.onSnapshot({
              error: 'error',
            });
          }).should.throw(
            'DocumentReference.onSnapshot failed: First argument must be a function, observer or options.'
          );
          (() => {
            docRef.onSnapshot();
          }).should.throw('DocumentReference.onSnapshot failed: Called with invalid arguments.');
        });
      });

      describe('set()', async () => {
        await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });

        it('should create Document', async () => {
          await test2DocRef('doc2').set({ name: 'doc2', testArray: [] });
          const doc = await test2DocRef('doc2').get();
          doc.data().name.should.equal('doc2');
        });

        it('should merge Document', async () => {
          await test2DocRef(COL2_DOC_1_ID).set({ merge: 'merge' }, { merge: true });

          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          doc.data().name.should.equal('doc1');
          doc.data().merge.should.equal('merge');
        });

        it('should overwrite Document', async () => {
          await test2DocRef(COL2_DOC_1_ID).set({ name: 'overwritten' });
          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          doc.data().name.should.equal('overwritten');
        });
      });

      describe('update()', () => {
        beforeEach(async () => {
          await resetTestCollectionDoc(COL2_DOC_1_PATH, { name: 'doc1' });
        });

        it('should update Document using object', async () => {
          await test2DocRef(COL2_DOC_1_ID).update({ name: 'updated' });
          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          doc.data().name.should.equal('updated');
        });

        it('should update Document using key/value pairs', async () => {
          await test2DocRef(COL2_DOC_1_ID).update('name', 'updated');
          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          doc.data().name.should.equal('updated');
        });

        it('should update Document using FieldPath/value pair', async () => {
          await test2DocRef(COL2_DOC_1_ID).update(new firebase.firestore.FieldPath('name'), 'Name');
          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          doc.data().name.should.equal('Name');
        });

        it('should update Document using nested FieldPath and value pair', async () => {
          await test2DocRef(COL2_DOC_1_ID).update(
            new firebase.firestore.FieldPath('nested', 'name'),
            'Nested Name'
          );
          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          doc.data().nested.name.should.equal('Nested Name');
        });

        it('should update Document using multiple FieldPath/value pairs', async () => {
          await test2DocRef(COL2_DOC_1_ID).update(
            new firebase.firestore.FieldPath('nested', 'firstname'),
            'First Name',
            new firebase.firestore.FieldPath('nested', 'lastname'),
            'Last Name'
          );
          const doc = await test2DocRef(COL2_DOC_1_ID).get();
          doc.data().nested.firstname.should.equal('First Name');
          doc.data().nested.lastname.should.equal('Last Name');
        });

        it('errors when invalid parameters supplied', async () => {
          const docRef = test2DocRef(COL2_DOC_1_ID);
          (() => {
            docRef.update('error');
          }).should.throw(
            'DocumentReference.update failed: If using a single update argument, it must be an object.'
          );
          (() => {
            docRef.update('error1', 'error2', 'error3');
          }).should.throw(
            'DocumentReference.update failed: The update arguments must be either a single object argument, or equal numbers of key/value pairs.'
          );
          (() => {
            docRef.update(0, 'error');
          }).should.throw(
            'DocumentReference.update failed: Argument at index 0 must be a string or FieldPath'
          );
        });
      });

      describe('types', () => {
        it('should handle Boolean field', async () => {
          const docRef = test2DocRef('reference');
          await docRef.set({
            field: true,
          });

          const doc = await docRef.get();
          should.equal(doc.data().field, true);
        });

        it('should handle Date field', async () => {
          const date = new Date();
          const docRef = test2DocRef('reference');
          await docRef.set({
            field: date,
          });

          const doc = await docRef.get();
          doc.data().field.should.be.instanceof(Date);
          should.equal(doc.data().field.toISOString(), date.toISOString());
          should.equal(doc.data().field.getTime(), date.getTime());
        });

        it('should handle DocumentReference field', async () => {
          const docRef = test2DocRef('reference');
          await docRef.set({
            field: firebase.firestore().doc('test/field'),
          });

          const doc = await docRef.get();
          should.equal(doc.data().field.path, 'test/field');
        });

        it('should handle GeoPoint field', async () => {
          const docRef = test2DocRef('reference');
          await docRef.set({
            field: new firebase.firestore.GeoPoint(1.01, 1.02),
          });

          const doc = await docRef.get();
          should.equal(doc.data().field.latitude, 1.01);
          should.equal(doc.data().field.longitude, 1.02);
        });
      });
    });
  });
}
