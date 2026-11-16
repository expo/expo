import {
  DISABLE_MOTION_PERMISSION_KEY,
  PEDOMETER_PLAY_SERVICES_KEY,
  setMotionPermissionDisabled,
  setPedometerPlayServicesEnabled,
} from '../withSensors';

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

describe(setPedometerPlayServicesEnabled, () => {
  it(`enables the Play services libraries when pedometerPlayServicesEnabled is true`, () => {
    expect(setPedometerPlayServicesEnabled({ pedometerPlayServicesEnabled: true }, [])).toEqual([
      { type: 'property', key: PEDOMETER_PLAY_SERVICES_KEY, value: 'true' },
    ]);
  });

  it.each([undefined, false])(
    `removes the property when pedometerPlayServicesEnabled is %p`,
    (pedometerPlayServicesEnabled) => {
      expect(
        setPedometerPlayServicesEnabled({ pedometerPlayServicesEnabled }, [
          { type: 'property', key: PEDOMETER_PLAY_SERVICES_KEY, value: 'true' },
          { type: 'property', key: 'android.useAndroidX', value: 'true' },
        ])
      ).toEqual([{ type: 'property', key: 'android.useAndroidX', value: 'true' }]);
    }
  );
});
