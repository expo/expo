import firebase from 'expo-firebase-app';

export default function test({
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
        expect(returnValue).toBeInstanceOf(Promise);

        const value = await returnValue;
        expect(value == null).toBe(true);
      });

      it('changes value', async () => {
        await Promise.all(
          Object.keys(CONTENTS.DEFAULT).map(async dataRef => {
            const previousValue = contextify(CONTENTS.DEFAULT[dataRef]);

            const ref = firebase.database().ref(`tests/types/${dataRef}`);

            const snapshot = await ref.once('value');
            expect(snapshot.val()).toBe(previousValue);

            const newValue = contextify(CONTENTS.NEW[dataRef]);

            await ref.set(newValue);

            const snapshot2 = await ref.once('value');
            expect(snapshot2.val()).toBe(newValue);
          })
        );
      });

      it('can unset values', async () => {
        await Promise.all(
          Object.keys(CONTENTS.DEFAULT).map(async dataRef => {
            const previousValue = contextify(CONTENTS.DEFAULT[dataRef]);
            const ref = firebase.database().ref(`tests/types/${dataRef}`);

            const snapshot = await ref.once('value');
            expect(snapshot.val()).toBe(previousValue);

            await ref.set(null);
            const snapshot2 = await ref.once('value');
            expect(snapshot2.val() == null).toBe(true);
          })
        );
      });
    });
  });
}
