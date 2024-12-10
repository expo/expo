/* eslint-env jest */
import JsonFile from '@expo/json-file';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('export-no-ssg', () => {
  const projectRoot = getRouterE2ERoot();
  const outputDir = path.join(projectRoot, 'dist-server-no-ssg');

  beforeAll(async () => {
    console.time('export-server');
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '-p', 'ios', '--output-dir', 'dist-server-no-ssg', '--no-ssg'],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      }
    );
    console.timeEnd('export-server');
  });

  it('has expected files', async () => {
    // Request HTML
    const files = findProjectFiles(outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('server/+html.html');
    expect(files).not.toContain('server/_layout.html');

    // Has routes.json
    expect(files).toContain('server/_expo/routes.json');

    // Has functions
    expect(files).toContain('server/_expo/functions/methods+api.js');
    expect(files).toContain('server/_expo/functions/methods+api.js.map');
    expect(files).toContain('server/_expo/functions/api/[dynamic]+api.js');
    expect(files).toContain('server/_expo/functions/api/[dynamic]+api.js.map');
    expect(files).toContain('server/_expo/functions/api/externals+api.js');
    expect(files).toContain('server/_expo/functions/api/externals+api.js.map');

    // TODO: We shouldn't export this
    expect(files).toContain('server/_expo/functions/api/empty+api.js');
    expect(files).toContain('server/_expo/functions/api/empty+api.js.map');

    // Has single variation of group file
    expect(files).not.toContain('server/(alpha)/index.html');
    expect(files).not.toContain('server/(alpha)/beta.html');
    expect(files).not.toContain('server/beta.html');

    // Injected by framework
    expect(files).not.toContain('server/_sitemap.html');
    expect(files).not.toContain('server/+not-found.html');

    // Normal routes
    expect(files).toContain('client/index.html');
    expect(files).not.toContain('server/blog/[post].html');

    const json = await JsonFile.readAsync(path.join(outputDir, 'server/_expo/routes.json'));
    expect((json.apiRoutes as any[]).length).toBeGreaterThan(0);
    expect(json.htmlRoutes).toEqual([]);
    expect(json.notFoundRoutes).toEqual([]);
  });
});
