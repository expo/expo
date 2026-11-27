/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from 'crypto';
import fs from 'fs';
import { vol } from 'memfs';

import type { WorkerMessage } from '../types';
import { Worker } from '../worker';

// memfs is POSIX-only; pin to POSIX path semantics
jest.mock('path', () => jest.requireActual<typeof import('path')>('path').posix);

// Derives a Haste name from the path alone, without reading the file
jest.mock(
  'mock-haste-impl',
  () => ({
    getHasteName: (filePath: string) => filePath.slice(filePath.lastIndexOf('/') + 1, -3),
  }),
  { virtual: true }
);

const defaults: WorkerMessage = {
  computeSha1: false,
  filePath: '/project/notexist.js',
  maybeReturnContent: false,
  pluginsToRun: [],
  returnStats: false,
};

const sha1 = (content: string) => createHash('sha1').update(content).digest('hex');

describe('worker', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      '/project/fruits/Banana.js': 'const Strawberry = require("Strawberry");',
      '/project/fruits/Pear.js': 'const Banana = require("Banana");',
    });
    // Whole milliseconds, as `getTime()` reports them
    vol.utimesSync('/project/fruits/Banana.js', 1700000000, 1700000000);
    vol.utimesSync('/project/fruits/Pear.js', 1700000001, 1700000001);
  });

  test('returns the stats of the content it reads, when asked', () => {
    const worker = new Worker({});
    expect(
      worker.processFile({
        ...defaults,
        computeSha1: true,
        filePath: '/project/fruits/Banana.js',
        returnStats: true,
      })
    ).toEqual({
      pluginData: [],
      sha1: sha1('const Strawberry = require("Strawberry");'),
      stats: { mtime: 1700000000000, size: 41 },
    });
  });

  test('returns stats for data derived without reading content', () => {
    const readFileSync = jest.spyOn(fs, 'readFileSync');
    const worker = new Worker({
      plugins: [
        {
          modulePath: require.resolve('../plugins/haste/worker'),
          setupArgs: { hasteImplModulePath: 'mock-haste-impl' },
        },
      ],
    });
    expect(
      worker.processFile({
        ...defaults,
        filePath: '/project/fruits/Pear.js',
        pluginsToRun: [0],
        returnStats: true,
      })
    ).toEqual({
      pluginData: ['Pear'],
      stats: { mtime: 1700000001000, size: 33 },
    });
    expect(readFileSync).not.toHaveBeenCalled();
  });

  test('does not stat a file unless asked', () => {
    const statSync = jest.spyOn(fs, 'statSync');
    const worker = new Worker({});
    expect(
      worker.processFile({
        ...defaults,
        computeSha1: true,
        filePath: '/project/fruits/Banana.js',
      }).stats
    ).toBeUndefined();
    expect(statSync).not.toHaveBeenCalled();
  });
});
