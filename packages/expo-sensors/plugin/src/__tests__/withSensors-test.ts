import { DISABLE_MOTION_PERMISSION_KEY, setMotionPermissionDisabled } from '../withSensors';

describe(setMotionPermissionDisabled, () => {
  it(`sets the opt-out when motionPermission is false`, () => {
    expect(setMotionPermissionDisabled({ motionPermission: false }, {})).toEqual({
      ExpoSensors_disableMotionPermission: true,
    });
  });

  it.each([undefined, 'Allow $(PRODUCT_NAME) to access your device motion'])(
    `does not set the opt-out when motionPermission is %p`,
    (motionPermission) => {
      expect(setMotionPermissionDisabled({ motionPermission }, {})).toEqual({});
    }
  );

  it(`removes a stale opt-out when motionPermission is no longer false`, () => {
    expect(
      setMotionPermissionDisabled(
        {},
        { [DISABLE_MOTION_PERMISSION_KEY]: true, CFBundleName: 'app' }
      )
    ).toEqual({ CFBundleName: 'app' });
  });
});
