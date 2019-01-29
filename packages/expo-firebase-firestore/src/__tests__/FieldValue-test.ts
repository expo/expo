export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  should,
  firebase,
  TestHelpers: {
    firestore: { DOC_2, DOC_2_PATH, testCollectionDoc, resetTestCollectionDoc },
  },
}) {
  describe('firestore()', () => {
    describe('FieldValue', async () => {
      await resetTestCollectionDoc(DOC_2_PATH, DOC_2);

      describe('delete()', () => {
        it('should delete a field', async () => {
          const { data } = await testCollectionDoc(DOC_2_PATH).get();
          should.equal(data().title, DOC_2.title);

          await testCollectionDoc(DOC_2_PATH).update({
            title: firebase.firestore.FieldValue.delete(),
          });

          const { data: dataAfterUpdate } = await testCollectionDoc(DOC_2_PATH).get();

          should.equal(dataAfterUpdate().title, undefined);
        });
      });

      describe('serverTimestamp()', () => {
        it('should set timestamp', async () => {
          const { data } = await testCollectionDoc(DOC_2_PATH).get();
          should.equal(data().creationDate, undefined);

          await testCollectionDoc(DOC_2_PATH).update({
            creationDate: firebase.firestore.FieldValue.serverTimestamp(),
          });

          const { data: dataAfterUpdate } = await testCollectionDoc(DOC_2_PATH).get();

          dataAfterUpdate().creationDate.should.be.instanceof(Date);
        });
      });
    });
  });
}
