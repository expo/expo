import { vol } from 'memfs';
import countLines from 'metro/src/lib/countLines';
import { wrapModule } from '../js';
import CountingSet from 'metro/src/lib/CountingSet';
import { Dependency, Module } from 'metro';
import * as path from 'path';

jest.mock('fs');

function line(str: string) {
  const [line, column] = str.split(':').map(Number);
  return { line, column };
}

function toDependencyMap(...deps: Dependency[]): Map<string, Dependency> {
  const map = new Map();

  for (const dep of deps) {
    map.set(dep.absolutePath, dep);
  }

  return map;
}

function toDependency(
  absolutePath: string,
  {
    name = path.basename(absolutePath),
    isAsync,
  }: {
    name?: string;
    isAsync?: boolean;
  } = {}
): Dependency {
  return {
    absolutePath,
    data: {
      name,
      data: {
        locs: [
          {
            start: line('0:0'),
            end: line('0:5'),
          },
        ],
        asyncType: isAsync ? 'async' : undefined,
        key: name + isAsync,
      },
    },
  };
}

function toModule(
  absolutePath: string,
  src: string,
  {
    dependencies = new Map(),
  }: {
    dependencies?: Map<string, Dependency>;
  } = {}
): Module<{ type: string; data: { lineCount: number; code: string } }> {
  return {
    getSource() {
      return Buffer.from(src);
    },
    path: absolutePath,
    dependencies,
    inverseDependencies: new CountingSet(),
    output: [
      {
        data: {
          code: src,
          lineCount: countLines(src),
        },
        type: 'js/module',
      },
    ],
  };
}

describe(wrapModule, () => {
  it(`wraps module with params`, () => {
    vol.fromJSON({});

    expect(
      wrapModule(
        toModule('/to/index.js', '__d(() => { /* Hey */ })', {
          dependencies: toDependencyMap(
            toDependency('/to/dep1.js'),
            toDependency('/to/other.js', { isAsync: true })
          ),
        }),
        {
          baseUrl: '/',
          computedAsyncModulePaths: null,
          createModuleId: (m) => m,
          dev: true,
          includeAsyncPaths: false,
          platform: 'web',
          projectRoot: '/to',
          serverRoot: '/to',
          skipWrapping: false,
          sourceUrl: 'http://localhost:8081/index.bundle?platform=web&dev=true&minify=false',
          splitChunks: false,
        }
      )
    ).toEqual({
      paths: {},
      src: '__d(() => { /* Hey */ },"/to/index.js",["/to/dep1.js","/to/other.js"],"index.js")',
    });
  });
});
