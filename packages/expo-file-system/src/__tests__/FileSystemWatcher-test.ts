import { Platform } from 'expo-modules-core';

import { DEFAULT_DEBOUNCE_MS, Directory, File } from '../..';
import { FileSystemWatcher } from '../FileSystemWatcher';

jest.mock('../ExpoFileSystem', () => {
  const mock = require('../../mocks/FileSystem');

  return {
    __esModule: true,
    default: {
      ...mock,
    },
  };
});

const isNativePlatform = Platform.OS === 'android' || Platform.OS === 'ios';
const describeNative = isNativePlatform ? describe : describe.skip;
const describeWebLike = isNativePlatform ? describe.skip : describe;

describeNative('FileSystemWatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('constructs the native watcher with the default debounce and starts after listening', () => {
    const native = require('../ExpoFileSystem').default;
    const order: string[] = [];
    const remove = jest.fn();
    const stop = jest.fn();

    native.FileSystemWatcher = jest.fn().mockImplementation(() => ({
      addListener: jest.fn(() => {
        order.push('listen');
        return { remove };
      }),
      start: jest.fn(() => {
        order.push('start');
      }),
      stop,
    }));

    const subscription = new FileSystemWatcher(
      'file:///test.txt',
      () => {},
      {},
      (uri) => ({ uri }) as any
    );

    expect(native.FileSystemWatcher).toHaveBeenCalledWith('file:///test.txt', {
      debounce: DEFAULT_DEBOUNCE_MS,
      events: undefined,
    });
    expect(order).toEqual(['listen', 'start']);
    expect(typeof subscription.remove).toBe('function');
  });

  it('maps native events and filters requested event types', () => {
    const native = require('../ExpoFileSystem').default;
    let listener: ((event: any) => void) | undefined;

    native.FileSystemWatcher = jest.fn().mockImplementation(() => ({
      addListener: jest.fn((_event: string, callback: (event: any) => void) => {
        listener = callback;
        return { remove: jest.fn() };
      }),
      start: jest.fn(),
      stop: jest.fn(),
    }));

    const callback = jest.fn();
    const _watcher = new FileSystemWatcher(
      'file:///project',
      callback,
      { events: ['renamed'] },
      (uri, isDirectory) => (isDirectory ? new Directory(uri) : new File(uri))
    );

    listener?.({
      type: 'modified',
      path: 'file:///project/a.txt',
      isDirectory: false,
    });
    expect(callback).not.toHaveBeenCalled();

    listener?.({
      type: 'renamed',
      path: 'file:///project/a.txt',
      isDirectory: false,
      newPath: 'file:///project/b.txt',
      newPathIsDirectory: false,
      nativeEventFlags: 42,
    });

    expect(callback).toHaveBeenCalledTimes(1);
    const [event] = callback.mock.calls[0];
    expect(event.type).toBe('renamed');
    expect(event.target).toBeInstanceOf(File);
    expect(event.newTarget).toBeInstanceOf(File);
    expect(event.target.uri).toBe('file:///project/a.txt');
    expect(event.newTarget.uri).toBe('file:///project/b.txt');
    expect(event.nativeEventFlags).toBe(42);
  });

  it('auto-removes when the watched target is deleted or renamed', () => {
    const native = require('../ExpoFileSystem').default;
    let listener: ((event: any) => void) | undefined;
    const remove = jest.fn();
    const stop = jest.fn();

    native.FileSystemWatcher = jest.fn().mockImplementation(() => ({
      addListener: jest.fn((_event: string, callback: (event: any) => void) => {
        listener = callback;
        return { remove };
      }),
      start: jest.fn(),
      stop,
    }));

    const subscription = new FileSystemWatcher(
      'file:///project/',
      () => {},
      {},
      (uri) => ({ uri }) as any
    );

    listener?.({
      type: 'deleted',
      path: 'file:///project',
      isDirectory: true,
    });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);

    subscription.remove();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('auto-removes even when deleted events are filtered out', () => {
    const native = require('../ExpoFileSystem').default;
    let listener: ((event: any) => void) | undefined;
    const remove = jest.fn();
    const stop = jest.fn();
    const callback = jest.fn();

    native.FileSystemWatcher = jest.fn().mockImplementation(() => ({
      addListener: jest.fn((_event: string, receivedListener: (event: any) => void) => {
        listener = receivedListener;
        return { remove };
      }),
      start: jest.fn(),
      stop,
    }));

    const _watcher = new FileSystemWatcher(
      'file:///project/file.txt',
      callback,
      { events: ['modified'] },
      (uri) =>
        ({
          uri,
        }) as any
    );

    listener?.({
      type: 'deleted',
      path: 'file:///project/file.txt',
      isDirectory: false,
    });

    expect(callback).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describeNative('File.watch and Directory.watch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('File.watch produces File targets', () => {
    const native = require('../ExpoFileSystem').default;
    let listener: ((event: any) => void) | undefined;

    native.FileSystemWatcher = jest.fn().mockImplementation(() => ({
      addListener: jest.fn((_event: string, callback: (event: any) => void) => {
        listener = callback;
        return { remove: jest.fn() };
      }),
      start: jest.fn(),
      stop: jest.fn(),
    }));

    const file = new File('file:///mock/cache/test.txt');
    const callback = jest.fn();

    file.watch(callback);
    listener?.({
      type: 'modified',
      path: 'file:///mock/cache/test.txt',
      isDirectory: false,
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].target).toBeInstanceOf(File);
  });

  it('Directory.watch creates Directory targets for directory events', () => {
    const native = require('../ExpoFileSystem').default;
    let listener: ((event: any) => void) | undefined;

    native.FileSystemWatcher = jest.fn().mockImplementation(() => ({
      addListener: jest.fn((_event: string, callback: (event: any) => void) => {
        listener = callback;
        return { remove: jest.fn() };
      }),
      start: jest.fn(),
      stop: jest.fn(),
    }));

    const directory = new Directory('file:///mock/cache/project');
    const callback = jest.fn();

    directory.watch(callback);
    listener?.({
      type: 'modified',
      path: 'file:///mock/cache/project/',
      isDirectory: true,
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].target).toBeInstanceOf(Directory);
  });
});

describeWebLike('FileSystemWatcher web fallback', () => {
  it('warns and returns a no-op subscription', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { FileSystemWatcher: WebFileSystemWatcher } = require('../FileSystemWatcher.web');

    const subscription = new WebFileSystemWatcher(
      'file:///mock/cache/web.txt',
      () => {},
      {},
      (uri: string) => new File(uri)
    );

    expect(warn).toHaveBeenCalledWith('FileSystemWatcher is not supported on web');
    expect(typeof subscription.remove).toBe('function');
    subscription.remove();

    warn.mockRestore();
  });
});
