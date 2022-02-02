import { validateUrl } from '../url';

describe(validateUrl, () => {
  it(`guards against protocols`, () => {
    expect(validateUrl('http://127.0.0.1:80', { protocols: ['http'] })).toBe(true);
    expect(validateUrl('127.0.0.1:80', { requireProtocol: true })).toBe(false);
    expect(validateUrl('http://127.0.0.1:80', { protocols: ['https'] })).toBe(false);
    expect(validateUrl('http://127.0.0.1:80', {})).toBe(true);
    expect(
      validateUrl('127.0.0.1:80', { protocols: ['https', 'http'], requireProtocol: true })
    ).toBe(false);
    expect(validateUrl('https://expo.dev/', { protocols: ['https'] })).toBe(true);
    expect(validateUrl('', { protocols: ['https'] })).toBe(false);
    expect(validateUrl('hello', { protocols: ['https'] })).toBe(false);
  });
});
