import ExpoFileSystem from '../ExpoFileSystem';
import {
  File,
  Directory,
  Paths,
  UploadTask,
  DownloadTask,
  UploadType,
  type DownloadPauseState,
} from '../index';

describe('File.upload()', () => {
  const url = 'https://example.com/upload';
  const mockUploadResult = { body: '{"ok":true}', status: 200, headers: { 'x-req-id': '1' } };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts an upload task and resolves with its result', async () => {
    const file = new File(Paths.cache, 'photo.jpg');
    const uploadAsyncSpy = jest
      .spyOn(UploadTask.prototype, 'uploadAsync')
      .mockResolvedValue(mockUploadResult);

    const result = await file.upload(url);

    expect(uploadAsyncSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUploadResult);
  });

  it('forwards upload options through the underlying task', async () => {
    const file = new File(Paths.cache, 'photo.jpg');
    jest
      .spyOn(ExpoFileSystem.FileSystemUploadTask.prototype, 'start')
      .mockResolvedValue({ body: 'validation failed', status: 422, headers: { 'x-error': '1' } });

    const result = await file.upload(url, {
      httpMethod: 'PATCH',
      uploadType: UploadType.MULTIPART,
      headers: { Authorization: 'Bearer token' },
      fieldName: 'asset',
      mimeType: 'image/jpeg',
      parameters: { albumId: '42' },
      sessionType: 'foreground',
    });

    expect(ExpoFileSystem.FileSystemUploadTask.prototype.start).toHaveBeenCalledWith(
      url,
      file,
      expect.objectContaining({
        httpMethod: 'PATCH',
        uploadType: UploadType.MULTIPART,
        headers: { Authorization: 'Bearer token' },
        fieldName: 'asset',
        mimeType: 'image/jpeg',
        parameters: { albumId: '42' },
        sessionType: 'foreground',
      })
    );
    expect(result).toEqual({
      body: 'validation failed',
      status: 422,
      headers: { 'x-error': '1' },
    });
  });
});

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
    const task = new DownloadTask('https://example.com/video.mp4', dest);
    const downloadPromise = task.downloadAsync();
    task.pause();
    await downloadPromise;
    expect(task.state).toBe('paused');

    const state = task.savable();
    expect(state.url).toBe('https://example.com/video.mp4');
    expect(state.fileUri).toBe(dest.uri);
    expect(state.isDirectory).toBe(false);
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
    };
    const task = DownloadTask.fromSavable(state);
    expect(task.state).toBe('paused');
    const savedAgain = task.savable();
    expect(savedAgain.url).toBe('https://example.com/video.mp4');
    expect(savedAgain.resumeData).toBe('saved-resume-data');
  });

  it('fromSavable() creates File destination when isDirectory is false', () => {
    const state: DownloadPauseState = {
      url: 'https://example.com/video.mp4',
      fileUri: 'file:///mock/cache/video.mp4',
      isDirectory: false,
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
      resumeData: 'data',
    };
    const task = DownloadTask.fromSavable(state);
    const saved = task.savable();
    expect(saved.isDirectory).toBe(true);
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
