/**
 * @jest-environment jsdom
 */

import { PermissionStatus } from '../Camera.types';
import ExponentCameraManager from '../ExpoCameraManager';

jest.mock('../web/WebUserMediaManager', () => {
  const actual = jest.requireActual('../web/WebUserMediaManager');
  return {
    ...actual,
    canGetUserMedia: () => !!globalThis.navigator.mediaDevices?.getUserMedia,
  };
});

describe(ExponentCameraManager.isAvailableAsync, () => {
  it('returns false when getUserMedia is not available', async () => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {},
      writable: true,
      configurable: true,
    });

    expect(await ExponentCameraManager.isAvailableAsync()).toBe(false);
  });

  it('returns false when no video input devices exist', async () => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn(),
        enumerateDevices: jest.fn().mockResolvedValue([
          { kind: 'audioinput', deviceId: 'mic1', label: '' },
          { kind: 'audiooutput', deviceId: 'speaker1', label: '' },
        ]),
      },
      writable: true,
      configurable: true,
    });

    expect(await ExponentCameraManager.isAvailableAsync()).toBe(false);
  });

  it('returns true when a video input device exists', async () => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn(),
        enumerateDevices: jest
          .fn()
          .mockResolvedValue([{ kind: 'videoinput', deviceId: 'cam1', label: 'FaceTime Camera' }]),
      },
      writable: true,
      configurable: true,
    });

    expect(await ExponentCameraManager.isAvailableAsync()).toBe(true);
  });
});

describe(ExponentCameraManager.getCameraPermissionsAsync, () => {
  it('handles a TypeError from Firefox', async () => {
    const typeError = new TypeError(
      "'camera' (value of 'name' member of PermissionDescriptor) is not a valid value for enumeration PermissionName."
    );

    Object.assign(window.navigator, {
      permissions: {
        query: jest.fn().mockRejectedValue(typeError),
      },
    });

    const result = await ExponentCameraManager.getCameraPermissionsAsync();

    expect(result).toMatchObject({
      status: PermissionStatus.UNDETERMINED,
      expires: 'never',
      canAskAgain: true,
      granted: false,
    });
  });
});
