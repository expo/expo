'use strict';

import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const name = 'Device';
export async function test(t) {
  t.describe(`Device.getDeviceType()`, () => {
    t.it(`returns enum values`, async () => {
      const deviceType = await Device.getDeviceTypeAsync();
      t.expect(Object.values(Device.DeviceType).includes(deviceType)).toBeTruthy();
    });
  });

  t.describe(`Device.getUptimeAsync()`, () => {
    t.it(`calls getUptimeAsync() and returns number`, async () => {
      const uptime = await Device.getUptimeAsync();
      t.expect(uptime).toBeDefined();
      t.expect(typeof uptime).toEqual('number');
    });
  });

  if (Platform.OS === 'ios') {
    t.describe(`Device on iOS`, () => {
      t.it(`gets most constants and correct types`, async () => {
        const brand = Device.brand;
        const manufacturer = Device.manufacturer;
        const modelName = Device.modelName;
        const osName = Device.osName;
        const totalMemory = Device.totalMemory;
        const isDevice = Device.isDevice;
        const osBuildId = Device.osBuildId;
        const osInternalBuildId = Device.osInternalBuildId;
        const osVersion = Device.osVersion;
        const deviceName = Device.deviceName;
        const deviceType = Device.deviceType;
        const deviceYearClass = Device.deviceYearClass;
        t.expect(brand).toBeDefined();
        t.expect(typeof brand).toEqual('string');
        t.expect(manufacturer).toBeDefined();
        t.expect(typeof manufacturer).toEqual('string');
        t.expect(modelName).toBeDefined();
        t.expect(typeof modelName).toEqual('string');
        t.expect(osName).toBeDefined();
        t.expect(typeof osName).toEqual('string');
        t.expect(totalMemory).toBeDefined();
        t.expect(typeof totalMemory).toEqual('number');
        t.expect(isDevice).toBeDefined();
        t.expect(typeof isDevice).toEqual('boolean');
        t.expect(osBuildId).toBeDefined();
        t.expect(typeof osBuildId).toEqual('string');
        t.expect(osInternalBuildId).toBeDefined();
        t.expect(typeof osInternalBuildId).toEqual('string');
        t.expect(osVersion).toBeDefined();
        t.expect(typeof osVersion).toEqual('string');
        t.expect(deviceYearClass).toBeDefined();
        t.expect(typeof deviceYearClass).toEqual('number');
        t.expect(deviceName).toBeDefined();
        t.expect(typeof deviceName).toEqual('string');
        t.expect(deviceType).toBeDefined();
        t.expect(typeof deviceType).toEqual('number');
      });

      t.it(`doesn't get Android-only constants`, async () => {
        const osBuildFingerprint = Device.osBuildFingerprint;
        const designName = Device.designName;
        const productName = Device.productName;
        const platformApiLevel = Device.platformApiLevel;
        t.expect(designName).toBeNull();
        t.expect(productName).toBeNull();
        t.expect(platformApiLevel).toBeNull();
        t.expect(osBuildFingerprint).toBeNull();
      });

      t.it(`getPlatformFeaturesAsync() returns empty array on iOS`, async () => {
        const allFeatures = await Device.getPlatformFeaturesAsync();
        t.expect(allFeatures).toEqual([]);
      });

      t.it(`hasPlatformFeatureAsync() returns false on iOS`, async () => {
        const hasFeature = await Device.hasPlatformFeatureAsync('amazon_fire_tv');
        t.expect(hasFeature).toEqual(false);
      });

      t.it(`doesn't call getMaxMemoryAsync()`, async () => {
        let error;
        let maxMemory;
        try {
          maxMemory = await Device.getMaxMemoryAsync();
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeDefined();
        t.expect(typeof maxMemory).toEqual('undefined');
      });

      t.it(`doesn't call sideLoadingAsync()`, async () => {
        let error;
        let isSideLoading;
        try {
          isSideLoading = await Device.isSideLoadingEnabledAsync();
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeDefined();
        t.expect(typeof isSideLoading).toEqual('undefined');
      });

      t.it(`gets osBuildId same as osInternalBuildId`, async () => {
        const osBuildId = await Device.osBuildId;
        const osInternalBuildId = await Device.osInternalBuildId;
        t.expect(Device.osBuildId).toBeTruthy();
        t.expect(Device.osInternalBuildId).toBeTruthy();
        t.expect(osBuildId).toEqual(osInternalBuildId);
      });
    });
  } else if (Platform.OS === 'android') {
    t.describe(`Device on Android`, () => {
      t.it(`gets constants and correct types`, async () => {
        const designName = await Device.designName;
        const productName = await Device.productName;
        const brand = await Device.brand;
        const manufacturer = await Device.manufacturer;
        const modelName = await Device.modelName;
        const osName = await Device.osName;
        const totalMemory = await Device.totalMemory;
        const isDevice = await Device.isDevice;
        const osBuildId = await Device.osBuildId;
        const osBuildFingerprint = await Device.osBuildFingerprint;
        const osInternalBuildId = await Device.osInternalBuildId;
        const platformApiLevel = await Device.platformApiLevel;
        const osVersion = await Device.osVersion;
        const deviceName = await Device.deviceName;
        const deviceYearClass = await Device.deviceYearClass;
        t.expect(designName).toBeDefined();
        t.expect(typeof designName).toEqual('string');
        t.expect(productName).toBeDefined();
        t.expect(typeof productName).toEqual('string');
        t.expect(brand).toBeDefined();
        t.expect(typeof brand).toEqual('string');
        t.expect(manufacturer).toBeDefined();
        t.expect(typeof manufacturer).toEqual('string');
        t.expect(modelName).toBeDefined();
        t.expect(typeof modelName).toEqual('string');
        t.expect(osName).toBeDefined();
        t.expect(typeof osName).toEqual('string');
        t.expect(totalMemory).toBeDefined();
        t.expect(typeof totalMemory).toEqual('number');
        t.expect(isDevice).toBeDefined();
        t.expect(typeof isDevice).toEqual('boolean');
        t.expect(osBuildId).toBeDefined();
        t.expect(typeof osBuildId).toEqual('string');
        t.expect(osBuildFingerprint).toBeDefined();
        t.expect(typeof osBuildFingerprint).toEqual('string');
        t.expect(osInternalBuildId).toBeDefined();
        t.expect(typeof osInternalBuildId).toEqual('string');
        t.expect(platformApiLevel).toBeDefined();
        t.expect(typeof platformApiLevel).toEqual('number');
        t.expect(osVersion).toBeDefined();
        t.expect(typeof osVersion).toEqual('string');
        t.expect(deviceYearClass).toBeDefined();
        t.expect(typeof deviceYearClass).toEqual('number');
        if (isDevice) {
          t.expect(deviceName).toBeDefined();
          t.expect(typeof deviceName).toEqual('string');
        } else {
          t.expect(deviceName).toBeNull();
        }
      });

      t.it(`doesn't get modelId`, async () => {
        await Device.modelId;
        t.expect(Device.modelId).toBeNull();
      });

      t.it(`calls hasPlatformFeatureAsync() with valid string and returns boolean`, async () => {
        let error;
        let hasFeature;
        try {
          hasFeature = await Device.hasPlatformFeatureAsync('amazon_fire_tv');
        } catch (e) {
          error = e;
        }
        t.expect(hasFeature).toEqual(t.jasmine.any(Boolean));
        t.expect(error).toBeUndefined();
      });

      t.it(
        `calls hasPlatformFeatureAsync() with invalid string format and returns false`,
        async () => {
          let error;
          let hasFeature;
          try {
            hasFeature = await Device.hasPlatformFeatureAsync('camera');
          } catch (e) {
            error = e;
          }
          t.expect(hasFeature).toEqual(t.jasmine.any(Boolean));
          t.expect(hasFeature).toEqual(false);
          t.expect(error).toBeUndefined();
        }
      );

      t.it(`calls getMaxMemoryAsync() and returns a number under integer limit`, async () => {
        const maxMemory = await Device.getMaxMemoryAsync();
        t.expect(maxMemory).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
      });

      t.it(`calls getPlatformFeaturesAsync()`, async () => {
        const allFeatures = await Device.getPlatformFeaturesAsync();
        t.expect(allFeatures).toBeDefined();
      });
    });
  }
}
