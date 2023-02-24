import { printBundleSizes, createFilesTable } from '../printBundleSizes';

jest.mock('../../log');
jest.mock('chalk', () => {
  const def = jest.fn((str) => str) as any;

  def.underline = (str) => str;
  def.bold = (str) => str;
  def.dim = (str) => str;

  return def;
});

describe(createFilesTable, () => {
  it(`handles single-line output`, () => {
    expect(createFilesTable([['foo', 'bar']])).toMatchInlineSnapshot(`
      "Bundle  Size
      ─ foo    3 B"
    `);
  });
  it(`handles multi-line output`, () => {
    expect(
      createFilesTable([
        ['alpha', '1'],
        ['beta', '2'],
        ['charlie', '3'],
      ])
    ).toMatchInlineSnapshot(`
      "Bundle     Size
      ┌ alpha     1 B
      ├ beta      1 B
      └ charlie   1 B"
    `);
  });
});

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
        web: {
          code: 'foo2',
          map: 'bars2',
        } as any,
      })
    ).toEqual([
      ['index.ios.js', 'foo'],
      ['index.android.js (Hermes)', expect.anything()],
      [expect.stringContaining('index.ios.js.map'), 'bars'],
      ['index.web.js', 'foo2'],
      [expect.stringContaining('index.android.js.map (Hermes)'), '12345'],
      [expect.stringContaining('index.web.js.map'), 'bars2'],
    ]);
  });
});
