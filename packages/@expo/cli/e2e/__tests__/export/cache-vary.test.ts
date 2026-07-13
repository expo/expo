/* eslint-env jest */
import fs from 'fs';
import { sync as globSync } from 'glob';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports sharing one transform cache across different EXPO_PUBLIC_* values', () => {
  const projectRoot = getRouterE2ERoot();

  async function exportWithEnvValueAsync(outputName: string, value: string): Promise<string> {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'ios', '--output-dir', outputName, '--no-bytecode', '--no-minify'],
      {
        env: {
          NODE_ENV: 'production',
          E2E_ROUTER_SRC: 'cache-vary',
          E2E_ROUTER_JS_ENGINE: 'hermes',
          EXPO_PUBLIC_CACHE_VARY_VALUE: value,
        },
      }
    );

    const bundlePath = globSync('_expo/static/js/ios/*.js', {
      cwd: path.join(projectRoot, outputName),
      absolute: true,
    })[0];
    expect(bundlePath).toBeDefined();
    return fs.promises.readFile(bundlePath!, 'utf8');
  }

  it('re-inlines updated env values instead of serving stale cached transforms', async () => {
    const first = await exportWithEnvValueAsync('dist-cache-vary-first', 'cache-vary-value-one');
    expect(first).toContain('env-value:');
    expect(first).toContain('cache-vary-value-one');

    const second = await exportWithEnvValueAsync('dist-cache-vary-second', 'cache-vary-value-two');
    expect(second).toContain('cache-vary-value-two');
    expect(second).not.toContain('cache-vary-value-one');

    const third = await exportWithEnvValueAsync('dist-cache-vary-third', 'cache-vary-value-one');
    expect(third).toContain('cache-vary-value-one');
    expect(third).not.toContain('cache-vary-value-two');
  }, 560_000); // Three full exports run in this test.
});
