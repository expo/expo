import { boundedSize } from '../utils.web';

describe(boundedSize, () => {
  it('keeps the size when no bounds are given', () => {
    expect(boundedSize(100, 50, undefined, undefined)).toEqual({ width: 100, height: 50 });
  });

  it('keeps the size when the image fits within the bounds', () => {
    expect(boundedSize(100, 50, 100, 50)).toEqual({ width: 100, height: 50 });
    expect(boundedSize(100, 50, 200, undefined)).toEqual({ width: 100, height: 50 });
    expect(boundedSize(100, 50, undefined, 80)).toEqual({ width: 100, height: 50 });
  });

  it('caps the width preserving the aspect ratio', () => {
    expect(boundedSize(100, 50, 50, undefined)).toEqual({ width: 50, height: 25 });
  });

  it('caps the height preserving the aspect ratio', () => {
    expect(boundedSize(100, 50, undefined, 25)).toEqual({ width: 50, height: 25 });
  });

  it('uses the most restrictive bound', () => {
    expect(boundedSize(100, 50, 50, 10)).toEqual({ width: 20, height: 10 });
  });

  it('ignores non-positive bounds', () => {
    expect(boundedSize(100, 50, 0, -10)).toEqual({ width: 100, height: 50 });
  });
});
