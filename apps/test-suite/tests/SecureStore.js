'use strict';

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const name = 'SecureStore';

export function test({ describe, fail, afterEach, it, expect, jasmine, ...t }) {
  const value = 'value-to-test';
  const longValue =
    'EAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZDEAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZDEAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZDEAAT3TDAdWacBAMjZAq4clOJEOvf8JW5ZAxAsRnZCGRBNb1IRVFrzwiNqsM2I5MyogyPCc78TL1KZAFZAnZAFHeZCjkN8VMytKpcKD4HQEtVZBoAS54WkGbA2STjOe1vV3XOx3BY9OsDpDcD4yTZAv1OcI1wNlVvryiujZBeheVnELK6KTyzUgrPM8zZA42ZAB6SEcZADoj4MNsX5DqrJ3FtG0cxjFCD0lhKfBmTQMrZBCmuefRrQZDZD';
  const key = 'key-to-test';
  const emptyKey = null;
  const emptyValue = null;
  const optionsServiceA = { keychainService: 'service-A' };
  const optionsServiceB = { keychainService: 'service-B' };
  describe(name, () => {
    describe('store -> fetch -> delete -> fetch -> err:', () => {
      it('Sets a value with a key', async () => {
        try {
          const result = await SecureStore.setItemAsync(key, value, {});
          expect(result).toBe(undefined);
        } catch (e) {
          fail(e);
        }
      });
      it('Fetch the value stored with the key', async () => {
        try {
          const fetchedValue = await SecureStore.getItemAsync(key, {});
          expect(fetchedValue).toBe(value);
        } catch (e) {
          fail(e);
        }
      });
      it('Delete the value associated with the key', async () => {
        try {
          const result = await SecureStore.deleteItemAsync(key, {});
          expect(result).toBe(undefined);
        } catch (e) {
          fail(e);
        }
      });
      it('Fetch the previously deleted key, expect null', async () => {
        const fetchedValue = await SecureStore.getItemAsync(key, {});
        expect(fetchedValue).toBe(null);
      });
    });
    describe('store -> fetch -> delete -> fetch -> err with Options:', () => {
      it('Sets a value with a key and keychainService', async () => {
        const result = await SecureStore.setItemAsync(key, value, {
          keychainService: 'service',
        });
        expect(result).toBe(undefined);
      });
      it('Fetch the value stored with the key and keychainService', async () => {
        const fetchedValue = await SecureStore.getItemAsync(key, {
          keychainService: 'service',
        });
        expect(fetchedValue).toBe(value);
      });
      it('Delete the value associated with the key', async () => {
        const result = await SecureStore.deleteItemAsync(key, {
          keychainService: 'service',
        });
        expect(result).toBe(undefined);
      });
      it('Fetch the previously deleted key, expect null', async () => {
        const fetchedValue = await SecureStore.getItemAsync(key, {
          keychainService: 'service',
        });
        expect(fetchedValue).toBe(null);
      });
    });
    describe('store with empty key -> err:', () => {
      it('Sets a value with an empty key, expect error', async () => {
        try {
          const result = await SecureStore.setItemAsync(emptyKey, value, {});
          fail(result);
        } catch (e) {
          expect(e).toBeTruthy();
        }
      });
    });
    describe('store with empty Value -> err:', () => {
      it('Sets an empty value with a key, expect error', async () => {
        try {
          const result = await SecureStore.setItemAsync(key, emptyValue, {});
          fail(result);
        } catch (e) {
          expect(e).toBeTruthy();
        }
      });
    });
    describe('store value with keychainServiceA, fetch with keychainServiceB -> err:', () => {
      it('Sets a value with keychainServiceA', async () => {
        const result = await SecureStore.setItemAsync(key, value, optionsServiceA);
        expect(result).toBe(undefined);
      });
      if (Platform.OS === 'ios') {
        it('Fetch value with keychainServiceB, expect null', async () => {
          const result = await SecureStore.getItemAsync(key, optionsServiceB);
          expect(result).toBe(null);
        });
      } else if (Platform.OS === 'android') {
        it('Fetch value with keychainServiceB, expect decoding error', async () => {
          try {
            const result = await SecureStore.getItemAsync(key, optionsServiceB);
            fail(result);
          } catch (e) {
            expect(e).toBeTruthy();
            expect(e.message).toMatch(`Could not decrypt the item in SecureStore`);
          }
        });
      }
    });
    describe('store long value, fetch long value -> Success:', () => {
      it('Set long value', async () => {
        const result = await SecureStore.setItemAsync(key, longValue);
        expect(result).toBe(undefined);
      });
      it('Fetch long value', async () => {
        const result = await SecureStore.getItemAsync(key);
        expect(result).toBe(longValue);
      });
    });
  });
}
