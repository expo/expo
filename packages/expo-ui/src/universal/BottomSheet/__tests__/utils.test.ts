import { resolveContentPadding } from '../utils';

const platformDefault = { top: 16, bottom: 0, left: 16, right: 16 };

describe('resolveContentPadding', () => {
  it('keeps the platform default when the prop is omitted', () => {
    expect(resolveContentPadding(undefined, platformDefault)).toEqual(platformDefault);
  });

  it('applies a number to every edge', () => {
    expect(resolveContentPadding(0, platformDefault)).toEqual({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    expect(resolveContentPadding(8, platformDefault)).toEqual({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    });
  });

  it('treats an edge left out of an object as 0, not as the platform default', () => {
    expect(resolveContentPadding({ top: 8 }, platformDefault)).toEqual({
      top: 8,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });
});
