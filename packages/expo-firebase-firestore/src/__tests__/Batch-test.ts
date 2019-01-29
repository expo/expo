import firebase from 'expo-firebase-app';

export default function test({
  TestHelpers: {
    firestore: { testDocRef },
  },
}) {
  describe('firestore()', () => {
    describe('batch()', () => {
      it('should create / update / delete', async () => {
        const ayRef = testDocRef('AY');
        const lRef = testDocRef('LON');
        const nycRef = testDocRef('NYC');
        const sfRef = testDocRef('SF');
        const batch = firebase.firestore().batch();

        batch.set(ayRef, { name: 'Aylesbury' });
        batch.set(lRef, { name: 'London' });
        batch.set(nycRef, { name: 'New York City' });
        batch.set(sfRef, { name: 'San Francisco' });

        batch.update(nycRef, { population: 1000000 });
        batch.update(sfRef, 'name', 'San Fran');
        batch.update(sfRef, new firebase.firestore.FieldPath('name'), 'San Fran FieldPath');
        batch.update(sfRef, new firebase.firestore.FieldPath('nested', 'name'), 'Nested Nme');
        batch.update(
          sfRef,
          new firebase.firestore.FieldPath('nested', 'firstname'),
          'First Name',
          new firebase.firestore.FieldPath('nested', 'lastname'),
          'Last Name'
        );

        batch.set(lRef, { population: 3000000 }, { merge: true });
        batch.delete(ayRef);

        await batch.commit();

        const ayDoc = await ayRef.get();
        expect(ayDoc.exists).toBe(false);

        const lDoc = await lRef.get();
        expect(lDoc.data().name).toBe('London');
        expect(lDoc.data().population).toBe(3000000);

        const nycDoc = await nycRef.get();
        expect(nycDoc.data().name).toBe('New York City');
        expect(nycDoc.data().population).toBe(1000000);

        const sfDoc = await sfRef.get();
        expect(sfDoc.data().name).toBe('San Fran FieldPath');
        expect(sfDoc.data().nested.firstname).toBe('First Name');
        expect(sfDoc.data().nested.lastname).toBe('Last Name');
      });

      it('errors when invalid parameters supplied', async () => {
        const ref = firebase.firestore().doc('collection/doc');
        const batch = firebase.firestore().batch();
        expect(batch.update(ref, 'error')).toThrow(
          'WriteBatch.update failed: If using a single update argument, it must be an object.'
        );
        expect(batch.update(ref, 'error1', 'error2', 'error3')).toThrow(
          'WriteBatch.update failed: The update arguments must be either a single object argument, or equal numbers of key/value pairs.'
        );
        expect(batch.update(ref, 0, 'error')).toThrow(
          'WriteBatch.update failed: Argument at index 0 must be a string or FieldPath'
        );
      });
    });
  });
}
