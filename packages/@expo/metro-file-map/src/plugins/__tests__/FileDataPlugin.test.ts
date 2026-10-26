/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FileDataResult, Observations } from '../../types';
import FileDataPlugin from '../FileDataPlugin';

const options = {
  name: 'test-plugin',
  cacheKey: 'test-plugin-1',
  worker: { modulePath: 'mock-worker', setupArgs: {} },
  filter: () => true,
};

const files = {
  lookup: (): { exists: false } => ({ exists: false }),
  fileIterator: () => [],
};

describe('FileDataPlugin', () => {
  test('is not lazy by default', () => {
    expect(new FileDataPlugin<string | null>(options).getWorker().lazy).not.toBe(true);
  });

  test('passes `lazy` to its worker description', () => {
    expect(new FileDataPlugin<string | null>({ ...options, lazy: true }).getWorker()).toEqual({
      worker: options.worker,
      filter: options.filter,
      lazy: true,
    });
  });

  test('getOrComputeFileData throws before the plugin is initialized', () => {
    const plugin = new FileDataPlugin<string | null>(options);
    expect(() => plugin.getOrComputeFileData('/project/package.json')).toThrow(
      'test-plugin plugin has not been initialized'
    );
  });

  test('getOrComputeFileData asks the file map for the data, with observations', async () => {
    const plugin = new FileDataPlugin<string | null>({ ...options, lazy: true });
    const result = {
      exists: true,
      type: 'f',
      realPath: '/project/package.json',
      data: 'file data',
    } as const;
    const getOrComputeFileData = jest.fn<
      FileDataResult<string | null>,
      [string, Observations | undefined | null]
    >(() => result);
    await plugin.initialize({ files, pluginState: null, getOrComputeFileData });
    const observations = {
      existence: new Set<string>(),
      content: new Set<string>(),
    };

    expect(plugin.getOrComputeFileData('/project/package.json', observations)).toBe(result);
    expect(getOrComputeFileData).toHaveBeenCalledWith('/project/package.json', observations);
  });
});
