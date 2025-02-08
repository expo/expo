import * as ScreenCapture from '../ScreenCapture';

describe('ScreenCapture methods are defined', () => {
  it('isAvailableAsync is defined', async () => {
    expect(ScreenCapture.isAvailableAsync).toBeDefined();
  });

  it('preventScreenCapture is defined', async () => {
    expect(ScreenCapture.preventScreenCaptureAsync).toBeDefined();
  });

  it('allowScreenCapture is defined', async () => {
    expect(ScreenCapture.allowScreenCaptureAsync).toBeDefined();
  });

  it('usePreventScreenCapture hook is defined', async () => {
    expect(ScreenCapture.usePreventScreenCapture).toBeDefined();
  });

  it('addScreenshotListener is defined', async () => {
    expect(ScreenCapture.addScreenshotListener).toBeDefined();
  });

  it('removeScreenshotListener is defined', async () => {
    expect(ScreenCapture.removeScreenshotListener).toBeDefined();
  });

  it('addRecordingListener is defined', async () => {
    expect(ScreenCapture.addRecordingListener).toBeDefined();
  });

  it('removeRecordingListener is defined', async () => {
    expect(ScreenCapture.removeRecordingListener).toBeDefined();
  });
});

describe('Test key functionality', () => {
  it('resolves false for isAvailableAsync on web platform', async () => {
    await expect(ScreenCapture.isAvailableAsync()).resolves.toBeFalsy();
  });

  it('throws for preventScreenCapture on web platform', async () => {
    await expect(ScreenCapture.preventScreenCaptureAsync).rejects.toThrowError('not available');
  });

  it('throws for allowScreenCapture on web platform', async () => {
    await expect(ScreenCapture.allowScreenCaptureAsync).rejects.toThrowError('not available');
  });

  it('throws for addRecordingListener on web platform', async () => {
    await expect(ScreenCapture.addRecordingListener).rejects.toThrowError('not available');
  });

  it('throws for removeRecordingListener on web platform', async () => {
    await expect(ScreenCapture.removeRecordingListener).rejects.toThrowError('not available');
  });
});
