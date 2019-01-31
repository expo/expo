import firebase from 'expo-firebase-app';

import { Platform } from 'expo-core';

const { OS } = Platform;

export default function test({
  should,
  TestHelpers: {
    firestore: { COL_DOC_1, COL_DOC_1_PATH, testCollectionDoc, resetTestCollectionDoc },
  },
}) {
  describe('firestore()', () => {
    describe('FieldPath', async () => {
      await resetTestCollectionDoc(COL_DOC_1_PATH, COL_DOC_1());

      it('documentId() should return a FieldPath', () => {
        const documentId = firebase.firestore.FieldPath.documentId();
        documentId.should.be.instanceof(firebase.firestore.FieldPath);
      });

      it('should allow getting values via documentSnapshot.get(FieldPath)', async () => {
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
}
