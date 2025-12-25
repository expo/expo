/**
 * RSC Registry Tests
 *
 * Tests for the three core RSC resolution issues:
 * 1. Non-hoisted node_modules (pnpm)
 * 2. package.json:exports mappings
 * 3. Metro vs Node.js resolution differences
 *
 * @see https://github.com/expo/expo/pull/41823#issuecomment-3689889651
 */

import {
  captureSpecifier,
  clearRegistry,
  getSpecifier,
  getStableId,
  isNodeModulePath,
} from '../rscRegistry';

describe('rscRegistry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe('isNodeModulePath', () => {
    it('detects standard node_modules path', () => {
      expect(isNodeModulePath('/project/node_modules/pkg/index.js')).toBe(true);
    });

    it('detects nested node_modules path (pnpm structure)', () => {
      expect(
        isNodeModulePath('/project/node_modules/.pnpm/pkg@1.0.0/node_modules/pkg/index.js')
      ).toBe(true);
    });

    it('detects deeply nested node_modules', () => {
      expect(
        isNodeModulePath('/project/node_modules/a/node_modules/b/node_modules/c/index.js')
      ).toBe(true);
    });

    it('returns false for app-level files', () => {
      expect(isNodeModulePath('/project/src/components/Button.js')).toBe(false);
    });

    it('handles Windows paths', () => {
      expect(isNodeModulePath('C:\\project\\node_modules\\pkg\\index.js')).toBe(true);
    });
  });

  describe('captureSpecifier', () => {
    it('captures bare specifiers', () => {
      captureSpecifier('/project/node_modules/pkg/index.js', 'pkg');
      expect(getSpecifier('/project/node_modules/pkg/index.js')).toBe('pkg');
    });

    it('captures scoped package specifiers', () => {
      captureSpecifier('/project/node_modules/@scope/pkg/index.js', '@scope/pkg');
      expect(getSpecifier('/project/node_modules/@scope/pkg/index.js')).toBe('@scope/pkg');
    });

    it('captures subpath specifiers', () => {
      captureSpecifier('/project/node_modules/pkg/client.js', 'pkg/client');
      expect(getSpecifier('/project/node_modules/pkg/client.js')).toBe('pkg/client');
    });

    it('ignores relative specifiers', () => {
      captureSpecifier('/project/src/foo.js', './foo');
      expect(getSpecifier('/project/src/foo.js')).toBeUndefined();
    });

    it('ignores absolute specifiers', () => {
      captureSpecifier('/project/src/foo.js', '/absolute/path');
      expect(getSpecifier('/project/src/foo.js')).toBeUndefined();
    });
  });

  describe('getStableId', () => {
    const projectRoot = '/project';

    it('returns captured specifier when available', () => {
      captureSpecifier('/project/node_modules/pkg/index.js', 'pkg');

      const result = getStableId('/project/node_modules/pkg/index.js', projectRoot);

      expect(result.stableId).toBe('pkg');
      expect(result.source).toBe('capture');
    });

    it('falls back to relative path for app-level files', () => {
      const result = getStableId('/project/src/components/Button.js', projectRoot);

      expect(result.stableId).toBe('./src/components/Button.js');
      expect(result.source).toBe('relative');
    });

    it('falls back to relative path for uncaptured node_modules', () => {
      // If not captured (edge case), still returns something usable
      const result = getStableId('/project/node_modules/unknown/index.js', projectRoot);

      expect(result.stableId).toBe('./node_modules/unknown/index.js');
      expect(result.source).toBe('relative');
    });
  });

  // ============================================================================
  // Issue 1: Non-Hoisted Node Modules (pnpm)
  // ============================================================================
  describe('Issue 1: Non-hoisted node_modules (pnpm)', () => {
    const projectRoot = '/project';

    it('handles pnpm nested structure', () => {
      // pnpm stores packages in .pnpm directory
      const pnpmPath =
        '/project/node_modules/.pnpm/react-dom@18.2.0/node_modules/react-dom/client.js';

      captureSpecifier(pnpmPath, 'react-dom/client');

      const result = getStableId(pnpmPath, projectRoot);
      expect(result.stableId).toBe('react-dom/client');
      expect(result.source).toBe('capture');
    });

    it('handles multiple versions of same package (pnpm)', () => {
      // Two different versions of the same package
      const v1Path = '/project/node_modules/.pnpm/lodash@4.17.20/node_modules/lodash/index.js';
      const v2Path = '/project/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/index.js';

      // Both imported as "lodash" from different places
      captureSpecifier(v1Path, 'lodash');
      captureSpecifier(v2Path, 'lodash');

      // Both should resolve to the specifier (last write wins for now)
      // In production, collision handling would disambiguate
      expect(getStableId(v2Path, projectRoot).stableId).toBe('lodash');
    });

    it('handles hoisted vs non-hoisted dependency access', () => {
      // Package A depends on Package B
      // In npm: /project/node_modules/b/index.js (hoisted)
      // In pnpm: /project/node_modules/.pnpm/a@1.0.0/node_modules/b/index.js (not hoisted)

      const hoistedPath = '/project/node_modules/b/index.js';
      const pnpmPath = '/project/node_modules/.pnpm/a@1.0.0/node_modules/b/index.js';

      // When imported as "b" from different contexts
      captureSpecifier(hoistedPath, 'b');
      captureSpecifier(pnpmPath, 'b');

      // Both should be resolvable via their specifier
      expect(getStableId(hoistedPath, projectRoot).stableId).toBe('b');
      expect(getStableId(pnpmPath, projectRoot).stableId).toBe('b');
    });

    it('handles pnpm symlinked packages', () => {
      // pnpm uses symlinks, but Metro resolves to real paths
      const realPath =
        '/project/node_modules/.pnpm/pkg@1.0.0/node_modules/pkg/dist/client.js';

      captureSpecifier(realPath, 'pkg/client');

      const result = getStableId(realPath, projectRoot);
      expect(result.stableId).toBe('pkg/client');
    });
  });

  // ============================================================================
  // Issue 2: package.json:exports Mappings
  // ============================================================================
  describe('Issue 2: package.json:exports mappings', () => {
    const projectRoot = '/project';

    it('handles exports with different internal paths', () => {
      // package.json: { "exports": { "./client": "./dist/client/index.js" } }
      // Specifier: "pkg/client"
      // Resolved: "/project/node_modules/pkg/dist/client/index.js"

      const resolvedPath = '/project/node_modules/pkg/dist/client/index.js';

      captureSpecifier(resolvedPath, 'pkg/client');

      const result = getStableId(resolvedPath, projectRoot);
      // Should return the specifier, NOT the file path
      expect(result.stableId).toBe('pkg/client');
    });

    it('handles conditional exports (react-server)', () => {
      // package.json: {
      //   "exports": {
      //     "./client": {
      //       "react-server": "./dist/rsc/client.js",
      //       "default": "./dist/browser/client.js"
      //     }
      //   }
      // }

      const rscPath = '/project/node_modules/pkg/dist/rsc/client.js';
      const browserPath = '/project/node_modules/pkg/dist/browser/client.js';

      // Both resolve to the same specifier "pkg/client" but different files
      captureSpecifier(rscPath, 'pkg/client');
      captureSpecifier(browserPath, 'pkg/client');

      // Last write wins, but both map to same specifier
      // The manifest handles env-specific moduleId mapping
      expect(getStableId(rscPath, projectRoot).stableId).toBe('pkg/client');
      expect(getStableId(browserPath, projectRoot).stableId).toBe('pkg/client');
    });

    it('handles subpath pattern exports', () => {
      // package.json: { "exports": { "./*": "./dist/*.js" } }
      // Specifier: "pkg/utils/helper"
      // Resolved: "/project/node_modules/pkg/dist/utils/helper.js"

      const resolvedPath = '/project/node_modules/pkg/dist/utils/helper.js';

      captureSpecifier(resolvedPath, 'pkg/utils/helper');

      const result = getStableId(resolvedPath, projectRoot);
      expect(result.stableId).toBe('pkg/utils/helper');
    });

    it('handles main export mapping', () => {
      // package.json: { "exports": { ".": "./dist/index.js" } }
      // Specifier: "pkg"
      // Resolved: "/project/node_modules/pkg/dist/index.js"

      const resolvedPath = '/project/node_modules/pkg/dist/index.js';

      captureSpecifier(resolvedPath, 'pkg');

      const result = getStableId(resolvedPath, projectRoot);
      expect(result.stableId).toBe('pkg');
    });

    it('handles exports with file extension differences', () => {
      // package.json: { "exports": { "./client": "./client.mjs" } }
      // Metro might resolve to .js or .mjs

      const mjsPath = '/project/node_modules/pkg/client.mjs';

      captureSpecifier(mjsPath, 'pkg/client');

      const result = getStableId(mjsPath, projectRoot);
      expect(result.stableId).toBe('pkg/client');
    });
  });

  // ============================================================================
  // Issue 3: Metro vs Node.js Resolution Differences
  // ============================================================================
  describe('Issue 3: Metro vs Node.js resolution differences', () => {
    const projectRoot = '/project';

    it('handles react-native field resolution (Metro-specific)', () => {
      // package.json: {
      //   "main": "./dist/node/index.js",
      //   "react-native": "./dist/native/index.js"
      // }
      // Metro resolves to react-native field, Node uses main

      const metroResolvedPath = '/project/node_modules/pkg/dist/native/index.js';

      captureSpecifier(metroResolvedPath, 'pkg');

      const result = getStableId(metroResolvedPath, projectRoot);
      // The stable ID should be the specifier, regardless of which file Metro picked
      expect(result.stableId).toBe('pkg');
    });

    it('handles browser field resolution', () => {
      // package.json: {
      //   "main": "./lib/node.js",
      //   "browser": "./lib/browser.js"
      // }
      // Metro (web) uses browser field

      const browserPath = '/project/node_modules/pkg/lib/browser.js';

      captureSpecifier(browserPath, 'pkg');

      const result = getStableId(browserPath, projectRoot);
      expect(result.stableId).toBe('pkg');
    });

    it('handles platform-specific extensions (.native.js)', () => {
      // Metro resolves pkg/foo to pkg/foo.native.js on native
      // Node would resolve to pkg/foo.js

      const nativePath = '/project/node_modules/pkg/foo.native.js';

      captureSpecifier(nativePath, 'pkg/foo');

      const result = getStableId(nativePath, projectRoot);
      expect(result.stableId).toBe('pkg/foo');
    });

    it('handles .ios.js / .android.js extensions', () => {
      const iosPath = '/project/node_modules/pkg/Button.ios.js';
      const androidPath = '/project/node_modules/pkg/Button.android.js';

      captureSpecifier(iosPath, 'pkg/Button');
      captureSpecifier(androidPath, 'pkg/Button');

      // Both should map to same specifier
      expect(getStableId(iosPath, projectRoot).stableId).toBe('pkg/Button');
      expect(getStableId(androidPath, projectRoot).stableId).toBe('pkg/Button');
    });

    it('handles Metro custom resolverMainFields', () => {
      // Metro config: resolverMainFields: ['react-native', 'browser', 'main']
      // This affects which entry point is resolved

      const customFieldPath = '/project/node_modules/pkg/dist/custom-entry.js';

      captureSpecifier(customFieldPath, 'pkg');

      const result = getStableId(customFieldPath, projectRoot);
      expect(result.stableId).toBe('pkg');
    });

    it('handles Metro assetExts resolution', () => {
      // Metro treats certain extensions as assets
      // These shouldn't affect RSC boundaries but test for completeness

      const assetPath = '/project/node_modules/pkg/icon.png';

      // Assets aren't typically RSC boundaries, but verify no crash
      const result = getStableId(assetPath, projectRoot);
      expect(result.stableId).toBe('./node_modules/pkg/icon.png');
    });
  });

  // ============================================================================
  // Windows Path Normalization
  // ============================================================================
  describe('Windows path normalization', () => {
    const projectRoot = 'C:/project';

    it('normalizes Windows backslash paths on capture', () => {
      // Windows uses backslashes
      captureSpecifier('C:\\project\\node_modules\\pkg\\client.js', 'pkg/client');

      // Lookup with forward slashes should work
      expect(getSpecifier('C:/project/node_modules/pkg/client.js')).toBe('pkg/client');
    });

    it('normalizes Windows paths on lookup', () => {
      // Capture with forward slashes
      captureSpecifier('C:/project/node_modules/pkg/client.js', 'pkg/client');

      // Lookup with backslashes should work
      expect(getSpecifier('C:\\project\\node_modules\\pkg\\client.js')).toBe('pkg/client');
    });

    it('handles mixed path separators', () => {
      // Some tools might produce mixed paths
      captureSpecifier('C:/project\\node_modules/pkg\\client.js', 'pkg/client');

      expect(getSpecifier('C:\\project/node_modules\\pkg/client.js')).toBe('pkg/client');
    });

    it('getStableId works with Windows backslash paths', () => {
      captureSpecifier('C:\\project\\node_modules\\pkg\\dist\\client.js', 'pkg/client');

      const result = getStableId('C:/project/node_modules/pkg/dist/client.js', projectRoot);
      expect(result.stableId).toBe('pkg/client');
      expect(result.source).toBe('capture');
    });

    it('handles escaped backslashes in JS string literals', () => {
      // When paths come from JS string literals, backslashes may be escaped
      // The serializer's extractPath() handles this, but registry should too
      captureSpecifier('C:\\\\project\\\\node_modules\\\\pkg\\\\client.js', 'pkg/client');

      // Should be normalized for lookup
      const result = getStableId('C:/project/node_modules/pkg/client.js', projectRoot);
      // Note: double backslash is an escaped backslash, becomes single backslash, then normalized to /
      expect(result.source).toBe('capture');
    });

    it('Windows pnpm paths work correctly', () => {
      const pnpmPath =
        'C:\\project\\node_modules\\.pnpm\\react-dom@18.2.0\\node_modules\\react-dom\\client.js';

      captureSpecifier(pnpmPath, 'react-dom/client');

      const result = getStableId(
        'C:/project/node_modules/.pnpm/react-dom@18.2.0/node_modules/react-dom/client.js',
        projectRoot
      );
      expect(result.stableId).toBe('react-dom/client');
    });
  });

  // ============================================================================
  // Combined Edge Cases
  // ============================================================================
  describe('Combined edge cases', () => {
    const projectRoot = '/project';

    it('pnpm + exports + conditional exports combined', () => {
      // pnpm structure + package.json exports + react-server condition
      const complexPath =
        '/project/node_modules/.pnpm/my-lib@2.0.0/node_modules/my-lib/dist/rsc/client.js';

      captureSpecifier(complexPath, 'my-lib/client');

      const result = getStableId(complexPath, projectRoot);
      expect(result.stableId).toBe('my-lib/client');
    });

    it('monorepo workspace package', () => {
      // Monorepo: packages are symlinked, not in node_modules
      // Metro resolves to actual path in packages/

      const workspacePath = '/project/packages/shared/src/Button.js';

      // Not in node_modules, so not captured as package specifier
      const result = getStableId(workspacePath, projectRoot);
      expect(result.stableId).toBe('./packages/shared/src/Button.js');
      expect(result.source).toBe('relative');
    });

    it('monorepo workspace accessed via node_modules symlink', () => {
      // When workspace package is accessed via node_modules symlink
      const symlinkResolvedPath = '/project/node_modules/@myorg/shared/src/Button.js';

      captureSpecifier(symlinkResolvedPath, '@myorg/shared');

      const result = getStableId(symlinkResolvedPath, projectRoot);
      expect(result.stableId).toBe('@myorg/shared');
    });
  });
});
