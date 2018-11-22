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
    database: { CONTENTS, setDatabaseContents },
  },
  should,
}) {
  // TODO use testRunId in refs to prevent multiple test instances interfering with each other
  describe('database()', () => {
    beforeEach(() => setDatabaseContents());
    describe('ref.transaction()', () => {
      it('increments a value', async () => {
        let valueBefore = 1;
        const ref = firebase.database().ref('tests/transaction');

        const { committed, snapshot } = await ref.transaction(currentData => {
          if (currentData === null) {
            return valueBefore + 10;
          }
          valueBefore = currentData;
          return valueBefore + 10;
        }, true);

        should.equal(committed, true, 'Transaction did not commit.');
        snapshot.val().should.equal(valueBefore + 10);
      });

      it('aborts if undefined returned', async () => {
        const ref = firebase.database().ref('tests/transaction');

        const { committed } = await ref.transaction(() => undefined, true);
        should.equal(committed, false, 'Transaction committed and did not abort.');
      });
    });
  });
}
