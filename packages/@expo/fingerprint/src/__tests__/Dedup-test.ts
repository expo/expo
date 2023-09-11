import { dedupSources } from '../Dedup';
import type { HashSource } from '../Fingerprint.types';

describe(dedupSources, () => {
  it('should dedup descendant dir - ancestor coming first', () => {
    const sources: HashSource[] = [
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root'],
      },
      {
        type: 'dir',
        filePath: 'android/app',
        reasons: ['subfolder'],
      },
    ];

    expect(dedupSources(sources, '/app')).toEqual([
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root', 'subfolder'],
      },
    ]);
  });

  it('should dedup descendant dir - ancestor coming later', () => {
    const sources: HashSource[] = [
      {
        type: 'dir',
        filePath: 'android/app',
        reasons: ['subfolder'],
      },
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root'],
      },
    ];

    expect(dedupSources(sources, '/app')).toEqual([
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root', 'subfolder'],
      },
    ]);
  });

  it('should dedup descendant file - file coming first', () => {
    const sources: HashSource[] = [
      {
        type: 'file',
        filePath: 'android/app/build.gradle',
        reasons: ['file'],
      },
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root'],
      },
    ];

    expect(dedupSources(sources, '/app')).toEqual([
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root', 'file'],
      },
    ]);
  });

  it('should dedup descendant file - file coming later', () => {
    const sources: HashSource[] = [
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root'],
      },
      {
        type: 'file',
        filePath: 'android/app/build.gradle',
        reasons: ['file'],
      },
    ];

    expect(dedupSources(sources, '/app')).toEqual([
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root', 'file'],
      },
    ]);
  });

  it('should dedup slibings dir', () => {
    const sources: HashSource[] = [
      {
        type: 'dir',
        filePath: 'node_modules/expo',
        reasons: ['expo'],
      },
      {
        type: 'dir',
        filePath: 'node_modules/expo-modules-core',
        reasons: ['expo-modules-core'],
      },
    ];

    expect(dedupSources(sources, '/app')).toEqual([
      {
        type: 'dir',
        filePath: 'node_modules/expo',
        reasons: ['expo'],
      },
      {
        type: 'dir',
        filePath: 'node_modules/expo-modules-core',
        reasons: ['expo-modules-core'],
      },
    ]);
  });

  it('should keep unique contents by its id', () => {
    const sources: HashSource[] = [
      {
        type: 'contents',
        id: 'foo',
        contents: 'foo:1',
        reasons: ['foo:1'],
      },
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root'],
      },
      {
        type: 'contents',
        id: 'foo',
        contents: 'foo:2',
        reasons: ['foo:2'],
      },
    ];

    expect(dedupSources(sources, '/app')).toEqual([
      {
        type: 'contents',
        id: 'foo',
        contents: 'foo:1',
        reasons: ['foo:1', 'foo:2'],
      },
      {
        type: 'dir',
        filePath: 'android',
        reasons: ['root'],
      },
    ]);
  });

  it('should throw error when a dir is descendant of a file', () => {
    const sources: HashSource[] = [
      {
        type: 'file',
        filePath: 'android',
        reasons: ['file'],
      },
      {
        type: 'dir',
        filePath: 'android/app',
        reasons: ['dir'],
      },
    ];

    expect(() => dedupSources(sources, '/app')).toThrow();
  });
});
