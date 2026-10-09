/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as Utils from '../WebCameraUtils';
import { useWebCameraStream } from '../useWebCameraStream';

jest.mock('../WebCameraUtils', () => ({
  ...jest.requireActual('../WebCameraUtils'),
  getPreferredStreamDevice: jest.fn(),
  getOtherStreamDevice: jest.fn(),
  syncTrackCapabilities: jest.fn(),
  stopMediaStream: jest.fn(),
  setVideoSource: jest.fn(),
}));

function createStream(id = 'stream-1'): MediaStream {
  return {
    id,
    getTracks: () => [{ getSettings: () => ({ deviceId: id, facingMode: 'user' }) }],
  } as unknown as MediaStream;
}

function createVideo(readyState: number, videoWidth = 640): HTMLVideoElement {
  const video = document.createElement('video');
  Object.defineProperty(video, 'readyState', { value: readyState, configurable: true });
  Object.defineProperty(video, 'videoWidth', { value: videoWidth, configurable: true });
  return video;
}

function setReadyState(video: HTMLVideoElement, readyState: number) {
  Object.defineProperty(video, 'readyState', { value: readyState, configurable: true });
}

async function renderCameraStream(video: HTMLVideoElement) {
  const onCameraReady = jest.fn();
  const onMountError = jest.fn();
  const ref = { current: video };
  const hook = await renderHook(() =>
    useWebCameraStream(ref, 'front', {}, { onCameraReady, onMountError })
  );
  // Wait for `getPreferredStreamDevice` to settle and the stream effect to run.
  await waitFor(() => {
    const hasStream = jest
      .mocked(Utils.setVideoSource)
      .mock.calls.some(([element, stream]) => element === video && stream !== null);
    expect(hasStream || onMountError.mock.calls.length > 0).toBe(true);
  });
  return { ...hook, onCameraReady, onMountError };
}

describe(useWebCameraStream, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Utils.getPreferredStreamDevice).mockResolvedValue(createStream());
  });

  it('does not report the camera as ready before the video has a frame', async () => {
    const video = createVideo(HTMLMediaElement.HAVE_NOTHING, 0);
    const { onCameraReady } = await renderCameraStream(video);

    expect(Utils.setVideoSource).toHaveBeenCalledWith(video, expect.anything());
    expect(onCameraReady).not.toHaveBeenCalled();
  });

  it('reports the camera as ready once the video has a frame to capture', async () => {
    const video = createVideo(HTMLMediaElement.HAVE_NOTHING, 0);
    const { onCameraReady } = await renderCameraStream(video);

    // Some browsers (WebKit) keep a live stream at HAVE_FUTURE_DATA and never settle on HAVE_ENOUGH_DATA.
    setReadyState(video, HTMLMediaElement.HAVE_FUTURE_DATA);
    Object.defineProperty(video, 'videoWidth', { value: 640, configurable: true });
    await act(async () => {
      video.dispatchEvent(new Event('canplay'));
    });

    expect(onCameraReady).toHaveBeenCalledTimes(1);
  });

  it('reports the camera as ready right away if the video is already capturable', async () => {
    const video = createVideo(HTMLMediaElement.HAVE_ENOUGH_DATA);
    const { onCameraReady } = await renderCameraStream(video);

    expect(onCameraReady).toHaveBeenCalledTimes(1);
  });

  it('does not report the camera as ready when the stream cannot be obtained', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(Utils.getPreferredStreamDevice).mockRejectedValue(new Error('NotAllowedError'));
    const video = createVideo(HTMLMediaElement.HAVE_ENOUGH_DATA);
    const { onCameraReady, onMountError } = await renderCameraStream(video);

    expect(onMountError).toHaveBeenCalledTimes(1);
    expect(onCameraReady).not.toHaveBeenCalled();
  });
});

function createCameraStream(
  id: string,
  deviceId: string,
  { facingMode, label = '' }: { facingMode?: string; label?: string } = {}
): MediaStream {
  return {
    id,
    getTracks: () => [{ label, getSettings: () => ({ deviceId, facingMode }) }],
  } as unknown as MediaStream;
}

describe('useWebCameraStream camera switching', () => {
  const video = createVideo(HTMLMediaElement.HAVE_ENOUGH_DATA);
  const activeStream = createCameraStream('stream-1', 'camera-a');

  function hasVideoSource(stream: MediaStream) {
    return jest
      .mocked(Utils.setVideoSource)
      .mock.calls.some(([element, source]) => element === video && source === stream);
  }

  async function renderAndToggleCamera() {
    const ref = { current: video };
    const hook = await renderHook(
      ({ type }: { type: 'front' | 'back' }) => useWebCameraStream(ref, type, {}, {}),
      { initialProps: { type: 'front' } }
    );
    await waitFor(() => expect(hasVideoSource(activeStream)).toBe(true));
    await act(async () => {
      hook.rerender({ type: 'back' });
    });
    return hook;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('switches to another camera when the browser returns the active camera', async () => {
    // e.g. Windows camera drivers that don't report `facingMode`
    const duplicateStream = createCameraStream('stream-2', 'camera-a');
    const alternativeStream = createCameraStream('stream-3', 'camera-b');
    jest
      .mocked(Utils.getPreferredStreamDevice)
      .mockResolvedValueOnce(activeStream)
      .mockResolvedValueOnce(duplicateStream);
    jest.mocked(Utils.getOtherStreamDevice).mockResolvedValue(alternativeStream);

    await renderAndToggleCamera();

    await waitFor(() => expect(hasVideoSource(alternativeStream)).toBe(true));
    expect(Utils.getOtherStreamDevice).toHaveBeenCalledWith('back', 'camera-a');
    expect(Utils.stopMediaStream).toHaveBeenCalledWith(duplicateStream);
  });

  it('keeps the active camera when there is no other camera', async () => {
    const duplicateStream = createCameraStream('stream-2', 'camera-a');
    jest
      .mocked(Utils.getPreferredStreamDevice)
      .mockResolvedValueOnce(activeStream)
      .mockResolvedValueOnce(duplicateStream);
    jest.mocked(Utils.getOtherStreamDevice).mockResolvedValue(null);

    await renderAndToggleCamera();

    await waitFor(() => expect(Utils.getOtherStreamDevice).toHaveBeenCalled());
    expect(Utils.stopMediaStream).toHaveBeenCalledWith(duplicateStream);
    expect(jest.mocked(Utils.setVideoSource).mock.lastCall).toEqual([video, activeStream]);
  });

  it('keeps the active camera when switching to another camera fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest
      .mocked(Utils.getPreferredStreamDevice)
      .mockResolvedValueOnce(activeStream)
      .mockResolvedValueOnce(createCameraStream('stream-2', 'camera-a'));
    jest.mocked(Utils.getOtherStreamDevice).mockRejectedValue(new Error('NotReadableError'));

    await renderAndToggleCamera();

    await waitFor(() => expect(Utils.getOtherStreamDevice).toHaveBeenCalled());
    expect(jest.mocked(Utils.setVideoSource).mock.lastCall).toEqual([video, activeStream]);
  });

  it('uses the camera returned by the browser when it is a different camera', async () => {
    const backStream = createCameraStream('stream-2', 'camera-b', { facingMode: 'environment' });
    jest
      .mocked(Utils.getPreferredStreamDevice)
      .mockResolvedValueOnce(activeStream)
      .mockResolvedValueOnce(backStream);

    const { result } = await renderAndToggleCamera();

    await waitFor(() => expect(hasVideoSource(backStream)).toBe(true));
    expect(Utils.getOtherStreamDevice).not.toHaveBeenCalled();
    expect(Utils.stopMediaStream).not.toHaveBeenCalled();
    expect(result.current.type).toBe('back');
  });

  it('derives the camera type from the label when facingMode is not reported', async () => {
    const rearStream = createCameraStream('stream-3', 'camera-b', {
      label: 'Microsoft Camera Rear',
    });
    jest
      .mocked(Utils.getPreferredStreamDevice)
      .mockResolvedValueOnce(activeStream)
      .mockResolvedValueOnce(createCameraStream('stream-2', 'camera-a'));
    jest.mocked(Utils.getOtherStreamDevice).mockResolvedValue(rearStream);

    const { result } = await renderAndToggleCamera();

    await waitFor(() => expect(result.current.type).toBe('back'));
  });
});

describe(Utils.isVideoReadyForCapture, () => {
  it('requires a decoded frame with known dimensions', () => {
    expect(Utils.isVideoReadyForCapture(createVideo(HTMLMediaElement.HAVE_METADATA))).toBe(false);
    expect(Utils.isVideoReadyForCapture(createVideo(HTMLMediaElement.HAVE_CURRENT_DATA, 0))).toBe(
      false
    );
    expect(Utils.isVideoReadyForCapture(createVideo(HTMLMediaElement.HAVE_CURRENT_DATA))).toBe(
      true
    );
    expect(Utils.isVideoReadyForCapture(createVideo(HTMLMediaElement.HAVE_ENOUGH_DATA))).toBe(true);
  });
});
