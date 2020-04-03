import { getRandomValues } from '../Crypto';

describe('Crypto', () => {
  describe('getRandomValues', () => {
    it(`returns the input array`, () => {
      const array = new Uint8Array(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });
    it(`modifies the input array`, () => {
      const array = new Uint8Array(40);
      array.fill(0);
      const result = getRandomValues(array);
      const array2 = new Uint8Array(10);
      array2.fill(0);
      expect(result).not.toEqual(array2);
    });

    it(`works with Uint8Array`, () => {
      const array = new Uint8Array(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });
    it(`works with Int8Array`, () => {
      const array = new Int8Array(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });
    it(`works with Uint8ClampedArray`, () => {
      const array = new Uint8ClampedArray(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });

    it(`works with Uint16Array`, () => {
      const array = new Uint16Array(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });
    it(`works with Int16Array`, () => {
      const array = new Int16Array(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });

    it(`works with Uint32Array`, () => {
      const array = new Uint32Array(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });
    it(`works with Int32Array`, () => {
      const array = new Int32Array(40);
      const result = getRandomValues(array);
      expect(result).toBe(array);
    });

    it(`fails with non-typed array`, () => {
      const array = new Array(40);
      let error;
      try {
        // @ts-ignore
        getRandomValues(array);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
    it(`fails with Float32Array`, () => {
      const array = new Float32Array(40);
      let error;
      try {
        // @ts-ignore
        getRandomValues(array);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
    it(`fails with Float64Array`, () => {
      const array = new Float64Array(40);
      let error;
      try {
        // @ts-ignore
        getRandomValues(array);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
    /*it(`fails with BigInt64Array`, () => {
      const array = new BigInt64Array(40);
      let error;
      try {
        // @ts-ignore
        getRandomValues(array);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
    it(`fails with BigUint64Array`, () => {
      const array = new BigUint64Array(40);
      let error;
      try {
        // @ts-ignore
        getRandomValues(array);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });*/
  });
});
