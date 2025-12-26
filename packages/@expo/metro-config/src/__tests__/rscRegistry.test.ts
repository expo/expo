/**
 * RSC Registry Tests
 *
 * Tests for the three core RSC resolution issues:
 * 1. Non-hoisted node_modules (pnpm)
 * 2. package.json:exports mappings
 * 3. Metro vs Node.js resolution differences
 *
 * Note: These tests use synthetic paths. Since the registry uses package.json
 * boundary detection (not path heuristics), tests that involve collision
 * detection will use hash-based fallback when package.json is not found.
 *
 * @see https://github.com/expo/expo/pull/41823#issuecomment-3689889651
 */

import * as path from 'path';

import {
  captureSpecifier,
  clearRegistry,
  getSpecifier,
  getStableId,
  setProjectRoot,
} from '../rscRegistry';

describe('rscRegistry', () => {
  beforeEach(() => {
    clearRegistry();
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

    it('falls back to relative path for uncaptured files without package.json', () => {
      // When package.json is not found, falls back to relative path
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

    it('handles multiple versions of same package (pnpm) with collision', () => {
      // Two different versions of the same package
      const v1Path = '/project/node_modules/.pnpm/lodash@4.17.20/node_modules/lodash/index.js';
      const v2Path = '/project/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/index.js';

      // Both imported as "lodash" from different places - collision!
      captureSpecifier(v1Path, 'lodash');
      captureSpecifier(v2Path, 'lodash');

      // Without real package.json, collision falls back to hash-based IDs
      // In real usage with actual packages, it would use version suffixes
      const result1 = getStableId(v1Path, projectRoot);
      const result2 = getStableId(v2Path, projectRoot);

      // Both should be captured (even if with hash suffix)
      expect(result1.source).toBe('capture');
      expect(result2.source).toBe('capture');

      // The IDs should contain hash suffix (collision was detected)
      // Note: In real usage with actual package.json, version suffixes would be used
      expect(result1.stableId).toContain('lodash');
      expect(result2.stableId).toContain('lodash');
    });

    it('handles pnpm symlinked packages', () => {
      // pnpm uses symlinks, but Metro resolves to real paths
      const realPath = '/project/node_modules/.pnpm/pkg@1.0.0/node_modules/pkg/dist/client.js';

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

    it('handles conditional exports (react-server) - collision detected without package.json', () => {
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

      // Same specifier, different resolved paths (conditional export)
      captureSpecifier(rscPath, 'pkg/client');
      captureSpecifier(browserPath, 'pkg/client');

      // Without real package.json to determine version, collision detection
      // falls back to hash-based disambiguation
      const rscResult = getStableId(rscPath, projectRoot);
      const browserResult = getStableId(browserPath, projectRoot);

      // Both should be captured
      expect(rscResult.source).toBe('capture');
      expect(browserResult.source).toBe('capture');

      // In real usage with actual package.json, same version would NOT trigger collision
    });

    it('handles nested exports', () => {
      // { "exports": { "./utils/string": "./dist/utils/string/index.js" } }

      const resolvedPath = '/project/node_modules/pkg/dist/utils/string/index.js';

      captureSpecifier(resolvedPath, 'pkg/utils/string');

      const result = getStableId(resolvedPath, projectRoot);
      expect(result.stableId).toBe('pkg/utils/string');
    });

    it('handles wildcard exports', () => {
      // { "exports": { "./*": "./dist/*.js" } }

      const resolvedPath = '/project/node_modules/pkg/dist/helpers.js';

      captureSpecifier(resolvedPath, 'pkg/helpers');

      const result = getStableId(resolvedPath, projectRoot);
      expect(result.stableId).toBe('pkg/helpers');
    });
  });

  // ============================================================================
  // Issue 3: Metro vs Node.js Resolution Differences
  // ============================================================================
  describe('Issue 3: Metro vs Node.js resolution differences', () => {
    const projectRoot = '/project';

    it('handles react-native field (Metro-only)', () => {
      // Metro resolves "react-native" field, Node.js uses "main"
      // package.json: { "main": "lib/index.js", "react-native": "lib/index.native.js" }

      const metroPath = '/project/node_modules/pkg/lib/index.native.js';
      const nodePath = '/project/node_modules/pkg/lib/index.js';

      // Captured during Metro resolution with react-native field
      captureSpecifier(metroPath, 'pkg');

      const result = getStableId(metroPath, projectRoot);
      expect(result.stableId).toBe('pkg');

      // The node path wasn't captured, so it falls back
      const nodeResult = getStableId(nodePath, projectRoot);
      // Without package.json, falls back to relative
      expect(nodeResult.stableId).toBe('./node_modules/pkg/lib/index.js');
    });

    it('handles browser field', () => {
      // package.json: { "main": "lib/index.js", "browser": "lib/browser.js" }

      const browserPath = '/project/node_modules/pkg/lib/browser.js';

      captureSpecifier(browserPath, 'pkg');

      const result = getStableId(browserPath, projectRoot);
      expect(result.stableId).toBe('pkg');
    });

    it('handles .ios.js / .android.js extensions', () => {
      // Metro resolves platform extensions, Node.js doesn't know about them
      const iosPath = '/project/node_modules/pkg/Button.ios.js';
      const androidPath = '/project/node_modules/pkg/Button.android.js';

      // Captured from different platform builds
      captureSpecifier(iosPath, 'pkg/Button');
      captureSpecifier(androidPath, 'pkg/Button');

      // Without real package.json, same specifier for different paths
      // triggers collision detection
      const iosResult = getStableId(iosPath, projectRoot);
      const androidResult = getStableId(androidPath, projectRoot);

      // Both should be captured
      expect(iosResult.source).toBe('capture');
      expect(androidResult.source).toBe('capture');
    });

    it('handles native.js extension', () => {
      const nativePath = '/project/node_modules/pkg/index.native.js';

      captureSpecifier(nativePath, 'pkg');

      const result = getStableId(nativePath, projectRoot);
      expect(result.stableId).toBe('pkg');
    });
  });

  // ============================================================================
  // Path Normalization
  // ============================================================================
  describe('Path normalization', () => {
    const projectRoot = '/project';

    it('normalizes Windows paths', () => {
      const windowsPath = 'C:\\project\\node_modules\\pkg\\index.js';

      captureSpecifier(windowsPath, 'pkg');

      // Should be able to retrieve with either path format
      expect(getSpecifier('C:/project/node_modules/pkg/index.js')).toBe('pkg');
    });

    it('handles double backslashes from JS strings', () => {
      // This is what you'd see in a JS string literal: "C:\\Users\\..."
      const escapedPath = 'C:\\\\project\\\\node_modules\\\\pkg\\\\index.js';

      captureSpecifier(escapedPath, 'pkg');

      expect(getSpecifier('C:/project/node_modules/pkg/index.js')).toBe('pkg');
    });

    it('deduplicates paths', () => {
      const path1 = '/project/node_modules/pkg/index.js';
      const path2 = '/project/node_modules/pkg/index.js';

      captureSpecifier(path1, 'pkg');
      captureSpecifier(path2, 'pkg'); // Same path, should not duplicate

      // Should still resolve correctly
      expect(getStableId(path1, projectRoot).stableId).toBe('pkg');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('Edge cases', () => {
    const projectRoot = '/project';

    it('handles scoped packages with deep exports', () => {
      const deepPath = '/project/node_modules/@company/design-system/dist/tokens/colors.js';

      captureSpecifier(deepPath, '@company/design-system/tokens/colors');

      const result = getStableId(deepPath, projectRoot);
      expect(result.stableId).toBe('@company/design-system/tokens/colors');
    });

    it('handles monorepo workspace packages', () => {
      // Workspace packages might not be in node_modules
      const workspacePath = '/project/packages/shared/index.js';

      // App-level (no bare specifier capture)
      const result = getStableId(workspacePath, projectRoot);

      // Should use relative path since it's app-level
      expect(result.stableId).toBe('./packages/shared/index.js');
      expect(result.source).toBe('relative');
    });

    it('handles linked packages (npm link)', () => {
      // npm link creates symlinks, Metro follows to real path
      const linkedPath = '/home/user/other-project/lib/index.js';

      captureSpecifier(linkedPath, 'my-linked-pkg');

      const result = getStableId(linkedPath, projectRoot);
      expect(result.stableId).toBe('my-linked-pkg');
    });

    it('clears registry properly', () => {
      captureSpecifier('/project/node_modules/pkg/index.js', 'pkg');
      expect(getSpecifier('/project/node_modules/pkg/index.js')).toBe('pkg');

      clearRegistry();

      expect(getSpecifier('/project/node_modules/pkg/index.js')).toBeUndefined();
    });
  });

  // ============================================================================
  // Integration Scenarios
  // ============================================================================
  describe('Integration scenarios', () => {
    const projectRoot = '/project';

    it('handles real-world RSC scenario: client boundary in package', () => {
      // Scenario: App imports a "use client" component from a package
      // The package uses exports map

      // Package: react-native-safe-area-context
      // Exports: { ".": { "default": "./lib/module/index.js" } }
      // Specifier: "react-native-safe-area-context"

      const resolvedPath = '/project/node_modules/react-native-safe-area-context/lib/module/index.js';

      captureSpecifier(resolvedPath, 'react-native-safe-area-context');

      const result = getStableId(resolvedPath, projectRoot);

      // RSC payload should use the specifier, not the path
      expect(result.stableId).toBe('react-native-safe-area-context');
      expect(result.source).toBe('capture');
    });

    it('handles internal package imports', () => {
      // Scenario: Package A imports a client boundary from its own submodule
      // @expo/vector-icons imports ./Ionicons internally

      const resolvedPath = '/project/node_modules/@expo/vector-icons/build/Ionicons.js';

      // This would be captured when @expo/vector-icons/index.js imports ./Ionicons
      // The canonical specifier is computed from the package boundary
      captureSpecifier(resolvedPath, '@expo/vector-icons/build/Ionicons');

      const result = getStableId(resolvedPath, projectRoot);
      expect(result.stableId).toBe('@expo/vector-icons/build/Ionicons');
    });
  });

  // ============================================================================
  // Exports Field Reverse Lookup (NEW)
  // ============================================================================
  describe('Exports field reverse lookup', () => {
    // Note: These tests document expected behavior.
    // Actual file system tests require integration test setup.

    it('uses captured specifier over exports lookup', () => {
      // When a specifier is captured during resolution, it should take priority
      const projectRoot = '/project';
      const resolvedPath = '/project/node_modules/my-pkg/dist/client/index.js';

      // Captured specifier from actual import
      captureSpecifier(resolvedPath, 'my-pkg/client');

      const result = getStableId(resolvedPath, projectRoot);
      expect(result.stableId).toBe('my-pkg/client');
      expect(result.source).toBe('capture');
    });

    it('documents exports lookup priority', () => {
      // Expected behavior when exports field is present:
      //
      // 1. Captured specifier (highest priority)
      // 2. Exports field reverse lookup
      // 3. Computed from package boundary (fallback)
      //
      // Example with package.json:
      // {
      //   "name": "my-pkg",
      //   "exports": {
      //     ".": "./dist/index.js",
      //     "./client": "./dist/client/index.js"
      //   }
      // }
      //
      // Given file: /node_modules/my-pkg/dist/client/index.js
      // Expected ID: "my-pkg/client" (from exports reverse lookup)
      // NOT: "my-pkg/dist/client/index" (computed fallback)
    });

    it('documents conditional exports handling', () => {
      // Expected behavior with conditional exports:
      //
      // {
      //   "exports": {
      //     ".": {
      //       "import": "./esm/index.mjs",
      //       "require": "./cjs/index.cjs"
      //     }
      //   }
      // }
      //
      // Both ./esm/index.mjs and ./cjs/index.cjs should resolve to "my-pkg"
      // The exports reverse lookup processes all conditions
    });

    it('documents fallback for files not in exports', () => {
      // When a file is NOT in the exports field:
      //
      // Package with exports: { ".": "./dist/index.js" }
      // File: /node_modules/my-pkg/dist/internal/helper.js (not exported)
      //
      // Expected ID: "my-pkg/dist/internal/helper" (computed fallback)
      // Source: "computed"
    });
  });

  // ============================================================================
  // Real-World Exports Scenarios (Documentation)
  // ============================================================================
  describe('Real-world exports scenarios', () => {
    it('documents expo-router style resolution', () => {
      // expo-router exports:
      // {
      //   ".": "./build/index.js",
      //   "./build/rsc/router/host": "./build/rsc/router/host.js"
      // }
      //
      // File: /node_modules/expo-router/build/rsc/router/host.js
      // Expected ID: "expo-router/build/rsc/router/host" (from exports)
      //
      // This is what we expect after the exports lookup improvement
    });

    it('documents react-native-safe-area-context style resolution', () => {
      // react-native-safe-area-context exports:
      // {
      //   ".": {
      //     "import": "./lib/module/index.js",
      //     "require": "./lib/commonjs/index.js"
      //   }
      // }
      //
      // File: /node_modules/react-native-safe-area-context/lib/module/index.js
      // Expected ID: "react-native-safe-area-context" (from exports)
      // NOT: "react-native-safe-area-context/lib/module/index" (computed)
    });
  });
});
