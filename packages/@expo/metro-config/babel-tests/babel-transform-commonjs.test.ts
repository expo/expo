import {
  transformSync,
  types as t,
  type Node as BabelNode,
  type PluginOptions as EntryOptions,
  type PluginTarget as EntryTarget,
  type ConfigItem,
  type TransformOptions as BabelCoreOptions,
} from '@babel/core';
import generate from '@babel/generator';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import assert from 'node:assert';
import { join, relative, sep } from 'path';

import { importExportPlugin } from '../build/transform-plugins/import-export-plugin';

const fixturesDir = join(__dirname, 'fixtures');

interface Fixture {
  name: string;
  input?: string;
  output: string;
}

function loadFixtures(): Fixture[] {
  const fixtures: Fixture[] = [];
  const inputFiles = globSync('**/input.*', { cwd: fixturesDir, absolute: true });

  for (const inputFile of inputFiles) {
    const dir = join(inputFile, '..');
    const name = relative(fixturesDir, dir).replace(sep, ' ');
    const outputFile = join(dir, `output.js`);

    const input = readFileSync(inputFile, 'utf-8');
    let output = null;
    try {
      // optional output file
      output = readFileSync(outputFile, 'utf-8');
    } catch (error) {}
    fixtures.push({ name, input, output });
  }

  return fixtures;
}

describe('babel-transform-commonjs', () => {
  const fixtures = loadFixtures();

  fixtures.forEach(({ name, input, output }) => {
    if (!output) {
      console.warn(`Skipping test for ${name} as output.js is missing`);
      return;
    }

    it(name, () => {
      // TODO: Add your test execution logic here
      // For example, call your transform function with 'input' and compare to 'output'
      // expect(transformedCode).toBe(output);
      expect(
        transform(input, [importExportPlugin], {
          importAll: '_$$_IMPORT_ALL',
          importDefault: '_$$_IMPORT_DEFAULT',
        })
      ).toBe(transform(output, [], {}));
    });
  });
});

function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}

type BabelNodeFile = t.File;

type PluginEntry =
  | EntryTarget
  | ConfigItem
  | [EntryTarget]
  | [EntryTarget, EntryOptions]
  | [EntryTarget, EntryOptions, string | void];

function makeTransformOptions<OptionsT extends EntryOptions>(
  plugins: readonly PluginEntry[],
  options: OptionsT
): BabelCoreOptions {
  return {
    ast: true,
    babelrc: false,
    browserslistConfigFile: false,
    code: false,
    compact: true,
    configFile: false,
    plugins: plugins.length
      ? plugins.map((plugin) => [plugin, options])
      : [() => ({ visitor: {} })],
    sourceType: 'module',
  };
}

function validateOutputAst(ast: BabelNode) {
  const seenNodes = new Set<BabelNode>();
  t.traverseFast(nullthrows(ast), function enter(node) {
    if (seenNodes.has(node)) {
      throw new Error(
        'Found a duplicate ' +
          node.type +
          ' node in the output, which can cause' +
          ' undefined behavior in Babel.'
      );
    }
    seenNodes.add(node);
  });
}

export function transformToAst<T extends EntryOptions>(
  plugins: readonly PluginEntry[],
  code: string,
  options: T
): BabelNodeFile {
  const transformResult = transformSync(code, makeTransformOptions(plugins, options));
  const ast = nullthrows(transformResult.ast);
  validateOutputAst(ast);
  return ast;
}

function transform(
  code: string,
  plugins: readonly PluginEntry[],
  options: EntryOptions | null | undefined
) {
  return generate(transformToAst(plugins, code, options)).code;
}
