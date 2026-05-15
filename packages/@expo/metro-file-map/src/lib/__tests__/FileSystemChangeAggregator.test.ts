/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FileMetadata } from '../../types';
import { FileSystemChangeAggregator } from '../FileSystemChangeAggregator';

let aggregator: FileSystemChangeAggregator;

beforeEach(() => {
  aggregator = new FileSystemChangeAggregator();
});

const FOO = 'foo.js';

test('removing, adding, modifying and removing a file records initial data', () => {
  aggregator.fileRemoved(FOO, makeData(0));
  aggregator.fileAdded(FOO, makeData(1));
  aggregator.fileModified(FOO, makeData(1), makeData(2));
  aggregator.fileRemoved(FOO, makeData(2));
  const changes = getData(aggregator);
  expect(changes.removedFiles.size).toBe(1);
  expect(changes.removedFiles.get(FOO)).toEqual(makeData(0));
});

test('modifying then removing a file records initial data', () => {
  aggregator.fileModified(FOO, makeData(0), makeData(1));
  aggregator.fileRemoved(FOO, makeData(1));
  const changes = getData(aggregator);
  expect(changes.removedFiles.size).toBe(1);
  expect(changes.modifiedFiles.size).toBe(0);
  expect(changes.removedFiles.get(FOO)).toEqual(makeData(0));
});

test('adding, modifying then removing a file records empty changes', () => {
  aggregator.fileAdded(FOO, makeData(0));
  aggregator.fileModified(FOO, makeData(0), makeData(1));
  aggregator.fileRemoved(FOO, makeData(1));
  const changes = getData(aggregator);
  expect(changes.addedFiles.size).toBe(0);
  expect(changes.modifiedFiles.size).toBe(0);
  expect(changes.removedFiles.size).toBe(0);
});

afterEach(() => {
  // assert mutual exclusivity
  const changes = aggregator.getView();
  const addedDirectories = new Set(changes.addedDirectories);
  const removedDirectories = new Set(changes.removedDirectories);
  const addedFilePaths = new Set(Array.from(changes.addedFiles, ([path]) => path));
  const modifiedFilePaths = new Set(Array.from(changes.modifiedFiles, ([path]) => path));
  const removedFilePaths = new Set(Array.from(changes.removedFiles, ([path]) => path));
  for (const dir of addedDirectories) {
    expect(removedDirectories.has(dir)).toBe(false);
  }
  for (const dir of removedDirectories) {
    expect(addedDirectories.has(dir)).toBe(false);
  }
  for (const filePath of addedFilePaths) {
    expect(modifiedFilePaths.has(filePath)).toBe(false);
    expect(removedFilePaths.has(filePath)).toBe(false);
  }
  for (const filePath of modifiedFilePaths) {
    expect(addedFilePaths.has(filePath)).toBe(false);
    expect(removedFilePaths.has(filePath)).toBe(false);
  }
  for (const filePath of removedFilePaths) {
    expect(addedFilePaths.has(filePath)).toBe(false);
    expect(modifiedFilePaths.has(filePath)).toBe(false);
  }
});

function makeData(mtime: number = 0): FileMetadata {
  return [mtime, 1, 0, null, 0];
}

function getData(agg: FileSystemChangeAggregator) {
  const view = agg.getView();
  return {
    addedDirectories: new Set(view.addedDirectories),
    removedDirectories: new Set(view.removedDirectories),
    addedFiles: new Map(Array.from(view.addedFiles, ([k, v]) => [k, v])),
    modifiedFiles: new Map(Array.from(view.modifiedFiles, ([k, v]) => [k, v])),
    removedFiles: new Map(Array.from(view.removedFiles, ([k, v]) => [k, v])),
  };
}
