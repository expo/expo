import { isScannedSource } from './scan.ts';

describe(isScannedSource, () => {
  it('excludes internal fixture pages', () => {
    expect(isScannedSource('/internal')).toBe(false);
    expect(isScannedSource('/internal/test-markdown-pipeline')).toBe(false);
  });

  it('excludes every versioned copy of the SDK docs', () => {
    expect(isScannedSource('/versions/latest')).toBe(false);
    expect(isScannedSource('/versions/latest/sdk/router')).toBe(false);
    expect(isScannedSource('/versions/v57.0.0/sdk/router')).toBe(false);
    expect(isScannedSource('/versions/v54.0.0/config/app')).toBe(false);
    expect(isScannedSource('/versions')).toBe(false);
  });

  it('includes unversioned SDK docs and guide pages', () => {
    expect(isScannedSource('/versions/unversioned')).toBe(true);
    expect(isScannedSource('/versions/unversioned/sdk/expo')).toBe(true);
    expect(isScannedSource('/guides/overview')).toBe(true);
    expect(isScannedSource('/')).toBe(true);
  });
});
