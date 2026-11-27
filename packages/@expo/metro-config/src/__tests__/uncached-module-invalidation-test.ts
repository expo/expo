import DeltaCalculator from '@expo/metro/metro/DeltaBundler/DeltaCalculator';
import type {
  DeltaResult,
  MixedOutput,
  Options,
  TransformFn,
  TransformResultDependency,
} from '@expo/metro/metro/DeltaBundler/types';
import { EventEmitter } from 'events';
import { vol } from 'memfs';
import path from 'path';

import { getDefaultConfig } from '../ExpoMetroConfig';

const projectRoot = '/';
const ENTRY_PATH = path.join(projectRoot, 'index.js');
const STYLESHEET_PATH = path.join(projectRoot, 'global.css');
const IMPORTED_PATH = path.join(projectRoot, 'imported.css');
const UNREAD_PATH = path.join(projectRoot, 'unread.css');
const MANIFEST_PATH = path.join(projectRoot, 'package.json');
const DELTA_REQUEST = { reset: false, shallow: false };

const STYLESHEET_IMPORT: TransformResultDependency = {
  name: './global.css',
  data: { key: 'stylesheet', asyncType: null, isESMImport: true, locs: [] },
};

function mockProject() {
  vol.fromJSON(
    {
      'package.json': JSON.stringify({ name: 'hello-world', private: true }),
      'node_modules/react-native/package.json': '',
    },
    projectRoot
  );
}

/** A graph of one module importing a stylesheet whose compile read `imported.css`, under the patched delta calculator. */
async function createStylesheetGraph() {
  getDefaultConfig(projectRoot);
  let nextCompile = 'initial compile';
  let stylesheetCompiles = 0;

  const transform: TransformFn = async (absolutePath) => {
    if (absolutePath === ENTRY_PATH) {
      return {
        dependencies: [STYLESHEET_IMPORT],
        output: [],
        getSource: () => Buffer.from(''),
        unstable_transformResultKey: 'entry',
      };
    }
    stylesheetCompiles++;
    return {
      dependencies: [],
      output: [
        {
          type: 'js/module',
          data: {
            code: nextCompile,
            css: { code: '', skipCache: true, fileDependencies: [IMPORTED_PATH] },
          },
        },
      ],
      getSource: () => Buffer.from(''),
      unstable_transformResultKey: 'stylesheet',
    };
  };

  const options: Options = {
    lazy: false,
    onProgress: null,
    resolve: () => ({ type: 'sourceFile', filePath: STYLESHEET_PATH }),
    shallow: false,
    transform,
    transformOptions: {
      dev: true,
      minify: false,
      platform: 'ios',
      type: 'module',
      unstable_transformProfile: 'default',
    },
    unstable_allowRequireContext: false,
    unstable_enablePackageExports: true,
    unstable_incrementalResolution: false,
  };

  const changes = new EventEmitter();
  const calculator = new DeltaCalculator(new Set([ENTRY_PATH]), changes, options);
  await calculator.getDelta(DELTA_REQUEST);

  return {
    compileNext(compile: string) {
      nextCompile = compile;
    },
    get stylesheetCompiles() {
      return stylesheetCompiles;
    },
    publishModified(absolutePath: string) {
      changes.emit('change', {
        changes: {
          addedDirectories: [],
          addedFiles: [],
          modifiedFiles: [
            [path.relative(projectRoot, absolutePath), { isSymlink: false, modifiedTime: 1 }],
          ],
          removedDirectories: [],
          removedFiles: [],
        },
        logger: null,
        rootDir: projectRoot,
      });
    },
    heldCompile(): unknown {
      const data = calculator.getGraph().dependencies.get(STYLESHEET_PATH)?.output[0]?.data;
      return typeof data === 'object' && data !== null && 'code' in data ? data.code : undefined;
    },
    requestDelta(): Promise<DeltaResult<MixedOutput>> {
      return calculator.getDelta(DELTA_REQUEST);
    },
    end() {
      calculator.end();
    },
  };
}

describe('uncached modules', () => {
  beforeEach(() => {
    mockProject();
  });
  afterEach(() => {
    vol.reset();
  });

  it('compiles the stylesheet again when a module the graph holds changes', async () => {
    const graph = await createStylesheetGraph();
    graph.compileNext('after the importing module changed');
    graph.publishModified(ENTRY_PATH);

    const delta = await graph.requestDelta();

    expect(graph.heldCompile()).toBe('after the importing module changed');
    expect(delta.modified.has(STYLESHEET_PATH)).toBe(true);
    graph.end();
  });

  it('compiles the stylesheet again when a file its compile read changes, though no module imports that file', async () => {
    const graph = await createStylesheetGraph();
    graph.compileNext('after the imported file changed');
    graph.publishModified(IMPORTED_PATH);

    const delta = await graph.requestDelta();

    expect(graph.heldCompile()).toBe('after the imported file changed');
    expect(delta.modified.has(STYLESHEET_PATH)).toBe(true);
    graph.end();
  });

  it('keeps the compile a reset ran, though the stylesheet itself did not change', async () => {
    const graph = await createStylesheetGraph();
    graph.compileNext('after the reset');
    graph.publishModified(MANIFEST_PATH);

    await graph.requestDelta();

    expect(graph.heldCompile()).toBe('after the reset');
    graph.end();
  });

  it('keeps the compile a change event for the unchanged stylesheet ran', async () => {
    const graph = await createStylesheetGraph();
    graph.compileNext('after the unchanged stylesheet was reported');
    graph.publishModified(STYLESHEET_PATH);

    const delta = await graph.requestDelta();

    expect(graph.heldCompile()).toBe('after the unchanged stylesheet was reported');
    expect(delta.modified.has(STYLESHEET_PATH)).toBe(true);
    graph.end();
  });

  it('compiles nothing when a file no compile read changes', async () => {
    const graph = await createStylesheetGraph();
    graph.publishModified(UNREAD_PATH);

    await graph.requestDelta();

    expect(graph.stylesheetCompiles).toBe(1);
    graph.end();
  });
});
