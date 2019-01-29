import firebase from 'expo-firebase-app';

export default function test({
  TestHelpers: {
    database: { CONTENTS, setDatabaseContents },
  },
}) {
  describe('database()', () => {
    beforeEach(() => setDatabaseContents());

    describe('ref().once()', () => {
      it('returns a promise', () => {
        const ref = firebase.database().ref('tests/types/number');
        const returnValue = ref.once('value');
        expect(returnValue).toBeInstanceOf(Promise);
      });

      it('resolves with the correct value', async () => {
        await Promise.all(
          Object.keys(CONTENTS.DEFAULT).map(dataRef => {
            const dataTypeValue = CONTENTS.DEFAULT[dataRef];
            const ref = firebase.database().ref(`tests/types/${dataRef}`);
            return ref.once('value').then(snapshot => {
              expect(typeof snapshot.val()).toBe(typeof dataTypeValue);
            });
          })
        );
      });

      it('is NOT called when the value is changed', async () => {
        const callback = jest.fn();
        const ref = firebase.database().ref('tests/types/number');
        ref.once('value').then(callback);
        await ref.set(CONTENTS.NEW.number);
        expect(callback).toHaveBeenCalled();
      });

      it('errors if permission denied', async () => {
        const reference = firebase.database().ref('nope');

        try {
          await reference.once('value');
        } catch (error) {
          expect(error.code.includes('database/permission-denied')).toBeTruthy();
          return true;
        }

        throw new Error('No permission denied error');
      });
    });
  });
}
