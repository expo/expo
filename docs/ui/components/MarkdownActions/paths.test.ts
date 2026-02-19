import { hasDynamicData, normalizePath, shouldShowMarkdownActions } from './paths';

describe('Markdown action path helpers', () => {
  it('normalizes hash and query fragments from URLs', () => {
    expect(normalizePath('/additional-resources/#talks')).toBe('/additional-resources');
    expect(normalizePath('/additional-resources/?q=1')).toBe('/additional-resources');
    expect(normalizePath('/additional-resources/#talks?ignored')).toBe('/additional-resources');
  });

  it('treats dynamic data pages with hash fragments as dynamic', () => {
    expect(hasDynamicData('/additional-resources/#talks')).toBe(true);
    expect(shouldShowMarkdownActions({ path: '/additional-resources/#talks' })).toBe(false);
  });

  it('still hides markdown actions when packageName is present', () => {
    expect(
      shouldShowMarkdownActions({ packageName: 'expo-camera', path: '/versions/latest/sdk/camera' })
    ).toBe(false);
  });
});
