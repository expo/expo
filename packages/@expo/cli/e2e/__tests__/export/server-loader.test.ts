/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles } from '../utils';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_WORKERD], {
    fixtureName: 'server-loader',
    export: {
      env: {
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SERVER_LOADERS: 'true',
        E2E_ROUTER_SERVER_RENDERING: 'true',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    },
    serve: {
      env: {
        TEST_SECRET_KEY: 'test-secret-key',
      },
    },
  })
)('server loader - $name', (config) => {
  const server = setupServer(config);

  it('has expected files', async () => {
    const files = findProjectFiles(path.join(server.outputDir, 'server'));

    // SSR mode should have `server/` directory with render module
    expect(files).toContain('_expo/server/render.js');
    expect(files).toContain('_expo/routes.json');

    // HTML routes should NOT be pre-rendered in SSR mode
    expect(files).not.toContain('index.html');
    expect(files).not.toContain('second.html');
    expect(files).not.toContain('posts/[postId].html');
    expect(files).not.toContain('posts/static-post-1.html');
    expect(files).not.toContain('posts/static-post-2.html');

    // Loader bundles should exist
    expect(files).toContain('_expo/loaders/env.js');
    expect(files).toContain('_expo/loaders/second.js');
    expect(files).toContain('_expo/loaders/posts/[postId].js');
  });

  it('routes.json has loader paths', async () => {
    const routesJson = JSON.parse(
      fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
    );

    // Find routes with loaders
    const envRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/env');
    const secondRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/second');
    const postRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/posts/[postId]');
    const indexRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/index');

    // Routes with loaders should have loader path
    expect(envRoute?.loader).toBe('_expo/loaders/env.js');
    expect(secondRoute?.loader).toBe('_expo/loaders/second.js');
    expect(postRoute?.loader).toBe('_expo/loaders/posts/[postId].js');

    // Route without loader should not have loader property
    expect(indexRoute?.loader).toBeUndefined();
  });

  it('loader endpoint returns JSON', async () => {
    const response = await server.fetchAsync('/_expo/loaders/second');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toBeDefined();
  });

  it('loader endpoint returns JSON with params for dynamic route', async () => {
    const response = await server.fetchAsync('/_expo/loaders/posts/my-test-post');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data.params).toHaveProperty('postId', 'my-test-post');
  });

  it('loader can access server environment variables', async () => {
    const response = await server.fetchAsync('/_expo/loaders/env');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('TEST_SECRET_KEY', 'test-secret-key');
  });
});
