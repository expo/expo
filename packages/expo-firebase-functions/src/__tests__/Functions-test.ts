import firebase from 'expo-firebase-app';

export default function test({
  TestHelpers: {
    functions: { data: TEST_DATA },
  },
  should,
}) {
  describe('functions()', () => {
    describe('httpsCallable(fnName)(args)', () => {
      it('accepts primitive args: undefined', async () => {
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const response = await functionRunner();
        expect(response.data).toBe('null');
      });

      it('accepts primitive args: string', async () => {
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const response = await functionRunner('hello');
        expect(response.data).toBe('string');
      });

      it('accepts primitive args: number', async () => {
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const response = await functionRunner(123);
        expect(response.data).toBe('number');
      });

      it('accepts primitive args: boolean', async () => {
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const response = await functionRunner(true);
        expect(response.data).toBe('boolean');
      });

      it('accepts primitive args: null', async () => {
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const response = await functionRunner(null);
        expect(response.data).toBe('null');
      });

      it('accepts array args', async () => {
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const response = await functionRunner([1, 2, 3, 4]);
        expect(response.data).toBeInstanceOf(Array);
      });

      it('accepts object args', async () => {
        const type = 'simpleObject';
        const inputData = TEST_DATA[type];
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const { data: outputData } = await functionRunner({
          type,
          inputData,
        });
        should.deepEqual(outputData, inputData);
      });

      it('accepts complex nested objects', async () => {
        const type = 'advancedObject';
        const inputData = TEST_DATA[type];
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const { data: outputData } = await functionRunner({
          type,
          inputData,
        });
        should.deepEqual(outputData, inputData);
      });

      it('accepts complex nested arrays', async () => {
        const type = 'advancedArray';
        const inputData = TEST_DATA[type];
        const functionRunner = firebase.functions().httpsCallable('runTest');
        const { data: outputData } = await functionRunner({
          type,
          inputData,
        });
        should.deepEqual(outputData, inputData);
      });
    });

    describe('HttpsError', () => {
      it('errors return instance of HttpsError', async () => {
        const functionRunner = firebase.functions().httpsCallable('runTest');
        try {
          await functionRunner({});
          return Promise.reject(new Error('Function did not reject with error.'));
        } catch (e) {
          expect(e.details).toBe(null);
          expect(e.code).toBe('invalid-argument');
          expect(e.message).toBe('Invalid test requested.');
        }

        return Promise.resolve();
      });

      it('HttpsError.details -> allows returning complex data', async () => {
        let type = 'advancedObject';
        let inputData = TEST_DATA[type];
        const functionRunner = firebase.functions().httpsCallable('runTest');
        try {
          await functionRunner({
            type,
            inputData,
            asError: true,
          });
          return Promise.reject(new Error('Function did not reject with error.'));
        } catch (e) {
          should.deepEqual(e.details, inputData);
          expect(e.code).toBe('cancelled');
          expect(e.message).toBe(
            'Response data was requested to be sent as part of an Error payload, so here we are!'
          );
        }

        type = 'advancedArray';
        inputData = TEST_DATA[type];
        try {
          await functionRunner({
            type,
            inputData,
            asError: true,
          });
          return Promise.reject(new Error('Function did not reject with error.'));
        } catch (e) {
          should.deepEqual(e.details, inputData);
          expect(e.code).toBe('cancelled');
          expect(e.message).toBe(
            'Response data was requested to be sent as part of an Error payload, so here we are!'
          );
        }

        return Promise.resolve();
      });

      it('HttpsError.details -> allows returning primitives', async () => {
        let type = 'number';
        let inputData = TEST_DATA[type];
        const functionRunner = firebase.functions().httpsCallable('runTest');
        try {
          await functionRunner({
            type,
            inputData,
            asError: true,
          });
          return Promise.reject(new Error('Function did not reject with error.'));
        } catch (e) {
          expect(e.code).toBe('cancelled');
          expect(e.message).toBe(
            'Response data was requested to be sent as part of an Error payload, so here we are!'
          );
          should.deepEqual(e.details, inputData);
        }

        type = 'string';
        inputData = TEST_DATA[type];
        try {
          await functionRunner({
            type,
            inputData,
            asError: true,
          });
          return Promise.reject(new Error('Function did not reject with error.'));
        } catch (e) {
          should.deepEqual(e.details, inputData);
          expect(e.code).toBe('cancelled');
          expect(e.message).toBe(
            'Response data was requested to be sent as part of an Error payload, so here we are!'
          );
        }

        type = 'boolean';
        inputData = TEST_DATA[type];
        try {
          await functionRunner({
            type,
            inputData,
            asError: true,
          });
          return Promise.reject(new Error('Function did not reject with error.'));
        } catch (e) {
          should.deepEqual(e.details, inputData);
          expect(e.code).toBe('cancelled');
          expect(e.message).toBe(
            'Response data was requested to be sent as part of an Error payload, so here we are!'
          );
        }

        type = 'null';
        inputData = TEST_DATA[type];
        try {
          await functionRunner({
            type,
            inputData,
            asError: true,
          });
          return Promise.reject(new Error('Function did not reject with error.'));
        } catch (e) {
          should.deepEqual(e.details, inputData);
          expect(e.code).toBe('cancelled');
          expect(e.message).toBe(
            'Response data was requested to be sent as part of an Error payload, so here we are!'
          );
        }

        return Promise.resolve();
      });
    });
  });
}
