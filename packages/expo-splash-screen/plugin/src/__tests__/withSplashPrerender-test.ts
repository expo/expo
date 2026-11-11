import {
  PRERENDER_SNAPSHOT_PLIST_KEY,
  normalizePrerender,
  setPrerenderSnapshotInfoPlist,
} from '../withSplashPrerender';

describe(normalizePrerender, () => {
  it('treats a string as the component path', () => {
    expect(normalizePrerender('./LaunchScreen.tsx')).toEqual({ component: './LaunchScreen.tsx' });
  });
  it('passes the object form through', () => {
    expect(normalizePrerender({ component: './LaunchScreen.tsx', snapshot: true })).toEqual({
      component: './LaunchScreen.tsx',
      snapshot: true,
    });
    expect(normalizePrerender({ snapshot: true })).toEqual({ snapshot: true });
  });
  it('is empty when unset', () => {
    expect(normalizePrerender(undefined)).toEqual({});
  });
});

describe(setPrerenderSnapshotInfoPlist, () => {
  it('sets the flag when snapshots are on', () => {
    expect(setPrerenderSnapshotInfoPlist({}, { snapshot: true })).toEqual({
      [PRERENDER_SNAPSHOT_PLIST_KEY]: true,
    });
  });
  it('removes the flag otherwise', () => {
    expect(
      setPrerenderSnapshotInfoPlist({ [PRERENDER_SNAPSHOT_PLIST_KEY]: true }, { component: './LaunchScreen.tsx' })
    ).toEqual({});
    expect(setPrerenderSnapshotInfoPlist({}, {})).toEqual({});
  });
});
