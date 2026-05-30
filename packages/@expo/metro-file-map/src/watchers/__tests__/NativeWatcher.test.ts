/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import { vol } from 'memfs';

import type { WatcherBackendChangeEvent } from '../../types';
import NativeWatcher from '../NativeWatcher';

function createWatcher(root: string): NativeWatcher {
  return new NativeWatcher(root, {
    dot: true,
    globs: ['**/*.js'],
    ignored: null,
    watchmanDeferStates: [],
  });
}

describe(NativeWatcher, () => {
  const root = '/project';

  beforeEach(() => {
    vol.reset();
  });

  it('does not emit changes for directory events', async () => {
    vol.fromJSON({
      '/project/src/file.js': '',
    });

    const watcher = createWatcher(root);
    const events: WatcherBackendChangeEvent[] = [];
    watcher.onFileEvent((event) => events.push(event));

    await watcher._handleEvent('rename', 'src');

    expect(events).toEqual([]);
  });

  it('still emits changes for watched files', async () => {
    vol.fromJSON({
      '/project/app.js': 'export default null;',
    });

    const watcher = createWatcher(root);
    const events: WatcherBackendChangeEvent[] = [];
    watcher.onFileEvent((event) => events.push(event));

    await watcher._handleEvent('change', 'app.js');

    expect(events).toEqual([
      {
        event: 'touch',
        metadata: {
          modifiedTime: expect.any(Number),
          size: expect.any(Number),
          type: 'f',
        },
        relativePath: 'app.js',
        root,
      },
    ]);
  });
});
