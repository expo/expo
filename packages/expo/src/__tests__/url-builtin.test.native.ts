// Uncomment to see the default native behavior
// import 'react-native/Libraries/Core/setUpXHR';

describe(URL, () => {
  it(`uses the Expo built-ins`, () => {
    expect(URL[Symbol.for('expo.builtin')]).toBe(true);
  });
  it(`supports getter`, () => {
    expect(new URL('https://acme.com').hostname).toBe('acme.com');
  });
  it(`can construct standard URLs`, () => {
    expect(new URL('http://acme.com').toString()).toBe('http://acme.com/');
    expect(new URL('/home', 'http://localhost:3000').toString()).toBe('http://localhost:3000/home');
  });
});

describe(URLSearchParams, () => {
  it(`uses the Expo built-ins`, () => {
    expect(URLSearchParams[Symbol.for('expo.builtin')]).toBe(true);
  });
  it(`uses the working URLSearchParams builtin from the global`, () => {
    expect(() => new URLSearchParams({ a: 'b' }).set('a', 'c')).not.toThrow();
  });
});
