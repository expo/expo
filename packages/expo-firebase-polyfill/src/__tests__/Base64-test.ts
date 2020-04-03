import { atob, btoa } from '../Base64';

describe('Base64', () => {
  describe('atob', () => {
    it(`decodes base 64`, () => {
      const result = atob('aGVsbG8=');
      expect(result).toBe('hello');
    });
    it(`throws on missing argument`, () => {
      let error;
      try {
        atob();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });

  describe('btoa', () => {
    it(`encodes base 64`, () => {
      const result = btoa('hello');
      expect(result).toBe('aGVsbG8=');
    });
  });
});
