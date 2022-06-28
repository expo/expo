import { sanitizedName } from '../Xcodeproj';

describe(sanitizedName, () => {
  it(`formats basic name`, () => {
    expect(sanitizedName('bacon')).toBe('bacon');
  });
  it(`formats android/xcode unsupported name`, () => {
    expect(sanitizedName('あいう')).toBe('app');
  });
  it(`uses slugify for better name support`, () => {
    expect(sanitizedName('\u2665')).toBe('love');
  });
});
