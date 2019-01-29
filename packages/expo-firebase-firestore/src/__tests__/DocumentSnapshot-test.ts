import { DocumentReference } from 'expo-firebase-firestore';
import firebase from 'expo-firebase-app';

import { Platform } from 'expo-core';

const { OS } = Platform;

export default function test({
  should,
  TestHelpers: {
    firestore: {
      COL_DOC_1,
      COL_DOC_1_ID,
      COL_DOC_1_PATH,
      testCollectionDoc,
      resetTestCollectionDoc,
    },
  },
}) {
  describe('firestore()', () => {
    describe('DocumentSnapshot', async () => {
      await resetTestCollectionDoc(COL_DOC_1_PATH, COL_DOC_1());

      describe('id', () => {
        it('returns a string document id', async () => {
          const snapshot = await testCollectionDoc(COL_DOC_1_PATH).get();
          snapshot.id.should.be.a.String();
          snapshot.id.should.equal(COL_DOC_1_ID);
        });
      });

      describe('ref', () => {
        it('returns a DocumentReference', async () => {
          const snapshot = await testCollectionDoc(COL_DOC_1_PATH).get();
          snapshot.ref.should.be.an.instanceOf(DocumentReference);
        });
      });

      describe('metadata', () => {
        it('returns an object of meta data', async () => {
          const { metadata } = await testCollectionDoc(COL_DOC_1_PATH).get();
          metadata.should.be.an.Object();
          metadata.should.have.property('hasPendingWrites');
          metadata.should.have.property('fromCache');
          metadata.hasPendingWrites.should.be.a.Boolean();
          metadata.fromCache.should.be.a.Boolean();
        });
      });

      describe('exists', () => {
        it('returns a boolean', async () => {
          const { exists } = await testCollectionDoc(COL_DOC_1_PATH).get();
          exists.should.be.a.Boolean();
          exists.should.be.true();
        });
      });

      describe('data()', () => {
        it('returns document data', async () => {
          // additionally tests context binding not lost during destructuring
          const snapshot = await testCollectionDoc(COL_DOC_1_PATH).get();
          const { data } = snapshot;

          snapshot.data.should.be.a.Function();
          data.should.be.a.Function();

          snapshot.data().should.be.a.Object();
          data().should.be.a.Object();

          snapshot.data().baz.should.be.true();
          data().baz.should.be.true();
        });
      });

      describe('get()', () => {
        it('using a dot notated path string', async () => {
          // additionally tests context binding not lost during destructuring
          const snapshot = await testCollectionDoc(COL_DOC_1_PATH).get();
          const { get } = snapshot;

          expect(snapshot.get('foo')).toBe('bar');
          expect(get('foo')).toBe('bar');

          expect(snapshot.get('object.daz')).toBe(123);
          expect(get('object.daz')).toBe(123);

          expect(snapshot.get('nonexistent.object')).toBe(undefined);
          expect(get('nonexistent.object')).toBe(undefined);
        });

        it('using a FieldPath instance', async () => {
          const snapshot = await testCollectionDoc(COL_DOC_1_PATH).get();

          expect(snapshot.get('foo')).toBe('bar');

          expect(snapshot.get(new firebase.firestore.FieldPath('foo'))).toBe('bar');

          expect(snapshot.get(new firebase.firestore.FieldPath('object', 'daz'))).toBe(123);

          should.equal(
            snapshot.get(new firebase.firestore.FieldPath('nonexistent', 'object')),
            undefined
          );
        });
      });
    });
  });
}
