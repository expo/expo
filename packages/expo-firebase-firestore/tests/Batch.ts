export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  TestHelpers: {
    firestore: { testDocRef },
  },
  should,
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
        should.equal(ayDoc.exists, false);

        const lDoc = await lRef.get();
        lDoc.data().name.should.equal('London');
        lDoc.data().population.should.equal(3000000);

        const nycDoc = await nycRef.get();
        nycDoc.data().name.should.equal('New York City');
        nycDoc.data().population.should.equal(1000000);

        const sfDoc = await sfRef.get();
        sfDoc.data().name.should.equal('San Fran FieldPath');
        sfDoc.data().nested.firstname.should.equal('First Name');
        sfDoc.data().nested.lastname.should.equal('Last Name');
      });

      it('errors when invalid parameters supplied', async () => {
        const ref = firebase.firestore().doc('collection/doc');
        const batch = firebase.firestore().batch();
        (() => {
          batch.update(ref, 'error');
        }).should.throw(
          'WriteBatch.update failed: If using a single update argument, it must be an object.'
        );
        (() => {
          batch.update(ref, 'error1', 'error2', 'error3');
        }).should.throw(
          'WriteBatch.update failed: The update arguments must be either a single object argument, or equal numbers of key/value pairs.'
        );
        (() => {
          batch.update(ref, 0, 'error');
        }).should.throw(
          'WriteBatch.update failed: Argument at index 0 must be a string or FieldPath'
        );
      });
    });
  });
}
