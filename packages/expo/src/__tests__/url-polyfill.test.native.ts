// Uncomment to see the default native behavior
// import 'react-native/Libraries/Core/setUpXHR';

describe(URL, () => {
  it(`uses the Expo polyfill`, () => {
    expect(URL[Symbol.for('expo.polyfill')]).toBe(true);
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
  it(`uses the Expo polyfill`, () => {
    expect(URLSearchParams[Symbol.for('expo.polyfill')]).toBe(true);
  });
  it(`uses the working URLSearchParams polyfill from the global`, () => {
    expect(URLSearchParams[Symbol.for('expo.polyfill')]).toBe(true);
    expect(() => new URLSearchParams({ a: 'b' }).set('a', 'c')).not.toThrow();
  });
});
