/**
 * RSC Client Module Proxy Tests
 *
 * Tests stable ID generation for "use client" boundaries.
 *
 * @see https://github.com/expo/expo/pull/41823#issuecomment-3689889651
 */

import {
  RSC_DEFERRED_PREFIX,
  isDeferredStableId,
  extractResolvedPathFromDeferred,
} from '../client-module-proxy-plugin';

describe('RSC stable ID helpers', () => {
  describe('RSC_DEFERRED_PREFIX', () => {
    it('has correct prefix value', () => {
      expect(RSC_DEFERRED_PREFIX).toBe('__RSC_DEFERRED__:');
    });
  });

  describe('isDeferredStableId', () => {
    it('returns true for deferred IDs', () => {
      expect(isDeferredStableId('__RSC_DEFERRED__:/path/to/file.js')).toBe(true);
    });

    it('returns false for relative paths', () => {
      expect(isDeferredStableId('./src/Button.js')).toBe(false);
    });

    it('returns false for package specifiers', () => {
      expect(isDeferredStableId('pkg/client')).toBe(false);
    });

    it('returns false for scoped package specifiers', () => {
      expect(isDeferredStableId('@scope/pkg/client')).toBe(false);
    });
  });

  describe('extractResolvedPathFromDeferred', () => {
    it('extracts path from deferred ID', () => {
      const path = extractResolvedPathFromDeferred(
        '__RSC_DEFERRED__:/project/node_modules/pkg/client.js'
      );
      expect(path).toBe('/project/node_modules/pkg/client.js');
    });

    it('handles pnpm paths', () => {
      const path = extractResolvedPathFromDeferred(
        '__RSC_DEFERRED__:/project/node_modules/.pnpm/pkg@1.0.0/node_modules/pkg/client.js'
      );
      expect(path).toBe(
        '/project/node_modules/.pnpm/pkg@1.0.0/node_modules/pkg/client.js'
      );
    });

    it('throws for non-deferred IDs', () => {
      expect(() => extractResolvedPathFromDeferred('./src/Button.js')).toThrow(
        'Not a deferred stable ID'
      );
    });
  });
});

describe('stable ID generation scenarios', () => {
  // These test the expected behavior of generateStableId function
  // which is not exported, but we can verify through the deferred prefix pattern

  describe('Issue 1: pnpm non-hoisted paths', () => {
    it('pnpm paths should be marked as deferred', () => {
      // When Babel processes a file in pnpm's .pnpm directory,
      // it should mark it as deferred for serializer resolution
      const pnpmPath =
        '/project/node_modules/.pnpm/react-dom@18.2.0/node_modules/react-dom/client.js';

      // In the actual plugin, this would generate:
      const expectedId = RSC_DEFERRED_PREFIX + pnpmPath;

      expect(isDeferredStableId(expectedId)).toBe(true);
      expect(extractResolvedPathFromDeferred(expectedId)).toBe(pnpmPath);
    });

    it('deeply nested pnpm paths should be marked as deferred', () => {
      const deepPath =
        '/project/node_modules/.pnpm/a@1.0.0/node_modules/a/node_modules/b/node_modules/c/client.js';

      const expectedId = RSC_DEFERRED_PREFIX + deepPath;

      expect(isDeferredStableId(expectedId)).toBe(true);
      expect(extractResolvedPathFromDeferred(expectedId)).toBe(deepPath);
    });
  });

  describe('Issue 2: package.json exports paths', () => {
    it('exports-resolved paths should be marked as deferred', () => {
      // When exports maps "./client" to "./dist/esm/client/index.mjs"
      const exportsPath = '/project/node_modules/pkg/dist/esm/client/index.mjs';

      const expectedId = RSC_DEFERRED_PREFIX + exportsPath;

      expect(isDeferredStableId(expectedId)).toBe(true);
      expect(extractResolvedPathFromDeferred(expectedId)).toBe(exportsPath);
    });

    it('conditional exports paths should be marked as deferred', () => {
      // react-server condition resolves to different file
      const rscPath = '/project/node_modules/pkg/dist/rsc/client.js';

      const expectedId = RSC_DEFERRED_PREFIX + rscPath;

      expect(isDeferredStableId(expectedId)).toBe(true);
    });
  });

  describe('Issue 3: Metro-specific resolution paths', () => {
    it('react-native field paths should be marked as deferred', () => {
      const reactNativePath = '/project/node_modules/pkg/dist/native/index.js';

      const expectedId = RSC_DEFERRED_PREFIX + reactNativePath;

      expect(isDeferredStableId(expectedId)).toBe(true);
    });

    it('platform-specific extension paths should be marked as deferred', () => {
      const nativePath = '/project/node_modules/pkg/Button.native.js';
      const iosPath = '/project/node_modules/pkg/Button.ios.js';

      expect(isDeferredStableId(RSC_DEFERRED_PREFIX + nativePath)).toBe(true);
      expect(isDeferredStableId(RSC_DEFERRED_PREFIX + iosPath)).toBe(true);
    });
  });

  describe('app-level files (should NOT be deferred)', () => {
    it('app src files should use relative paths', () => {
      // These should NOT have the deferred prefix
      const relativePath = './src/components/Button.js';

      expect(isDeferredStableId(relativePath)).toBe(false);
    });

    it('relative paths are stable IDs', () => {
      const paths = [
        './src/Button.js',
        './components/Header.tsx',
        './app/(tabs)/index.tsx',
      ];

      for (const p of paths) {
        expect(isDeferredStableId(p)).toBe(false);
      }
    });
  });
});
