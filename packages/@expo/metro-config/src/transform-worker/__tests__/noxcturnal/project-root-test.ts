import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import * as noxcturnal from 'noxcturnal';

import {
  transformAssetWithNoxcturnalSync,
  transformFileFullyWithNoxcturnalSync,
  transformNodeModuleWithNoxcturnalSync,
} from '../../noxcturnal/noxcturnal-transformer';

jest.mock('noxcturnal', () => ({
  ...jest.requireActual('noxcturnal'),
  transform: jest.fn(),
}));

it.each(['module', 'asset', 'source'] as const)(
  'passes the app root to the %s transform without changing its filename',
  (kind) => {
    const stop = new Error('Stop at the native boundary');
    jest.mocked(noxcturnal.transform).mockImplementationOnce(() => {
      throw stop;
    });
    const input = {
      source: 'export const value = 1;',
      filename: 'src/value.js',
      projectRoot: '/workspace/apps/mobile',
      isDefaultExpoTransformer: true,
      options: {
        dev: false,
        experimentalImportSupport: true,
        inlinePlatform: false,
        inlineRequires: false,
        minify: false,
        platform: 'ios',
        type: 'module',
        unstable_transformProfile: 'hermes-stable',
        customTransformOptions: { engine: 'hermes' },
      } satisfies JsTransformOptions,
      config: {
        allowOptionalDependencies: false,
        asyncRequireModulePath: 'metro-runtime',
        globalPrefix: '',
        unstable_compactOutput: false,
      },
    };
    const run =
      kind === 'module'
        ? transformFileFullyWithNoxcturnalSync
        : kind === 'asset'
          ? transformAssetWithNoxcturnalSync
          : transformNodeModuleWithNoxcturnalSync;
    expect(() => run(input)).toThrow(stop);
    expect(noxcturnal.transform).toHaveBeenLastCalledWith(
      input.source,
      input.filename,
      expect.anything(),
      expect.objectContaining({
        projectRoot: input.projectRoot,
        pluginData: expect.objectContaining({
          input: expect.objectContaining({
            filename: input.filename,
            projectRoot: input.projectRoot,
          }),
        }),
      })
    );
  }
);
