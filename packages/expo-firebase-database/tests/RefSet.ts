export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  contextify,
  TestHelpers: {
    database: { setDatabaseContents, CONTENTS },
  },
}) {
  describe('database()', () => {
    beforeEach(() => setDatabaseContents());

    describe('ref.set()', () => {
      it('returns a promise', async () => {
        const ref = firebase.database().ref('tests/types/number');
        const returnValue = ref.set(CONTENTS.DEFAULT.number);
        returnValue.should.be.Promise();

        const value = await returnValue;
        (value == null).should.be.true();
      });

      it('changes value', async () => {
        await Promise.all(
          Object.keys(CONTENTS.DEFAULT).map(async dataRef => {
            const previousValue = contextify(CONTENTS.DEFAULT[dataRef]);

            const ref = firebase.database().ref(`tests/types/${dataRef}`);

            const snapshot = await ref.once('value');
            snapshot.val().should.eql(previousValue);

            const newValue = contextify(CONTENTS.NEW[dataRef]);

            await ref.set(newValue);

            const snapshot2 = await ref.once('value');
            snapshot2.val().should.eql(newValue);
          })
        );
      });

      it('can unset values', async () => {
        await Promise.all(
          Object.keys(CONTENTS.DEFAULT).map(async dataRef => {
            const previousValue = contextify(CONTENTS.DEFAULT[dataRef]);
            const ref = firebase.database().ref(`tests/types/${dataRef}`);

            const snapshot = await ref.once('value');
            snapshot.val().should.eql(previousValue);

            await ref.set(null);
            const snapshot2 = await ref.once('value');
            (snapshot2.val() == null).should.be.true();
          })
        );
      });
    });
  });
}
