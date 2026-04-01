import ExpoFileSystem from '../ExpoFileSystem';
import {
  File,
  Directory,
  Paths,
  UploadTask,
  DownloadTask,
  type DownloadPauseState,
} from '../index';

describe('UploadTask', () => {
  let file: File;
  const url = 'https://example.com/upload';
  const mockUploadResult = { body: '{"ok":true}', status: 200, headers: { 'x-req-id': '1' } };

  beforeEach(() => {
    file = new File(Paths.cache, 'photo.jpg');
    // Default mock: successful upload
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start')
      .mockResolvedValue(mockUploadResult);
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'cancel')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in idle state', () => {
    const task = new UploadTask(file, url);
    expect(task.state).toBe('idle');
  });

  it('transitions to active then completed on successful upload', async () => {
    const task = new UploadTask(file, url);
    const promise = task.uploadAsync();
    expect(task.state).toBe('active');
    const result = await promise;
    expect(task.state).toBe('completed');
    expect(result).toEqual(mockUploadResult);
  });

  it('transitions to error on failure', async () => {
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start')
      .mockRejectedValue(new Error('network error'));

    const task = new UploadTask(file, url);
    await expect(task.uploadAsync()).rejects.toThrow('network error');
    expect(task.state).toBe('error');
  });

  it('cancel() sets state to cancelled', () => {
    const task = new UploadTask(file, url);
    // Move to active first so cancel is meaningful
    task.uploadAsync().catch(() => {});
    expect(task.state).toBe('active');
    task.cancel();
    expect(task.state).toBe('cancelled');
  });

  it('uploadAsync() throws if not in idle state', async () => {
    const task = new UploadTask(file, url);
    // Start first upload
    const p = task.uploadAsync();
    // Second call while active should throw
    await expect(task.uploadAsync()).rejects.toThrow('Cannot call uploadAsync() in state "active"');
    await p;
  });

  it('cancel() is a no-op in terminal states', async () => {
    const task = new UploadTask(file, url);
    await task.uploadAsync();
    expect(task.state).toBe('completed');
    // Should not throw and state should remain completed
    task.cancel();
    expect(task.state).toBe('completed');
  });

  it('cancel() is a no-op in cancelled state', () => {
    const task = new UploadTask(file, url);
    task.uploadAsync().catch(() => {});
    task.cancel();
    expect(task.state).toBe('cancelled');
    task.cancel();
    expect(task.state).toBe('cancelled');
  });

  it('cancel() is a no-op in error state', async () => {
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start')
      .mockRejectedValue(new Error('fail'));

    const task = new UploadTask(file, url);
    await expect(task.uploadAsync()).rejects.toThrow();
    expect(task.state).toBe('error');
    task.cancel();
    expect(task.state).toBe('error');
  });

  it('cancel() keeps the task in cancelled state after the upload promise rejects', async () => {
    let rejectUpload!: (reason: Error) => void;
    jest.spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start').mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectUpload = reject;
        })
    );

    const task = new UploadTask(file, url);
    const uploadPromise = task.uploadAsync();
    task.cancel();
    rejectUpload(new Error('upload cancelled natively'));

    await expect(uploadPromise).rejects.toThrow('upload cancelled natively');
    expect(task.state).toBe('cancelled');
  });

  it('forwards sessionType to native start calls', async () => {
    const task = new UploadTask(file, url, {
      sessionType: 'foreground',
    });

    await task.uploadAsync();

    expect(ExpoFileSystem.FileSystemUploadTask.prototype.start).toHaveBeenCalledWith(
      url,
      file,
      expect.objectContaining({ sessionType: 'foreground' })
    );
  });

  it('defaults upload sessionType to undefined (native defaults to background)', async () => {
    const task = new UploadTask(file, url);

    await task.uploadAsync();

    expect(ExpoFileSystem.FileSystemUploadTask.prototype.start).toHaveBeenCalledWith(
      url,
      file,
      expect.objectContaining({ sessionType: undefined })
    );
  });
});

describe('DownloadTask', () => {
  const url = 'https://example.com/video.mp4';
  let destination: File;
  const mockOutputUri = 'file:///mock/cache/video.mp4';

  beforeEach(() => {
    destination = new File(Paths.cache, 'video.mp4');
    // Default mock: successful download
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start')
      .mockResolvedValue(mockOutputUri);
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'pause')
      .mockReturnValue({ resumeData: 'mock-resume-data' });
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'resume')
      .mockResolvedValue(mockOutputUri);
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'cancel')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in idle state', () => {
    const task = new DownloadTask(url, destination);
    expect(task.state).toBe('idle');
  });

  it('transitions to active then completed on successful download', async () => {
    const task = new DownloadTask(url, destination);
    const promise = task.downloadAsync();
    expect(task.state).toBe('active');
    const result = await promise;
    expect(task.state).toBe('completed');
    expect(result).toBeInstanceOf(File);
    expect(result!.uri).toContain('video.mp4');
  });

  it('forwards sessionType to native start and resume calls', async () => {
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockResolvedValue(null);

    const task = new DownloadTask(url, destination, {
      sessionType: 'foreground',
    });

    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;

    expect(ExpoFileSystem.FileSystemDownloadTask.prototype.start).toHaveBeenCalledWith(
      url,
      destination,
      expect.objectContaining({ sessionType: 'foreground' })
    );

    await task.resumeAsync();

    expect(ExpoFileSystem.FileSystemDownloadTask.prototype.resume).toHaveBeenCalledWith(
      url,
      destination,
      'mock-resume-data',
      expect.objectContaining({ sessionType: 'foreground' })
    );
  });

  it('keeps download sessionType undefined when options are provided without sessionType', async () => {
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockResolvedValue(null);

    const task = new DownloadTask(url, destination, {
      headers: { Authorization: 'Bearer token' },
    });

    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;

    expect(ExpoFileSystem.FileSystemDownloadTask.prototype.start).toHaveBeenCalledWith(
      url,
      destination,
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        sessionType: undefined,
      })
    );

    await task.resumeAsync();

    expect(ExpoFileSystem.FileSystemDownloadTask.prototype.resume).toHaveBeenCalledWith(
      url,
      destination,
      'mock-resume-data',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        sessionType: undefined,
      })
    );
  });

  it('transitions to active then paused when native returns null', async () => {
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockResolvedValue(null);

    const task = new DownloadTask(url, destination);
    const result = await task.downloadAsync();
    expect(task.state).toBe('paused');
    expect(result).toBeNull();
  });

  it('pause() throws if not in active state', () => {
    const task = new DownloadTask(url, destination);
    expect(() => task.pause()).toThrow('Cannot call pause() in state "idle"');
  });

  it('resumeAsync() throws if not in paused state', async () => {
    const task = new DownloadTask(url, destination);
    await expect(task.resumeAsync()).rejects.toThrow('Cannot call resumeAsync() in state "idle"');
  });

  it('resumeAsync() throws if no resume data available', async () => {
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockResolvedValue(null);
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'pause')
      .mockReturnValue({ resumeData: undefined as unknown as string });

    const task = new DownloadTask(url, destination);
    // Start then get paused via native returning null
    // But pause() was called with no resumeData
    // We need to trigger pause during active state so native resolves with null
    // However, the resumeData comes from calling pause() on the native side.
    // Let's simulate: start download, call pause() (which returns no resumeData), native resolves null
    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;
    expect(task.state).toBe('paused');
    await expect(task.resumeAsync()).rejects.toThrow('No resume data available');
  });

  it('cancel() sets state to cancelled from active', () => {
    const task = new DownloadTask(url, destination);
    task.downloadAsync().catch(() => {});
    expect(task.state).toBe('active');
    task.cancel();
    expect(task.state).toBe('cancelled');
  });

  it('downloadAsync() throws if not in idle state', async () => {
    const task = new DownloadTask(url, destination);
    const p = task.downloadAsync();
    await expect(task.downloadAsync()).rejects.toThrow(
      'Cannot call downloadAsync() in state "active"'
    );
    await p;
  });

  it('transitions to error on download failure', async () => {
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start')
      .mockRejectedValue(new Error('network error'));

    const task = new DownloadTask(url, destination);
    await expect(task.downloadAsync()).rejects.toThrow('network error');
    expect(task.state).toBe('error');
  });

  it('cancel() is a no-op in terminal states', async () => {
    const task = new DownloadTask(url, destination);
    await task.downloadAsync();
    expect(task.state).toBe('completed');
    task.cancel();
    expect(task.state).toBe('completed');
  });

  it('cancel() keeps the task in cancelled state after the download promise rejects', async () => {
    let rejectDownload!: (reason: Error) => void;
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectDownload = reject;
        })
    );

    const task = new DownloadTask(url, destination);
    const downloadPromise = task.downloadAsync();
    task.cancel();
    rejectDownload(new Error('download cancelled natively'));

    await expect(downloadPromise).rejects.toThrow('download cancelled natively');
    expect(task.state).toBe('cancelled');
  });
});

describe('AbortSignal integration', () => {
  beforeEach(() => {
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start')
      .mockResolvedValue({ body: '', status: 200, headers: {} });
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'cancel')
      .mockImplementation(() => {});
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start')
      .mockResolvedValue('file:///mock/cache/file');
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'cancel')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pre-aborted signal throws AbortError from uploadAsync()', async () => {
    const controller = new AbortController();
    controller.abort();
    const file = new File(Paths.cache, 'photo.jpg');
    const task = new UploadTask(file, 'https://example.com/upload', {
      signal: controller.signal,
    });
    await expect(task.uploadAsync()).rejects.toThrow('The operation was aborted');
    expect(task.state).toBe('cancelled');
  });

  it('pre-aborted signal throws AbortError from downloadAsync()', async () => {
    const controller = new AbortController();
    controller.abort();
    const dest = new File(Paths.cache, 'video.mp4');
    const task = new DownloadTask('https://example.com/video.mp4', dest, {
      signal: controller.signal,
    });
    await expect(task.downloadAsync()).rejects.toThrow('The operation was aborted');
    expect(task.state).toBe('cancelled');
  });

  it('aborting during active upload throws AbortError (not native error)', async () => {
    const controller = new AbortController();
    let rejectNative!: (reason: Error) => void;
    jest.spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectNative = reject;
        })
    );
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'cancel')
      .mockImplementation(function (this: any) {
        // Simulate native cancel rejecting the start promise
        rejectNative(new Error('upload cancelled natively'));
      });

    const file = new File(Paths.cache, 'photo.jpg');
    const task = new UploadTask(file, 'https://example.com/upload', {
      signal: controller.signal,
    });
    const promise = task.uploadAsync();

    controller.abort();

    const error: Error = await promise.catch((e) => e);
    expect(error.name).toBe('AbortError');
    expect(error.message).toBe('The operation was aborted.');
    expect(task.state).toBe('cancelled');
  });

  it('aborting during active download throws AbortError (not native error)', async () => {
    const controller = new AbortController();
    let rejectNative!: (reason: Error) => void;
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectNative = reject;
        })
    );
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'cancel')
      .mockImplementation(function (this: any) {
        rejectNative(new Error('download cancelled natively'));
      });

    const dest = new File(Paths.cache, 'video.mp4');
    const task = new DownloadTask('https://example.com/video.mp4', dest, {
      signal: controller.signal,
    });
    const promise = task.downloadAsync();

    controller.abort();

    const error: Error = await promise.catch((e) => e);
    expect(error.name).toBe('AbortError');
    expect(error.message).toBe('The operation was aborted.');
    expect(task.state).toBe('cancelled');
  });

  it('aborting during active download sets state before promise settles', async () => {
    const controller = new AbortController();
    let rejectNative!: (reason: Error) => void;
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectNative = reject;
        })
    );
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'cancel')
      .mockImplementation(function (this: any) {
        rejectNative(new Error('cancelled'));
      });

    const dest = new File(Paths.cache, 'video.mp4');
    const task = new DownloadTask('https://example.com/video.mp4', dest, {
      signal: controller.signal,
    });
    const promise = task.downloadAsync();

    // Abort via signal
    controller.abort();

    await promise.catch(() => {});
    // After the promise settles, state must be 'cancelled'
    expect(task.state).toBe('cancelled');
  });
});

describe('DownloadPauseState persistence', () => {
  beforeEach(() => {
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockResolvedValue(null);
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'pause')
      .mockReturnValue({ resumeData: 'resume-blob' });
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'resume')
      .mockResolvedValue('file:///mock/cache/video.mp4');
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'cancel')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('savable() throws if not in paused state', () => {
    const task = new DownloadTask('https://example.com/f', new File(Paths.cache, 'f'));
    expect(() => task.savable()).toThrow('Cannot call savable() in state "idle"');
  });

  it('savable() returns correct state with isDirectory false for File destination', async () => {
    const dest = new File(Paths.cache, 'video.mp4');
    const task = new DownloadTask('https://example.com/video.mp4', dest, {
      sessionType: 'foreground',
    });
    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;
    expect(task.state).toBe('paused');

    const state = task.savable();
    expect(state.url).toBe('https://example.com/video.mp4');
    expect(state.fileUri).toBe(dest.uri);
    expect(state.isDirectory).toBe(false);
    expect(state.sessionType).toBe('foreground');
    expect(state.resumeData).toBe('resume-blob');
  });

  it('savable() returns correct state with isDirectory true for Directory destination', async () => {
    const dest = new Directory(Paths.cache, 'downloads');
    const task = new DownloadTask('https://example.com/video.mp4', dest);
    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;

    const state = task.savable();
    expect(state.isDirectory).toBe(true);
  });

  it('fromSavable() throws if no resumeData', () => {
    const state: DownloadPauseState = {
      url: 'https://example.com/f',
      fileUri: 'file:///mock/cache/f',
      isDirectory: false,
      sessionType: 'background',
    };
    expect(() => DownloadTask.fromSavable(state)).toThrow(
      'Cannot restore task: DownloadPauseState has no resumeData'
    );
  });

  it('fromSavable() creates task in paused state with correct properties', () => {
    const state: DownloadPauseState = {
      url: 'https://example.com/video.mp4',
      fileUri: 'file:///mock/cache/video.mp4',
      isDirectory: false,
      resumeData: 'saved-resume-data',
      headers: { Authorization: 'Bearer token' },
      sessionType: 'foreground',
    };
    const task = DownloadTask.fromSavable(state);
    expect(task.state).toBe('paused');
    const savedAgain = task.savable();
    expect(savedAgain.url).toBe('https://example.com/video.mp4');
    expect(savedAgain.sessionType).toBe('foreground');
    expect(savedAgain.resumeData).toBe('saved-resume-data');
  });

  it('fromSavable() creates File destination when isDirectory is false', () => {
    const state: DownloadPauseState = {
      url: 'https://example.com/video.mp4',
      fileUri: 'file:///mock/cache/video.mp4',
      isDirectory: false,
      sessionType: 'background',
      resumeData: 'data',
    };
    const task = DownloadTask.fromSavable(state);
    const saved = task.savable();
    expect(saved.isDirectory).toBe(false);
  });

  it('fromSavable() creates Directory destination when isDirectory is true', () => {
    const state: DownloadPauseState = {
      url: 'https://example.com/video.mp4',
      fileUri: 'file:///mock/cache/',
      isDirectory: true,
      sessionType: 'background',
      resumeData: 'data',
    };
    const task = DownloadTask.fromSavable(state);
    const saved = task.savable();
    expect(saved.isDirectory).toBe(true);
  });
});

describe('DownloadTask persistence store', () => {
  const storageKeyPrefix = 'expo-file-system:download-task:';
  const customKeyPrefix = 'custom-prefix:';

  function createStore() {
    const data = new Map<string, string>();
    return {
      data,
      getItem: jest.fn(async (key: string) => data.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        data.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        data.delete(key);
      }),
    };
  }

  beforeEach(() => {
    jest.spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start').mockResolvedValue(null);
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'pause')
      .mockReturnValue({ resumeData: 'resume-blob' });
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'resume')
      .mockResolvedValue('file:///mock/cache/video.mp4');
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'cancel')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates an id only when persistence is configured', () => {
    const regularTask = new DownloadTask('https://example.com/f', new File(Paths.cache, 'f'));
    expect(regularTask.id).toBeNull();

    const store = createStore();
    const persistedTask = new DownloadTask('https://example.com/f', new File(Paths.cache, 'f2'), {
      persistenceConfig: { backend: store },
    });

    expect(typeof persistedTask.id).toBe('string');
    expect(persistedTask.id).toBeTruthy();
    expect(store.setItem).not.toHaveBeenCalled();
  });

  it('uses a custom key prefix when provided', async () => {
    const store = createStore();
    const task = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video.mp4'),
      {
        persistenceConfig: { backend: store, keyPrefix: customKeyPrefix },
      }
    );

    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;

    expect(store.setItem.mock.calls[0]![0]).toBe(`${customKeyPrefix}${task.id}`);
  });

  it('uses a custom id when provided', () => {
    const store = createStore();
    const task = new DownloadTask('https://example.com/f', new File(Paths.cache, 'f2'), {
      persistenceConfig: { backend: store, customId: 'download-123' },
    });

    expect(task.id).toBe('download-123');
  });

  it('uses both custom key prefix and custom id when provided', async () => {
    const store = createStore();
    const task = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video.mp4'),
      {
        persistenceConfig: {
          backend: store,
          keyPrefix: customKeyPrefix,
          customId: 'download-123',
        },
      }
    );

    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;

    expect(task.id).toBe('download-123');
    expect(store.setItem.mock.calls[0]![0]).toBe(`${customKeyPrefix}download-123`);
  });

  it('persists paused state after pause and active operation settles', async () => {
    const store = createStore();
    const task = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video.mp4'),
      {
        persistenceConfig: { backend: store },
        headers: { Authorization: 'Bearer token' },
        sessionType: 'foreground',
      }
    );

    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;

    expect(task.state).toBe('paused');
    expect(store.setItem).toHaveBeenCalledTimes(1);

    const [storageKey, payload] = store.setItem.mock.calls[0]!;
    expect(storageKey).toBe(`${storageKeyPrefix}${task.id}`);
    expect(JSON.parse(payload)).toEqual({
      version: 1,
      pauseState: {
        url: 'https://example.com/video.mp4',
        fileUri: new File(Paths.cache, 'video.mp4').uri,
        isDirectory: false,
        headers: { Authorization: 'Bearer token' },
        sessionType: 'foreground',
        resumeData: 'resume-blob',
      },
    });
  });

  it('pauseAsync waits for store write to finish', async () => {
    let resolveSetItem!: () => void;
    const store = createStore();
    store.setItem.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSetItem = resolve;
        })
    );

    const task = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video.mp4'),
      {
        persistenceConfig: { backend: store },
      }
    );

    const downloadPromise = task.downloadAsync();
    const pausePromise = task.pauseAsync();
    await downloadPromise;

    let resolved = false;
    pausePromise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);

    resolveSetItem();
    await pausePromise;
    expect(resolved).toBe(true);
  });

  it('restoreAsync returns null for missing or corrupt records', async () => {
    const missingStore = createStore();
    await expect(
      DownloadTask.restoreAsync('missing-task', {
        persistenceConfig: { backend: missingStore },
      })
    ).resolves.toBeNull();

    const corruptStore = createStore();
    corruptStore.data.set(`${storageKeyPrefix}corrupt-task`, '{not-json');

    await expect(
      DownloadTask.restoreAsync('corrupt-task', {
        persistenceConfig: { backend: corruptStore },
      })
    ).resolves.toBeNull();
    expect(corruptStore.removeItem).toHaveBeenCalledWith(`${storageKeyPrefix}corrupt-task`);
  });

  it('restoreAsync reads the correct key when a custom prefix is provided', async () => {
    const store = createStore();
    store.data.set(
      `${customKeyPrefix}saved-task`,
      JSON.stringify({
        version: 1,
        pauseState: {
          url: 'https://example.com/video.mp4',
          fileUri: 'file:///mock/cache/video.mp4',
          isDirectory: false,
          headers: { Authorization: 'Bearer token' },
          sessionType: 'foreground',
          resumeData: 'saved-resume-data',
        },
      })
    );

    const task = await DownloadTask.restoreAsync('saved-task', {
      persistenceConfig: { backend: store, keyPrefix: customKeyPrefix },
    });

    expect(store.getItem).toHaveBeenCalledWith(`${customKeyPrefix}saved-task`);
    expect(task?.id).toBe('saved-task');
  });

  it('restoreAsync rebuilds a paused task and preserves saved headers', async () => {
    const store = createStore();
    store.data.set(
      `${storageKeyPrefix}saved-task`,
      JSON.stringify({
        version: 1,
        pauseState: {
          url: 'https://example.com/video.mp4',
          fileUri: 'file:///mock/cache/video.mp4',
          isDirectory: false,
          headers: { Authorization: 'Bearer token' },
          sessionType: 'foreground',
          resumeData: 'saved-resume-data',
        },
      })
    );

    const onProgress = jest.fn();
    const controller = new AbortController();

    const task = await DownloadTask.restoreAsync('saved-task', {
      persistenceConfig: { backend: store },
      onProgress,
      signal: controller.signal,
    });

    expect(task).not.toBeNull();
    expect(task!.id).toBe('saved-task');
    expect(task!.state).toBe('paused');
    expect(task!.savable()).toEqual({
      url: 'https://example.com/video.mp4',
      fileUri: 'file:///mock/cache/video.mp4',
      isDirectory: false,
      headers: { Authorization: 'Bearer token' },
      sessionType: 'foreground',
      resumeData: 'saved-resume-data',
    });
  });

  it('removes persisted data after successful resume, cancel, and terminal failure', async () => {
    const store = createStore();
    const task = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video.mp4'),
      {
        persistenceConfig: { backend: store },
      }
    );

    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;

    await task.resumeAsync();
    expect(store.removeItem).toHaveBeenCalledWith(`${storageKeyPrefix}${task.id}`);

    store.removeItem.mockClear();
    const cancelTask = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video2.mp4'),
      {
        persistenceConfig: { backend: store },
      }
    );
    cancelTask.downloadAsync().catch(() => {});
    cancelTask.cancel();
    await Promise.resolve();
    expect(store.removeItem).toHaveBeenCalledWith(`${storageKeyPrefix}${cancelTask.id}`);

    store.removeItem.mockClear();
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start')
      .mockRejectedValueOnce(new Error('network error'));
    const failingTask = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video3.mp4'),
      { persistenceConfig: { backend: store } }
    );
    await expect(failingTask.downloadAsync()).rejects.toThrow('network error');
    expect(store.removeItem).toHaveBeenCalledWith(`${storageKeyPrefix}${failingTask.id}`);
  });

  it('overwrites the same storage key across repeated pause and resume cycles', async () => {
    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'resume')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('file:///mock/cache/video.mp4');

    const store = createStore();
    const task = new DownloadTask(
      'https://example.com/video.mp4',
      new File(Paths.cache, 'video.mp4'),
      {
        persistenceConfig: { backend: store },
      }
    );

    const firstDownload = task.downloadAsync();
    task.pause();
    await firstDownload;

    const resumedDownload = task.resumeAsync();
    task.pause();
    await resumedDownload;

    expect(store.setItem).toHaveBeenCalledTimes(2);
    expect(store.setItem.mock.calls[0]![0]).toBe(`${storageKeyPrefix}${task.id}`);
    expect(store.setItem.mock.calls[1]![0]).toBe(`${storageKeyPrefix}${task.id}`);
  });
});

describe('Progress callback', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('onProgress callback is wired via addListener for UploadTask', async () => {
    const onProgress = jest.fn();
    const file = new File(Paths.cache, 'photo.jpg');

    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start')
      .mockResolvedValue({ body: '', status: 200, headers: {} });

    const task = new UploadTask(file, 'https://example.com/upload', { onProgress });

    // Spy on addListener to verify it gets called with 'progress'
    const addListenerSpy = jest.spyOn(task, 'addListener');

    await task.uploadAsync();

    expect(addListenerSpy).toHaveBeenCalledWith('progress', onProgress);
  });

  it('onProgress callback is wired via addListener for DownloadTask', async () => {
    const onProgress = jest.fn();
    const dest = new File(Paths.cache, 'video.mp4');

    jest
      .spyOn(ExpoFileSystem.FileSystemDownloadTask.prototype, 'start')
      .mockResolvedValue('file:///mock/cache/video.mp4');

    const task = new DownloadTask('https://example.com/video.mp4', dest, { onProgress });

    const addListenerSpy = jest.spyOn(task, 'addListener');

    await task.downloadAsync();

    expect(addListenerSpy).toHaveBeenCalledWith('progress', onProgress);
  });
});
