import { findPlatformRouteIssues } from '../expoRouterRoutes';

describe(findPlatformRouteIssues, () => {
  it('should return no issues when a platform route has a same-directory fallback', () => {
    expect(findPlatformRouteIssues(['about.tsx', 'about.web.tsx'])).toEqual([]);
  });

  it('should accept a fallback with any source extension', () => {
    expect(findPlatformRouteIssues(['legacy.js', 'legacy.android.tsx'])).toEqual([]);
  });

  it('should accept platform layouts that have a fallback', () => {
    expect(findPlatformRouteIssues(['_layout.tsx', '_layout.ios.tsx'])).toEqual([]);
  });

  it('should ignore non-platform route files', () => {
    expect(findPlatformRouteIssues(['index.tsx', 'about.tsx'])).toEqual([]);
  });

  it('should ignore non-route special files even without a fallback', () => {
    expect(findPlatformRouteIssues(['+native-intent.ios.ts', '+html.web.tsx'])).toEqual([]);
  });

  it('should accept fallbacks within nested group directories', () => {
    expect(findPlatformRouteIssues(['(tabs)/about.tsx', '(tabs)/about.ios.tsx'])).toEqual([]);
  });

  it('should flag a platform route with no fallback', () => {
    expect(findPlatformRouteIssues(['profile.ios.tsx'])).toEqual([
      { type: 'missing-fallback', file: 'profile.ios.tsx', platform: 'ios', base: 'profile' },
    ]);
  });

  it('should report a missing fallback once when multiple platform variants exist', () => {
    expect(
      findPlatformRouteIssues(['about.ios.tsx', 'about.android.tsx', 'about.web.tsx'])
    ).toEqual([
      { type: 'missing-fallback', file: 'about.ios.tsx', platform: 'ios', base: 'about' },
    ]);
  });

  it('should not treat a directory route as a fallback for a file route', () => {
    // `about/index.tsx` and `about.ios.tsx` are distinct route files; the latter still needs `about.tsx`.
    expect(findPlatformRouteIssues(['about.ios.tsx', 'about/index.tsx'])).toEqual([
      { type: 'missing-fallback', file: 'about.ios.tsx', platform: 'ios', base: 'about' },
    ]);
  });

  it('should flag API routes that carry a platform extension', () => {
    expect(findPlatformRouteIssues(['hello+api.ts', 'hello+api.ios.ts'])).toEqual([
      {
        type: 'api-platform-extension',
        file: 'hello+api.ios.ts',
        platform: 'ios',
        base: 'hello+api',
      },
    ]);
  });
});
