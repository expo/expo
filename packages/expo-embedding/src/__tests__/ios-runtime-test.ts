import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { prepareRuntime } from '../ios';

describe('Preparing iOS runtime artifacts', () => {
  let root: string;
  let rn: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'expo-runtime-'));
    rn = join(root, 'react-native');
    await mkdir(join(rn, 'sdks/hermes-engine'), { recursive: true });
    await mkdir(join(rn, 'scripts/spm'), { recursive: true });
    await writeFile(join(rn, 'package.json'), JSON.stringify({ version: '0.88.0-test' }));
    await writeFile(
      join(rn, 'sdks/hermes-engine/version.properties'),
      'HERMES_VERSION_NAME=test\n'
    );
    // Reproduce the downloader's local archive layout without a shared cache or network.
    await writeFile(
      join(rn, 'scripts/spm/download-spm-artifacts.js'),
      `
      const fs = require('node:fs');
      const path = require('node:path');
      const { execFileSync } = require('node:child_process');
      const args = process.argv;
      const output = args[args.indexOf('--output') + 1];
      const flavor = args[args.indexOf('--flavor') + 1];
      fs.mkdirSync(path.join(output, '.downloads'), { recursive: true });
      const entries = [
        ['react-native-artifacts-0.88.0-test-reactnative-core', 'React.xcframework'],
        ['react-native-artifacts-0.88.0-test-reactnative-dependencies', 'ReactNativeDependencies.xcframework'],
        ['hermes-ios-test-hermes-ios', 'hermes.xcframework'],
      ];
      for (const [archive, framework] of entries) {
        fs.mkdirSync(path.join(output, framework), { recursive: true });
        fs.writeFileSync(path.join(output, framework, 'fixture'), flavor);
        execFileSync('tar', ['-czf', path.join(output, '.downloads', archive + '-' + flavor + '.tar.gz'), '-C', output, framework]);
      }
    `
    );
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await rm(root, { recursive: true, force: true });
  });

  it('should extract local downloads when the shared cache is disabled', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, RCT_SKIP_CACHES: '1' });
    await prepareRuntime(root, process.execPath, { reactNativeRoot: rn });
    for (const configuration of ['Debug', 'Release']) {
      const runtime = join(root, '.expo-source/runtime', configuration);
      for (const framework of ['React', 'ReactNativeDependencies', 'hermes']) {
        expect(await readFile(join(runtime, `${framework}.xcframework/fixture`), 'utf8')).toBe(
          configuration.toLowerCase()
        );
      }
    }
  });
});
