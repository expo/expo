import { Script } from 'node:vm';

import * as worker from '../../transform-worker/transform-worker';
import { serializeToWithGraph } from '../fork/__tests__/serializer-test-utils';
import { reconcileTransformSerializerPlugin } from '../reconcileTransformSerializerPlugin';
import { treeShakeSerializer } from '../treeShakeSerializerPlugin';

jest.mock('../../transform-worker/transform-worker', () => {
  const worker = jest.requireActual('../../transform-worker/transform-worker');
  return { ...worker, transform: jest.fn(worker.transform) };
});

jest.mock('../../utils/findUpPackageJsonPath', () => ({
  findUpPackageJsonPath: jest.fn(() => null),
}));

it.each([
  { optimize: false, treeshake: false },
  { optimize: true, treeshake: false },
  { optimize: true, treeshake: true },
])(
  'wraps JavaScript produced by a CSS transformer (optimize: $optimize, treeshake: $treeshake)',
  async ({ optimize, treeshake }) => {
    const { transform } = jest.requireActual<typeof worker>(
      '../../transform-worker/transform-worker'
    );
    jest
      .mocked(worker.transform)
      .mockImplementation((config, projectRoot, filename, data, options) => {
        if (filename.endsWith('.css')) {
          return transform(
            config,
            projectRoot,
            `${filename}.js`,
            Buffer.from(
              `import { registerStyles } from './styles-runtime';
               registerStyles(${JSON.stringify(data.toString('utf8'))});`
            ),
            options
          );
        }
        return transform(config, projectRoot, filename, data, options);
      });

    const [[, , graph], bundle] = await serializeToWithGraph(
      {
        fs: {
          'index.js': `import './styles.css';`,
          'styles.css': '.container { background-color: white; }',
          'styles-runtime.js': `export function registerStyles(css) {
            globalThis.__REGISTERED_STYLES__ = css;
          }`,
        },
        options: { platform: 'ios', dev: false, optimize, treeshake, output: 'static' },
      },
      [treeShakeSerializer, reconcileTransformSerializerPlugin]
    );

    const stylesheet = graph.dependencies.get('/app/styles.css')!;
    expect(stylesheet).toBeDefined();
    expect(stylesheet.output[0].data.code).toMatch(/^__d\(/);
    expect(() => new Script(bundle[0].source)).not.toThrow();
  }
);
