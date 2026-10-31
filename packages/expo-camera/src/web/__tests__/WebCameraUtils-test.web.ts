/**
 * @jest-environment jsdom
 */
import { getOtherStreamDevice, labelMatchesCameraType } from '../WebCameraUtils';

function mockMediaDevices(cameras: { deviceId: string; label: string }[]) {
  const stream = { id: 'stream' } as MediaStream;
  const mediaDevices = {
    enumerateDevices: jest
      .fn()
      .mockResolvedValue([
        { kind: 'audioinput', deviceId: 'mic', label: 'Microphone' },
        ...cameras.map((camera) => ({ kind: 'videoinput', ...camera })),
      ]),
    getUserMedia: jest.fn().mockResolvedValue(stream),
  };
  Object.defineProperty(window.navigator, 'mediaDevices', {
    value: mediaDevices,
    writable: true,
    configurable: true,
  });
  return { mediaDevices, stream };
}

function requestedDeviceId(mediaDevices: { getUserMedia: jest.Mock }) {
  return mediaDevices.getUserMedia.mock.lastCall?.[0].video.deviceId;
}

describe(getOtherStreamDevice, () => {
  it('prefers a camera whose label matches the preferred camera type', async () => {
    const { mediaDevices, stream } = mockMediaDevices([
      { deviceId: 'front', label: 'Microsoft Camera Front' },
      { deviceId: 'webcam', label: 'USB Webcam' },
      { deviceId: 'rear', label: 'Microsoft Camera Rear' },
    ]);

    await expect(getOtherStreamDevice('back', 'front')).resolves.toBe(stream);
    expect(requestedDeviceId(mediaDevices)).toEqual({ exact: 'rear' });
  });

  it('cycles through the cameras when their labels do not identify their type', async () => {
    const { mediaDevices } = mockMediaDevices([
      { deviceId: 'camera-a', label: 'Integrated Webcam' },
      { deviceId: 'camera-b', label: 'USB Camera' },
      { deviceId: 'camera-c', label: 'Document Camera' },
    ]);

    await getOtherStreamDevice('back', 'camera-a');
    expect(requestedDeviceId(mediaDevices)).toEqual({ exact: 'camera-b' });
    await getOtherStreamDevice('front', 'camera-b');
    expect(requestedDeviceId(mediaDevices)).toEqual({ exact: 'camera-c' });
    await getOtherStreamDevice('back', 'camera-c');
    expect(requestedDeviceId(mediaDevices)).toEqual({ exact: 'camera-a' });
  });

  it('resolves to null when there is no other camera', async () => {
    const { mediaDevices } = mockMediaDevices([
      { deviceId: 'camera-a', label: 'Integrated Webcam' },
      // Browsers hide the IDs of devices the page has no permission for.
      { deviceId: '', label: '' },
    ]);

    await expect(getOtherStreamDevice('back', 'camera-a')).resolves.toBeNull();
    expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });
});

describe(labelMatchesCameraType, () => {
  it('matches labels that identify the camera type', () => {
    expect(labelMatchesCameraType('Microsoft Camera Rear', 'back')).toBe(true);
    expect(labelMatchesCameraType('Back Camera', 'back')).toBe(true);
    expect(labelMatchesCameraType('Microsoft Camera Front', 'front')).toBe(true);
    expect(labelMatchesCameraType('FaceTime HD Camera', 'front')).toBe(true);
    expect(labelMatchesCameraType('Microsoft Camera Front', 'back')).toBe(false);
    expect(labelMatchesCameraType('Integrated Webcam', 'back')).toBe(false);
  });
});
