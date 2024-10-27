/**
 * @jest-environment jsdom
 */

import { PermissionStatus } from '../Camera.types';
import ExponentCameraManager from '../ExpoCameraManager';

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
