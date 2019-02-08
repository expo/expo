import firebase from 'expo-firebase-app';

export default function test({
  TestHelpers: {
    database: { setDatabaseContents },
  },
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

        expect(committed, true).toBe('Transaction did not commit.');
        snapshot.val().should.equal(valueBefore + 10);
      });

      it('aborts if undefined returned', async () => {
        const ref = firebase.database().ref('tests/transaction');

        const { committed } = await ref.transaction(() => undefined, true);
        expect(committed, false).toBe('Transaction committed and did not abort.');
      });
    });
  });
}
