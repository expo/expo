#!/usr/bin/env node
// This benchmark comes from Sucrase
// https://github.com/alangpierce/sucrase/blob/b9e563f0fc869b6085ced4df5459b80be8cdab7f/benchmark/benchmark.ts

import * as babel from '@babel/core';

import * as path from 'path';
import * as fs from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

export interface FileInfo {
  path: string;
  code: string;
}

async function loadProjectFiles(
  projectPath: string,
  filter?: (path: string) => boolean
): Promise<Array<FileInfo>> {
  const results: Array<FileInfo> = [];
  async function visit(path: string): Promise<void> {
    for (const child of await readdir(path)) {
      if (['node_modules', '.git', 'ios', 'android'].includes(child)) {
        continue;
      }
      const childPath = join(path, child);
      if ((await stat(childPath)).isDirectory()) {
        await visit(childPath);
      } else if (
        (childPath.endsWith('.js') ||
          childPath.endsWith('.jsx') ||
          childPath.endsWith('.ts') ||
          childPath.endsWith('.tsx')) &&
        !childPath.endsWith('.d.ts')
      ) {
        if (!filter || !!filter(childPath)) {
          const code = (await readFile(childPath)).toString();
          results.push({ code, path: childPath });
        }
      }
    }
  }
  await visit(projectPath);
  return results;
}

async function main(): Promise<void> {
  process.chdir(__dirname);

  const benchmark = process.argv[2] || 'sample';

  if (benchmark === 'sample') {
    await benchmarkSample();
  } else if (benchmark === 'test') {
    await benchmarkTest();
  } else if (benchmark === 'project') {
    await benchmarkProject();
  } else if (benchmark === 'rn') {
    await benchmarkReactNative();
  } else {
    console.error(`Unrecognized benchmark: ${benchmark}`);
    process.exitCode = 1;
  }
}

/**
 * Given a path to a project directory, discover all JS/TS files and determine
 * the time needed to transpile them.
 */
async function benchmarkProject(): Promise<void> {
  const projectPath = path.join(process.cwd(), process.argv[3]);
  console.log('Loading files:', projectPath);
  const files = await loadProjectFiles(projectPath);
  await benchmarkFiles({ files, numIterations: 1 });
}

async function benchmarkReactNative(): Promise<void> {
  const projectPath = path.resolve('../../../node_modules/react-native');
  console.log('Loading files:', projectPath);
  const files = await loadProjectFiles(projectPath, (path) => !path.includes('/samples/'));
  await benchmarkFiles({ files, numIterations: 1 });
}

/**
 * Benchmark 100 iterations of a 1000-line file that tries to be fairly
 * representative of typical code.
 */
async function benchmarkSample(): Promise<void> {
  const code = fs.readFileSync(`./sample/sample.tsx`).toString();
  await benchmarkFiles({ files: [{ code, path: 'sample.tsx' }], numIterations: 100, warmUp: true });
}

/**
 * Run a small code snippet through all compilers and print the output so they
 * can be spot-checked.
 */
async function benchmarkTest(): Promise<void> {
  const code = `
// Imports should be transpiled to CJS.
import React from 'react';

// async/await should NOT be transpiled.
async function foo(): Promise<void> {
  await bar();
}

// Classes should NOT be transpiled.
export default class App {
  // Return types should be removed.
  render(): JSX.Element {
    // JSX should be transpiled.
    return <div>This is a test</div>;
  } 
}
`;
  await benchmarkFiles({
    files: [{ code, path: 'sample.tsx' }],
    numIterations: 1,
    printOutput: true,
  });
}

interface BenchmarkOptions {
  // File contents to process in each iteration.
  files: Array<FileInfo>;
  // Number of times to compile the entire list of files.
  numIterations: number;
  // If true, run each benchmark for a few seconds untimed before starting the
  // timed portion. This leads to a more stable benchmark result, but is not
  // necessarily representative of the speed that would be seen in a typical
  // build system (where warm-up cost often matters).
  warmUp?: boolean;
  // If true, print the resulting source code whenever a file is compiled. This
  // is useful to spot check the output to ensure that each compiler is
  // configured similarly.
  printOutput?: boolean;
  // If true, rather than printing human-readable text to stdout, print JSON
  // (one JSON line per benchmark, though currently this is only used with
  // sucraseOnly, so in that case stdout as a whole is valid JSON), so that the
  // timing results can be read by other tools.
  jsonOutput?: boolean;
}

/**
 * Run the specified benchmark on all transpiler tools. In most cases, we can
 * parse as TSX, but .ts files might use `<type>value` cast syntax, so we need
 * to disable JSX parsing in that case.
 */
async function benchmarkFiles(benchmarkOptions: BenchmarkOptions): Promise<void> {
  if (!benchmarkOptions.jsonOutput) {
    console.log(`Testing against ${numLines(benchmarkOptions)} LOC`);
  }

  process.env.NODE_ENV = 'development';

  await runBenchmark(
    'web',
    benchmarkOptions,
    async (code: string, path: string) =>
      babel.transformSync(code, {
        filename: path,
        presets: [require('../build')],
        caller: {
          name: 'metro',
          // @ts-expect-error
          platform: 'web',
        },
      })!.code!
  );

  await runBenchmark(
    'ios',
    benchmarkOptions,
    async (code: string, path: string) =>
      babel.transformSync(code, {
        filename: path,
        presets: [require('../build')],
        caller: {
          name: 'metro',
          // @ts-expect-error
          platform: 'ios',
        },
      })!.code!
  );

  //   /* eslint-disable @typescript-eslint/require-await */
  //   for (const [name, caller] of [
  //     ['iOS', { platform: 'ios' }],
  //     ['web', { platform: 'web' }],
  //     // ['Server', { platform: 'web', isServer: true }],
  //   ] as const) {
  //     process.env.NODE_ENV = 'development';

  //     await runBenchmark(
  //       name,
  //       benchmarkOptions,
  //       async (code: string, path: string) =>
  //         babel.transformSync(code, {
  //           filename: path,
  //           //   filename: path.endsWith('.ts')
  //           //     ? 'sample.ts'
  //           //     : path.endsWith('.tsx')
  //           //     ? 'sample.tsx'
  //           //     : 'sample.js',
  //           presets: [require('../build')],
  //           caller: {
  //             name: 'metro',
  //             ...caller,
  //           },
  //         })!.code!
  //     );
  //   }
}

export default async function runBenchmark(
  name: string,
  benchmarkOptions: BenchmarkOptions,
  runTrial: (code: string, path: string) => Promise<string>
): Promise<void> {
  if (benchmarkOptions.warmUp) {
    const warmUpTimeNanos = 3e9;
    const warmUpStart = process.hrtime.bigint();
    while (process.hrtime.bigint() - warmUpStart < warmUpTimeNanos) {
      for (const file of benchmarkOptions.files) {
        await runTrial(file.code, file.path);
        if (process.hrtime.bigint() - warmUpStart >= warmUpTimeNanos) {
          break;
        }
      }
    }
  }
  const startTime = process.hrtime.bigint();
  // Collect promises and await them all at the end rather than awaiting them
  // sequentially. For esbuild, this seems to significantly reduce IPC overhead.
  // For all other compilers, this has no effect, and the Promise overhead seems
  // to be tiny.
  const promises: Array<Promise<unknown>> = [];
  for (let i = 0; i < benchmarkOptions.numIterations; i++) {
    for (const file of benchmarkOptions.files) {
      if (benchmarkOptions.printOutput) {
        promises.push(
          (async () => {
            const code = await runTrial(file.code, file.path);
            console.log(`\n\n${name} output for ${file.path}:\n${code}\n`);
          })()
        );
      } else {
        promises.push(runTrial(file.code, file.path));
      }
    }
  }
  await Promise.all(promises);
  const totalTime = Number(process.hrtime.bigint() - startTime) / 1e9;
  if (benchmarkOptions.jsonOutput) {
    console.log(
      JSON.stringify({
        name,
        totalTime,
        linesPerSecond: Math.round(numLines(benchmarkOptions) / totalTime),
        totalLines: numLines(benchmarkOptions),
      })
    );
  } else {
    console.log(getSummary(name, totalTime, benchmarkOptions));
  }
}

function getSummary(name: string, totalTime: number, benchmarkOptions: BenchmarkOptions): string {
  let summary = name;
  while (summary.length < 12) {
    summary += ' ';
  }
  summary += `${Math.round(totalTime * 100) / 100} seconds`;
  while (summary.length < 28) {
    summary += ' ';
  }
  summary += `${Math.round(numLines(benchmarkOptions) / totalTime)} lines per second`;
  return summary;
}

function numLines(benchmarkOptions: BenchmarkOptions): number {
  let result = 0;
  for (const file of benchmarkOptions.files) {
    result += file.code.split('\n').length - 1;
  }
  return result * benchmarkOptions.numIterations;
}

main().catch((e) => {
  console.error('Unhandled error:');
  console.error(e);
  process.exitCode = 1;
});
