/* eslint-disable no-global-assign */
import { type ExpoFormData } from '../FormData';

const { installFormDataPatch } = jest.requireActual('../FormData');
const jestFormDataPolyfill = FormData;

beforeAll(() => {
  FormData = installFormDataPatch(require('react-native/Libraries/Network/FormData'));
});

afterAll(() => {
  FormData = jestFormDataPolyfill;
});

describe('FormData', () => {
  it(`asserts min arguments`, () => {
    const a = new FormData();
    expect(() =>
      // @ts-expect-error: Testing invalid usage
      a.set(0)
    ).toThrow("Failed to execute 'set' on 'FormData': 2 arguments required, but only 1 present.");
    expect(() =>
      // @ts-expect-error: Testing invalid usage
      a.has()
    ).toThrow("Failed to execute 'has' on 'FormData': 1 argument required, but only 0 present.");
    expect(() =>
      // @ts-expect-error: Testing invalid usage
      a.get()
    ).toThrow("Failed to execute 'get' on 'FormData': 1 argument required, but only 0 present.");
    expect(() =>
      // @ts-expect-error: Testing invalid usage
      a.delete()
    ).toThrow("Failed to execute 'delete' on 'FormData': 1 argument required, but only 0 present.");
    expect(() =>
      // @ts-expect-error: Testing invalid usage
      a.forEach()
    ).toThrow(
      "Failed to execute 'forEach' on 'FormData': 1 argument required, but only 0 present."
    );
  });

  describe('setters', () => {
    it(`supports set`, () => {
      const a = new FormData();
      a.append('a', 'b');
      a.set('a', 'd');

      expect(a.get('a')).toBe('d');
      a.delete('a');
      expect(a.get('a')).toBe(null);
    });

    it(`supports react-native local uri`, () => {
      const a = new FormData() as ExpoFormData;
      a.append('a', { uri: 'file:///path/to/test.jpg', type: 'image/jpeg', name: 'test.jpg' });
      expect(a.get('a')).toEqual({
        uri: 'file:///path/to/test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      });
    });
  });

  describe('getters', () => {
    it(`supports has`, () => {
      const a = new FormData();
      a.append('a', 'b');
      a.append('c', 'd');

      expect(a.has('a')).toBe(true);
      expect(a.has('b')).toBe(false);
    });

    it(`supports get`, () => {
      const a = new FormData();
      a.append('a', 'b');
      a.append('c', 'd');

      expect(a.get('a')).toBe('b');
      expect(a.get('b')).toBe(null);
    });
  });

  describe('forEach', () => {
    it(`works`, () => {
      const a = new FormData();
      a.append('a', 'b');
      a.append('c', 'd');
      const forEach = jest.fn();
      a.forEach(forEach);
      expect(forEach).toBeCalledTimes(2);
    });

    it(`asserts getting too few arguments`, () => {
      const a = new FormData();
      expect(() =>
        // @ts-expect-error: Testing invalid usage
        a.forEach()
      ).toThrow(
        `Failed to execute 'forEach' on 'FormData': 1 argument required, but only 0 present.`
      );
    });

    it(`does not assert forEach getting too many arguments`, () => {
      const a = new FormData();
      // @ts-expect-error: expected invalid usage
      a.forEach(() => {}, 1, 2);
    });

    it(`asserts forEach callback`, () => {
      const a = new FormData();
      expect(() =>
        // @ts-expect-error: Testing invalid usage
        a.forEach(0)
      ).toThrow(
        `Failed to execute 'forEach' on 'FormData': parameter 1 is not of type 'Function'.`
      );
    });
  });

  describe('iterators', () => {
    it('supports iteration', () => {
      const a = new FormData();
      a.append('a', 'b');
      const fn = jest.fn();
      for (const [key, value] of a) {
        fn(key, value);
        expect(key).toBe('a');
        expect(value).toBe('b');
      }
      expect(fn).toBeCalledTimes(1);

      const keysFn = jest.fn();
      for (const key of a.keys()) {
        keysFn(key);
        expect(key).toBe('a');
      }
      expect(keysFn).toBeCalledTimes(1);

      const valuesFn = jest.fn();
      for (const value of a.values()) {
        valuesFn(value);
        expect(value).toBe('b');
      }
      expect(valuesFn).toBeCalledTimes(1);

      const entriesFn = jest.fn();
      for (const [key, value] of a.entries()) {
        entriesFn(key, value);
        expect(key).toBe('a');
        expect(value).toBe('b');
      }
      expect(entriesFn).toBeCalledTimes(1);
    });
  });
});
