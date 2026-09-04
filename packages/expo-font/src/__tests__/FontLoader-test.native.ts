import type { FontFaceDefinition } from '../Font.types';
import { getNativeFontFaces } from '../FontLoader';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getNativeFontFaces', () => {
  it('normalizes weight keywords, numeric strings, and numbers', () => {
    const definitions: FontFaceDefinition[] = [
      { path: 'a.ttf', weight: 'bold' },
      { path: 'b.ttf', weight: '400' },
      { path: 'c.ttf', weight: 'normal' },
      { path: 'd.ttf', weight: 250 },
    ];

    expect(getNativeFontFaces(definitions).map((face) => face.weight)).toEqual([
      700, 400, 400, 250,
    ]);
  });

  it('normalizes style, mapping oblique to italic', () => {
    const definitions: FontFaceDefinition[] = [
      { path: 'a.ttf', style: 'oblique' },
      { path: 'b.ttf', style: 'italic' },
      { path: 'c.ttf', style: 'normal' },
      { path: 'd.ttf' },
    ];

    expect(getNativeFontFaces(definitions).map((face) => face.style)).toEqual([
      'italic',
      'italic',
      'normal',
      undefined,
    ]);
  });

  it.each(['not-a-weight', '100 900'])(
    'leaves a weight without a single numeric value (%p) undefined',
    (weight) => {
      expect(getNativeFontFaces([{ path: 'a.ttf', weight }])[0]!.weight).toBeUndefined();
    }
  );

  it('leaves an unset weight undefined', () => {
    expect(getNativeFontFaces([{ path: 'a.ttf' }])[0]!.weight).toBeUndefined();
  });
});

describe('getNativeFontFaces resolving weight/style from a FontResource path', () => {
  it("reads weight/style from the path's FontResource when the face leaves them unset", () => {
    const definitions: FontFaceDefinition[] = [
      { path: { uri: 'a.ttf', weight: 300, style: 'italic' } },
    ];

    expect(getNativeFontFaces(definitions)).toEqual([{ weight: 300, style: 'italic' }]);
  });
});
