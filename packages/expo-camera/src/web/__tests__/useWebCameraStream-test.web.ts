/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as Utils from '../WebCameraUtils';
import { useWebCameraStream } from '../useWebCameraStream';

jest.mock('../WebCameraUtils', () => ({
  ...jest.requireActual('../WebCameraUtils'),
  getPreferredStreamDevice: jest.fn(),
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
  const hook = renderHook(() =>
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
    act(() => {
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
