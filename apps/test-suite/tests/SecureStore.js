'use strict';

import * as SecureStore from 'expo-secure-store';

export const name = 'SecureStore';

export function test(t) {
  const value = 'value-to-test';
  const longValue =
    'EAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZDEAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZDEAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZDEAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZD';
  const key = 'key-to-test';
  const emptyKey = null;
  const emptyValue = null;
  const optionsServiceA = { keychainService: 'service-A' };
  const optionsServiceB = { keychainService: 'service-B' };
  t.describe(name, () => {
    t.describe('store -> fetch -> delete -> fetch -> err:', () => {
      t.it('Sets a value with a key', async () => {
        try {
          const result = await SecureStore.setItemAsync(key, value, {});
          t.expect(result).toBe(undefined);
        } catch (e) {
          t.fail(e);
        }
      });
      t.it('Fetch the value stored with the key', async () => {
        try {
          const fetchedValue = await SecureStore.getItemAsync(key, {});
          t.expect(fetchedValue).toBe(value);
        } catch (e) {
          t.fail(e);
        }
      });
      t.it('Delete the value associated with the key', async () => {
        try {
          const result = await SecureStore.deleteItemAsync(key, {});
          t.expect(result).toBe(undefined);
        } catch (e) {
          t.fail(e);
        }
      });
      t.it('Fetch the previously deleted key, expect null', async () => {
        const fetchedValue = await SecureStore.getItemAsync(key, {});
        t.expect(fetchedValue).toBe(null);
      });
    });
    t.describe('store -> fetch -> delete -> fetch -> err with Options:', () => {
      t.it('Sets a value with a key and keychainService', async () => {
        const result = await SecureStore.setItemAsync(key, value, {
          keychainService: 'service',
        });
        t.expect(result).toBe(undefined);
      });
      t.it('Fetch the value stored with the key and keychainService', async () => {
        const fetchedValue = await SecureStore.getItemAsync(key, {
          keychainService: 'service',
        });
        t.expect(fetchedValue).toBe(value);
      });
      t.it('Delete the value associated with the key', async () => {
        const result = await SecureStore.deleteItemAsync(key, {
          keychainService: 'service',
        });
        t.expect(result).toBe(undefined);
      });
      t.it('Fetch the previously deleted key, expect null', async () => {
        const fetchedValue = await SecureStore.getItemAsync(key, {
          keychainService: 'service',
        });
        t.expect(fetchedValue).toBe(null);
      });
    });
    // This test only checks if the function works correctly with the current biometric enrollment of the device.
    // It's not possible to test the function fully without changing the security settings of the device.
    t.describe(
      'canUseBiometricAuthentication correctly indicates if a value can be saved with authentication',
      () => {
        const canSave = SecureStore.canUseBiometricAuthentication();
        t.it('canUseBiometricAuthentication returns a boolean', async () => {
          t.expect(typeof canSave).toBe('boolean');
        });
        const testDescription = `canUseBiometricAuthentication is ${canSave} -> saving the value should ${
          canSave ? 'succeed' : 'fail'
        }`;
        t.it(testDescription, async () => {
          try {
            try {
              await SecureStore.setItemAsync(key, value, {
                keychainService: 'service',
                requireAuthentication: true,
              });
              if (!canSave) {
                t.fail('Expected SecureStore.setItemAsync to throw an error');
              }
            } catch {
              if (canSave) {
                t.fail('Expected SecureStore.setItemAsync to succeed');
              }
            }
          } catch (e) {
            t.fail(e);
          }
        });
      }
    );
    t.describe('store with empty key -> err:', () => {
      t.it('Sets a value with an empty key, expect error', async () => {
        try {
          const result = await SecureStore.setItemAsync(emptyKey, value, {});
          t.fail(result);
        } catch (e) {
          t.expect(e).toBeTruthy();
        }
      });
    });
    t.describe('store with empty Value -> err:', () => {
      t.it('Sets an empty value with a key, expect error', async () => {
        try {
          const result = await SecureStore.setItemAsync(key, emptyValue, {});
          t.fail(result);
        } catch (e) {
          t.expect(e).toBeTruthy();
        }
      });
    });
    t.describe('store value with keychainServiceA, fetch with keychainServiceB -> err:', () => {
      t.it('Sets a value with keychainServiceA', async () => {
        const result = await SecureStore.setItemAsync(key, value, optionsServiceA);
        t.expect(result).toBe(undefined);
      });
      t.it('Fetch value with keychainServiceB, expect null', async () => {
        const result = await SecureStore.getItemAsync(key, optionsServiceB);
        t.expect(result).toBe(null);
      });
    });
    t.describe('store long value, fetch long value -> Success:', () => {
      t.it('Set long value', async () => {
        const result = await SecureStore.setItemAsync(key, longValue);
        t.expect(result).toBe(undefined);
      });
      if (!global.DETOX) {
        t.it('Fetch long value', async () => {
          const result = await SecureStore.getItemAsync(key);
          t.expect(result).toBe(longValue);
        });
      }
    });
  });
}
