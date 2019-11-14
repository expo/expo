import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';

import * as TestUtils from '../TestUtils';
import { isDeviceFarm } from '../utils/Environment';

export const name = 'ImagePicker';

export async function test({ it, xit, beforeAll, expect, jasmine, xdescribe, describe, afterAll }) {
  describe(name, () => {
    if (isDeviceFarm()) return;

    let originalTimeout;

    beforeAll(async () => {
      await Permissions.askAsync(Permissions.CAMERA_ROLL);
      await Permissions.askAsync(Permissions.CAMERA);

      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return Permissions.askAsync(Permissions.CAMERA_ROLL);
      });
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 10;
    });

    if (Constants.isDevice) {
      it('launches the camera', async () => {
        const { cancelled } = await ImagePicker.launchCameraAsync();
        expect(cancelled).toBe(true);
      });
    } else {
      it('natively prevents the camera from launching on a simulator', async () => {
        let err;
        try {
          await ImagePicker.launchCameraAsync();
        } catch ({ code }) {
          err = code;
        }
        expect(err).toBe('CAMERA_MISSING');
      });
    }
    afterAll(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });
}
