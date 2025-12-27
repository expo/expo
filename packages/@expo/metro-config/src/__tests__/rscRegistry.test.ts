/**
 * RSC Registry Tests
 *
 * Tests for the simplified RSC registry that maps output keys to file paths.
 *
 * Output keys are relative paths from project root:
 * - App files: ./src/Button.tsx
 * - Packages: ./node_modules/pkg/file.js
 */

import * as path from 'path';

import {
  clearRegistry,
  getOutputKey,
  getFilePathByOutputKey,
  recordClientBoundary,
  getDiscoveredClientBoundaries,
} from '../rscRegistry';

describe('rscRegistry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe('getOutputKey', () => {
    const projectRoot = '/project';

    it('generates relative path for app-level files', () => {
      const result = getOutputKey('/project/src/components/Button.js', projectRoot);

      expect(result.outputKey).toBe('./src/components/Button.js');
      expect(result.source).toBe('relative');
    });

    it('generates relative path for node_modules', () => {
      const result = getOutputKey('/project/node_modules/pkg/index.js', projectRoot);

      expect(result.outputKey).toBe('./node_modules/pkg/index.js');
      expect(result.source).toBe('relative');
    });

    it('normalizes pnpm nested paths', () => {
      const pnpmPath =
        '/project/node_modules/.pnpm/react-dom@18.2.0/node_modules/react-dom/client.js';

      const result = getOutputKey(pnpmPath, projectRoot);

      expect(result.outputKey).toBe('./node_modules/react-dom/client.js');
      expect(result.source).toBe('relative');
    });

    it('handles scoped packages in pnpm', () => {
      const pnpmPath =
        '/project/node_modules/.pnpm/@scope+pkg@1.0.0/node_modules/@scope/pkg/index.js';

      const result = getOutputKey(pnpmPath, projectRoot);

      expect(result.outputKey).toBe('./node_modules/@scope/pkg/index.js');
      expect(result.source).toBe('relative');
    });

    it('handles Windows-style paths', () => {
      // Windows paths get converted to posix
      const windowsStylePath = path.join('/project', 'src', 'Button.js');

      const result = getOutputKey(windowsStylePath, projectRoot);

      expect(result.outputKey).toBe('./src/Button.js');
    });
  });

  describe('recordClientBoundary', () => {
    it('records and retrieves client boundaries', () => {
      const outputKey = './src/Button.js';
      const filePath = '/project/src/Button.js';

      recordClientBoundary(outputKey, filePath);

      expect(getFilePathByOutputKey(outputKey)).toBe(filePath);
    });

    it('returns undefined for unknown output keys', () => {
      expect(getFilePathByOutputKey('./unknown/file.js')).toBeUndefined();
    });

    it('overwrites existing entries', () => {
      const outputKey = './src/Button.js';
      const filePath1 = '/project/src/Button.js';
      const filePath2 = '/other/project/src/Button.js';

      recordClientBoundary(outputKey, filePath1);
      recordClientBoundary(outputKey, filePath2);

      expect(getFilePathByOutputKey(outputKey)).toBe(filePath2);
    });
  });

  describe('clearRegistry', () => {
    it('clears all recorded boundaries', () => {
      recordClientBoundary('./src/Button.js', '/project/src/Button.js');
      recordClientBoundary('./src/Card.js', '/project/src/Card.js');

      expect(getFilePathByOutputKey('./src/Button.js')).toBeDefined();

      clearRegistry();

      expect(getFilePathByOutputKey('./src/Button.js')).toBeUndefined();
      expect(getFilePathByOutputKey('./src/Card.js')).toBeUndefined();
    });
  });

  describe('getDiscoveredClientBoundaries', () => {
    it('returns a copy of all recorded boundaries', () => {
      recordClientBoundary('./src/Button.js', '/project/src/Button.js');
      recordClientBoundary('./src/Card.js', '/project/src/Card.js');

      const boundaries = getDiscoveredClientBoundaries();

      expect(boundaries.size).toBe(2);
      expect(boundaries.get('./src/Button.js')).toBe('/project/src/Button.js');
      expect(boundaries.get('./src/Card.js')).toBe('/project/src/Card.js');

      // Ensure it's a copy (modifying doesn't affect registry)
      boundaries.delete('./src/Button.js');
      expect(getFilePathByOutputKey('./src/Button.js')).toBe('/project/src/Button.js');
    });
  });
});
