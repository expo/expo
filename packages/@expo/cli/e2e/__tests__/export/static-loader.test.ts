/* eslint-env jest */
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles } from '../utils';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE], {
    fixtureName: 'server-loader',
    export: {
      env: {
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SERVER_LOADERS: 'true',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    },
  })
)('static loader - $name', (config) => {
  const server = setupServer(config);

  it('has expected files', async () => {
    const files = findProjectFiles(server.outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // Injected by framework
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    // Normal routes - static mode pre-renders HTML
    expect(files).toContain('index.html');
    expect(files).toContain('second.html');
    expect(files).toContain('posts/[postId].html');
    expect(files).toContain('posts/static-post-1.html');
    expect(files).toContain('posts/static-post-2.html');

    // Loader outputs - pre-generated JSON files (no extension in static mode)
    expect(files).toContain('_expo/loaders/second');
    expect(files).toContain('_expo/loaders/posts/[postId]');
    expect(files).toContain('_expo/loaders/posts/static-post-1');
    expect(files).toContain('_expo/loaders/posts/static-post-2');
  });

  it('loader endpoint returns JSON', async () => {
    const response = await server.fetchAsync('/_expo/loaders/second');
    expect(response.status).toBe(200);
    // NOTE: expo serve returns application/octet-stream for extensionless files,
    // but the content is still valid JSON. In production, a proper server would set the correct content-type.

    const data = await response.json();
    expect(data).toBeDefined();
  });

  it('loader endpoint returns JSON with params for static route', async () => {
    const response = await server.fetchAsync('/_expo/loaders/posts/static-post-1');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.params).toHaveProperty('postId', 'static-post-1');
  });
});
