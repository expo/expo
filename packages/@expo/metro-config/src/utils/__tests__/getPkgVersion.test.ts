import { vol } from 'memfs';

import { getPkgVersion } from '../getPkgVersion';

// NOTE(@kitten): The resolver falls back to Node's own resolution, which reads the real
// filesystem and `NODE_PATH`. Jest sets `NODE_PATH`, so real package names would leak into
// these tests. All fixtures use names that only exist in the in-memory filesystem.
const PKG = 'fixture-pkg';
const PEER = 'fixture-peer';

const pkgJson = (name: string, version?: unknown) =>
  JSON.stringify(version === undefined ? { name } : { name, version });

beforeEach(() => {
  vol.reset();
});

describe(getPkgVersion, () => {
  it('returns the version of a package installed in the project', () => {
    vol.fromJSON({
      '/proj/package.json': pkgJson('app', '1.0.0'),
      [`/proj/node_modules/${PKG}/package.json`]: pkgJson(PKG, '2.3.4'),
    });
    expect(getPkgVersion('/proj', PKG)).toBe('2.3.4');
  });

  it('returns the version of a scoped package', () => {
    vol.fromJSON({
      '/proj/package.json': pkgJson('app', '1.0.0'),
      '/proj/node_modules/@fixture/scoped/package.json': pkgJson('@fixture/scoped', '7.0.0-beta.1'),
    });
    expect(getPkgVersion('/proj', '@fixture/scoped')).toBe('7.0.0-beta.1');
  });

  it('resolves a package hoisted to a parent node_modules folder', () => {
    vol.fromJSON({
      '/monorepo/package.json': pkgJson('monorepo'),
      [`/monorepo/node_modules/${PKG}/package.json`]: pkgJson(PKG, '2.3.4'),
      '/monorepo/apps/app/package.json': pkgJson('app', '1.0.0'),
    });
    expect(getPkgVersion('/monorepo/apps/app', PKG)).toBe('2.3.4');
  });

  it('returns null when the package is not installed', () => {
    vol.fromJSON({ '/proj/package.json': pkgJson('app', '1.0.0') });
    expect(getPkgVersion('/proj', PKG)).toBeNull();
  });

  it('returns null when the package has no version field', () => {
    vol.fromJSON({
      '/proj/package.json': pkgJson('app', '1.0.0'),
      [`/proj/node_modules/${PKG}/package.json`]: pkgJson(PKG),
    });
    expect(getPkgVersion('/proj', PKG)).toBeNull();
  });

  it('returns null when the version field is not a string', () => {
    vol.fromJSON({
      '/proj/package.json': pkgJson('app', '1.0.0'),
      [`/proj/node_modules/${PKG}/package.json`]: pkgJson(PKG, 42),
    });
    expect(getPkgVersion('/proj', PKG)).toBeNull();
  });

  it('returns null when the package.json is malformed', () => {
    vol.fromJSON({
      '/proj/package.json': pkgJson('app', '1.0.0'),
      [`/proj/node_modules/${PKG}/package.json`]: '{ not json',
    });
    expect(getPkgVersion('/proj', PKG)).toBeNull();
  });

  it('returns null when the package.json is empty', () => {
    vol.fromJSON({
      '/proj/package.json': pkgJson('app', '1.0.0'),
      [`/proj/node_modules/${PKG}/package.json`]: '',
    });
    expect(getPkgVersion('/proj', PKG)).toBeNull();
  });

  it('reads the package.json of the package itself, not a nested one', () => {
    // `dist/package.json` markers (e.g. `{ "type": "module" }`) must not shadow the real manifest
    vol.fromJSON({
      '/proj/package.json': pkgJson('app', '1.0.0'),
      [`/proj/node_modules/${PKG}/package.json`]: pkgJson(PKG, '2.3.4'),
      [`/proj/node_modules/${PKG}/dist/package.json`]: JSON.stringify({ type: 'module' }),
      [`/proj/node_modules/${PKG}/dist/index.js`]: '',
    });
    expect(getPkgVersion('/proj', PKG)).toBe('2.3.4');
  });

  describe('peerDependent fallback', () => {
    it('resolves a package nested under the peer dependent', () => {
      vol.fromJSON({
        '/proj/package.json': pkgJson('app', '1.0.0'),
        [`/proj/node_modules/${PEER}/package.json`]: pkgJson(PEER, '4.0.0'),
        [`/proj/node_modules/${PEER}/node_modules/${PKG}/package.json`]: pkgJson(PKG, '0.6.0'),
      });
      expect(getPkgVersion('/proj', PKG, PEER)).toBe('0.6.0');
    });

    it('does not resolve the nested package without the peerDependent argument', () => {
      vol.fromJSON({
        '/proj/package.json': pkgJson('app', '1.0.0'),
        [`/proj/node_modules/${PEER}/package.json`]: pkgJson(PEER, '4.0.0'),
        [`/proj/node_modules/${PEER}/node_modules/${PKG}/package.json`]: pkgJson(PKG, '0.6.0'),
      });
      expect(getPkgVersion('/proj', PKG)).toBeNull();
    });

    it('prefers the project-level package over the peer dependent copy', () => {
      vol.fromJSON({
        '/proj/package.json': pkgJson('app', '1.0.0'),
        [`/proj/node_modules/${PKG}/package.json`]: pkgJson(PKG, '0.9.0'),
        [`/proj/node_modules/${PEER}/package.json`]: pkgJson(PEER, '4.0.0'),
        [`/proj/node_modules/${PEER}/node_modules/${PKG}/package.json`]: pkgJson(PKG, '0.6.0'),
      });
      expect(getPkgVersion('/proj', PKG, PEER)).toBe('0.9.0');
    });

    it('returns null when the peer dependent is not installed', () => {
      vol.fromJSON({ '/proj/package.json': pkgJson('app', '1.0.0') });
      expect(getPkgVersion('/proj', PKG, PEER)).toBeNull();
    });

    it('returns null when the peer dependent does not contain the package', () => {
      vol.fromJSON({
        '/proj/package.json': pkgJson('app', '1.0.0'),
        [`/proj/node_modules/${PEER}/package.json`]: pkgJson(PEER, '4.0.0'),
      });
      expect(getPkgVersion('/proj', PKG, PEER)).toBeNull();
    });

    it('returns null when the nested package has no version field', () => {
      vol.fromJSON({
        '/proj/package.json': pkgJson('app', '1.0.0'),
        [`/proj/node_modules/${PEER}/package.json`]: pkgJson(PEER, '4.0.0'),
        [`/proj/node_modules/${PEER}/node_modules/${PKG}/package.json`]: pkgJson(PKG),
      });
      expect(getPkgVersion('/proj', PKG, PEER)).toBeNull();
    });
  });
});
