/* eslint-env jest */
import execa from 'execa';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { bin, findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static-rendering with no sitemap', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rendering-asset-prefix';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await execa('node', [bin, 'export', '-p', 'web', '--output-dir', outputName], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
          E2E_ROUTER_SITEMAP: 'false',
        },
      });
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it(
    'has expected files',
    async () => {
      const files = findProjectFiles(outputDir);

      // The wrapper should not be included as a route.
      expect(files).not.toContain('+html.html');
      expect(files).not.toContain('_layout.html');
      expect(files).not.toContain('_sitemap.html');

      // Injected by framework
      expect(files).toContain('+not-found.html');

      // Normal routes
      expect(files).toContain('about.html');
      expect(files).toContain('index.html');
      expect(files).toContain('styled.html');
      expect(files).toContain('links.html');

      // generateStaticParams values
      expect(files).toContain('[post].html');
      expect(files).toContain('welcome-to-the-universe.html');
      expect(files).toContain('other.html');
    },
    5 * 1000
  );
});
