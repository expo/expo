/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'invariant';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import TreeFS from '../../lib/TreeFS';
import type { CrawlerOptions, CrawlResult } from '../../types';
import nodeCrawl from '../node';
import watchmanCrawl from '../watchman';

// These tests crawl a real directory, so they need the real filesystem.
jest.unmock('fs');
jest.unmock('fs/promises');

jest.useRealTimers();

// At runtime we use a more sophisticated + robust Watchman capability check,
// but this simple heuristic is fast to check, synchronous (we can't
// asynchronously skip tests: https://github.com/facebook/jest/issues/8604),
// and will tend to exercise our Watchman tests whenever possible.
const isWatchmanOnPath = () => {
  try {
    execSync(os.platform() === 'win32' ? 'where.exe /Q watchman' : 'which watchman');
    return true;
  } catch {
    return false;
  }
};

type Crawler = (options: CrawlerOptions) => Promise<CrawlResult>;

const CRAWLERS: { [key: string]: Crawler | null | undefined } = {
  'node-recursive': (opts) => {
    return nodeCrawl(opts);
  },
  watchman: isWatchmanOnPath() ? watchmanCrawl : null,
};

// The fixture directory, created for this suite:
//
//   directory/bar.js
//   directory/other.file
//   foo.js
//   ignored/hidden.js
//   link-to-directory -> directory
//   link-to-foo.js -> foo.js
const FIXTURE_CONTENT = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */
`;

let FIXTURES_DIR: string;

beforeAll(() => {
  FIXTURES_DIR = fs.mkdtempSync(join(fs.realpathSync.native(os.tmpdir()), 'crawler-fixtures-'));
  fs.mkdirSync(join(FIXTURES_DIR, 'directory'));
  fs.writeFileSync(join(FIXTURES_DIR, 'directory', 'bar.js'), FIXTURE_CONTENT);
  fs.writeFileSync(join(FIXTURES_DIR, 'directory', 'other.file'), '');
  fs.writeFileSync(join(FIXTURES_DIR, 'foo.js'), FIXTURE_CONTENT);
  fs.mkdirSync(join(FIXTURES_DIR, 'ignored'));
  fs.writeFileSync(join(FIXTURES_DIR, 'ignored', 'hidden.js'), FIXTURE_CONTENT);
  fs.symlinkSync('directory', join(FIXTURES_DIR, 'link-to-directory'), 'dir');
  fs.symlinkSync('foo.js', join(FIXTURES_DIR, 'link-to-foo.js'), 'file');
});

afterAll(() => {
  fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

// Crawlers may return the target for symlinks *if* they can do so efficiently,
// (Watchman with symlink_target), but otherwise they should return 1 and
// defer to the caller. This matcher helps with nested expectations.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      oneOf(...expectOneOf: unknown[]): unknown;
    }
  }
}

function oneOf(this: jest.MatcherContext, actual: unknown, ...expectOneOf: unknown[]) {
  const pass = expectOneOf.includes(actual);
  return {
    pass,
    message: () =>
      `expected ${this.utils.printReceived(actual)}${
        pass ? ' not' : ''
      } to be in ${this.utils.printExpected(expectOneOf)}`,
  };
}
expect.extend({ oneOf });

const CASES: [boolean, Map<string, unknown>][] = [
  [
    true,
    new Map<string, unknown>([
      ['foo.js', [expect.any(Number), 245, 0, null, 0]],
      [join('directory', 'bar.js'), [expect.any(Number), 245, 0, null, 0]],
      ['link-to-directory', [expect.any(Number), 9, 0, null, expect.oneOf(1, 'directory')]],
      ['link-to-foo.js', [expect.any(Number), 6, 0, null, expect.oneOf(1, 'foo.js')]],
    ]),
  ],
  [
    false,
    new Map<string, unknown>([
      [join('directory', 'bar.js'), [expect.any(Number), 245, 0, null, 0]],
      ['foo.js', [expect.any(Number), 245, 0, null, 0]],
    ]),
  ],
];

describe.each(Object.keys(CRAWLERS))('Crawler integration tests (%s)', (crawlerName) => {
  const crawl = CRAWLERS[crawlerName];
  const maybeTest = crawl ? test : test.skip;

  maybeTest.each(CASES)(
    'Finds the expected files (includeSymlinks: %s)',
    async (includeSymlinks, expectedChangedFiles) => {
      invariant(crawl, 'crawl should not be null within maybeTest');
      const result = await crawl({
        console: global.console,
        previousState: {
          fileSystem: new TreeFS({
            rootDir: FIXTURES_DIR,
            files: new Map([['removed.js', [123, 234, 0, null, 0]]]),
            processFile: () => {
              throw new Error('Not implemented');
            },
          }),
          clocks: new Map(),
        },
        includeSymlinks,
        extensions: ['js'],
        ignore: (path) => path.includes('ignored'),
        roots: [FIXTURES_DIR],
        rootDir: FIXTURES_DIR,
        abortSignal: null,
        computeSha1: false,
        onStatus: () => {},
      });

      // Map comparison is unordered, which is what we want
      expect(result).toMatchObject({
        changedFiles: expectedChangedFiles,
        removedFiles: new Set(['removed.js']),
      });
      if (crawlerName === 'watchman') {
        expect('clocks' in result ? result.clocks : null).toBeInstanceOf(Map);
      }
    }
  );
});
