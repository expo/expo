import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';

import { tryTransformJSWithNoxcturnal } from '../../noxcturnal/metro-transform-worker';
import { transformFileFullyWithNoxcturnalSync } from '../../noxcturnal/noxcturnal-transformer';

jest.mock('../../noxcturnal/noxcturnal-transformer', () => ({
  transformFileFullyWithNoxcturnalSync: jest.fn(() => ({
    status: 'fallback',
    reason: 'worklets',
  })),
}));

it('falls back after one full native attempt without producing an intermediate transform', async () => {
  const file = {
    code: "function worklet() { 'worklet'; }",
    filename: '/app/worklet.js',
    inputFileSize: 33,
    type: 'js/module' as const,
    functionMap: null,
  };
  const context = {
    config: {} as JsTransformerConfig,
    projectRoot: '/app',
    options: {
      type: 'module',
      customTransformOptions: { engine: 'hermes' },
    } as JsTransformOptions,
  };
  const completeFullTransform = jest.fn();

  await expect(
    tryTransformJSWithNoxcturnal(
      file,
      context,
      {
        hasNonDefaultBabelConfig: false,
        isDefaultExpoTransformer: true,
      },
      { completeFullTransform }
    )
  ).resolves.toEqual({ status: 'fallback' });

  expect(transformFileFullyWithNoxcturnalSync).toHaveBeenCalledTimes(1);
  expect(completeFullTransform).not.toHaveBeenCalled();
});
