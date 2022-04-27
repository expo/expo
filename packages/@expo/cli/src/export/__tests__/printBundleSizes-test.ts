import { printBundleSizes } from '../printBundleSizes';

jest.mock('../../log');

describe(printBundleSizes, () => {
  it(`prints bundle sizes`, () => {
    expect(
      printBundleSizes({
        ios: {
          code: 'foo',
          map: 'bars',
        } as any,
        android: {
          hermesBytecodeBundle: new Uint8Array([1, 2, 3]),
          hermesSourcemap: '12345',
        } as any,
      })
    ).toEqual([
      ['index.ios.js', 'foo'],
      ['index.android.js (Hermes)', expect.anything()],
      [expect.stringContaining('index.ios.js.map'), 'bars'],
      [expect.stringContaining('index.android.js.map (Hermes)'), '12345'],
    ]);
  });
});
