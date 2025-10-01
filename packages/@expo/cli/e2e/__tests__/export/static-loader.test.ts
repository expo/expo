/* eslint-env jest */

import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getHtml, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static loader', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-loader';

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'server-loader',
        E2E_ROUTER_SERVER_LOADERS: 'true',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    });
  });

  describe('requests', () => {
    const server = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
      },
    });

    beforeAll(async () => {
      await server.startAsync([outputName]);
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    it('has expected files', async () => {
      const files = findProjectFiles(path.join(projectRoot, outputName));

      // The wrapper should not be included as a route.
      expect(files).not.toContain('+html.html');
      expect(files).not.toContain('_layout.html');

      // Injected by framework
      expect(files).toContain('_sitemap.html');
      expect(files).toContain('+not-found.html');

      // Normal routes
      expect(files).toContain('index.html');
      expect(files).toContain('second.html');
      expect(files).toContain('posts/[postId].html');
      expect(files).toContain('posts/static-post-1.html');
      expect(files).toContain('posts/static-post-2.html');

      expect(files).toContain('_expo/loaders/second.json');
      expect(files).toContain('_expo/loaders/posts/[postId].json');
      expect(files).toContain('_expo/loaders/posts/static-post-1.json');
      expect(files).toContain('_expo/loaders/posts/static-post-2.json');
    });
  });
});
