import { unstable_transformerPath, internal_supervisingTransformerPath } from '@expo/metro-config';

import { withMetroSupervisingTransformWorker } from '../withMetroSupervisingTransformWorker';

const defaultConfig = {
  transformerPath: unstable_transformerPath,
  transformer: {
    babelTransformerPath: require.resolve('@expo/metro-config/babel-transformer'),
  },
} as any;

it('does nothing for default configs', () => {
  expect(withMetroSupervisingTransformWorker(defaultConfig)).toEqual(defaultConfig);
});

it('adds supervisor transformer for custom transformer paths', () => {
  expect(
    withMetroSupervisingTransformWorker({
      ...defaultConfig,
      transformerPath: '<custom>',
    })
  ).toEqual({
    ...defaultConfig,
    transformerPath: internal_supervisingTransformerPath,
    transformer: expect.objectContaining({
      expo_customTransformerPath: '<custom>',
    }),
  });
});

it('adds supervisor transformer for custom Babel transformer paths', () => {
  expect(
    withMetroSupervisingTransformWorker({
      ...defaultConfig,
      transformer: {
        ...defaultConfig.transformer,
        babelTransformerPath: '<custom>',
      },
    })
  ).toEqual({
    ...defaultConfig,
    transformerPath: internal_supervisingTransformerPath,
    transformer: expect.objectContaining({
      babelTransformerPath: '<custom>',
      expo_customTransformerPath: undefined,
    }),
  });
});

it('adds supervisor transformer for both (custom Babel transformer & transformer paths)', () => {
  expect(
    withMetroSupervisingTransformWorker({
      ...defaultConfig,
      transformerPath: '<transformer>',
      transformer: {
        ...defaultConfig.transformer,
        babelTransformerPath: '<babelTransformer>',
      },
    })
  ).toEqual({
    ...defaultConfig,
    transformerPath: internal_supervisingTransformerPath,
    transformer: expect.objectContaining({
      babelTransformerPath: '<babelTransformer>',
      expo_customTransformerPath: '<transformer>',
    }),
  });
});
