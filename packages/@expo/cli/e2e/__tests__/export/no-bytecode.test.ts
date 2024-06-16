/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import klawSync from 'klaw-sync';
import path from 'path';
import * as fs from 'fs';
import { sync as globSync } from 'glob';

import { runExportSideEffects } from './export-side-effects';
import { bin, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports for hermes with no bytecode', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-no-bytecode';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await execa(
        'node',
        [bin, 'export', '-p', 'ios', '--output-dir', outputName, '--no-bytecode'],
        {
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_ROUTER_JS_ENGINE: 'hermes',
            E2E_ROUTER_SRC: 'url-polyfill',
            E2E_ROUTER_ASYNC: 'development',
            EXPO_USE_FAST_RESOLVER: 'true',
          },
        }
      );
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has expected files', async () => {
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        ios: {
          assets: expect.anything(),
          bundle: expect.stringMatching(/_expo\/static\/js\/ios\/index-.*\.js/),
        },
      },
      version: 0,
    });

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('index.html');

    const iosBundle = files.find((v) => v?.startsWith('_expo/static/js/ios/'));
    expect(iosBundle).toBeDefined();

    // Check if the bundle is minified
    const bundlePath = globSync('**/*.js', {
      cwd: path.join(outputDir, '_expo'),
      absolute: true,
    })[0];

    const bundle = await fs.promises.readFile(bundlePath, 'utf8');
    // Minified mark
    expect(bundle).toMatch('__d((function(g,r,');
  });
});

describe('exports for hermes with no bytecode and no minification', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-no-bytecode-no-minify';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await execa(
        'node',
        [bin, 'export', '-p', 'ios', '--output-dir', outputName, '--no-bytecode', '--no-minify'],
        {
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_ROUTER_JS_ENGINE: 'hermes',
            E2E_ROUTER_SRC: 'url-polyfill',
            E2E_ROUTER_ASYNC: 'development',
            EXPO_USE_FAST_RESOLVER: 'true',
          },
        }
      );
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has expected files', async () => {
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        ios: {
          assets: expect.anything(),
          bundle: expect.stringMatching(/_expo\/static\/js\/ios\/index-.*\.js/),
        },
      },
      version: 0,
    });

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('index.html');

    const iosBundle = files.find((v) => v?.startsWith('_expo/static/js/ios/'));
    expect(iosBundle).toBeDefined();

    // Check if the bundle is minified
    const bundlePath = globSync('**/*.js', {
      cwd: path.join(outputDir, '_expo'),
      absolute: true,
    })[0];

    const bundle = await fs.promises.readFile(bundlePath, 'utf8');
    // Unminified mark
    expect(bundle).toMatch('__d(function (global,');
  });
});
