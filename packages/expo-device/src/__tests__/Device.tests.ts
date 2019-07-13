import * as Device from '../Device';
import * as ExpoDevice from '../ExpoDevice';
import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';
import { UnavailabilityError, NativeModulesProxy } from '@unimodules/core';
import { DeviceEventEmitter } from 'react-native';
it(`throws when hasPlatformFeature is called with an unsupported type`, async () => {
  await expect(Device.hasPlatformFeatureAsync('test' as any)).rejects.toThrowError(TypeError);
});

describe(`iOS device tests`, () => {
  beforeAll(() => {
    mockPlatformIOS();
  });

  it(`doesn't call getPlatformFeaturesAsync`, async () => {
    await Device.getPlatformFeaturesAsync();
    expect(NativeModulesProxy.ExpoDevice.getPlatformFeaturesAsync).rejects.toThrowError(
      UnavailabilityError
    );
  });

  it(`doesn't call hasPlatformFeatureAsync`, async () => {
    await Device.hasPlatformFeatureAsync('amazon.fire.tv');
    expect(
      NativeModulesProxy.ExpoDevice.hasPlatformFeatureAsync('amazon.fire.tv')
    ).rejects.toThrowError(UnavailabilityError);
  });

  it(`doesn't call getMaxMemoryAsync`, async () => {
    await Device.getMaxMemoryAsync();
    expect(NativeModulesProxy.ExpoDevice.getMaxMemoryAsync).rejects.toThrowError(
      UnavailabilityError
    );
  });

  it(`doesn't get designName`, async () => {
    await Device.designName;
    expect(NativeModulesProxy.ExpoDevice.designName).toBeNull();
  });

  it(`doesn't get productName`, async () => {
    await Device.productName;
    expect(NativeModulesProxy.ExpoDevice.productName).toBeNull();
  });

  it(`doesn't get platformApiLevel`, async () => {
    await Device.platformApiLevel;
    expect(NativeModulesProxy.ExpoDevice.platformApiLevel).toBeNull();
  });

  it(`doesn't get osBuildFingerprint`, async () => {
    await Device.osBuildFingerprint;
    expect(NativeModulesProxy.ExpoDevice.osBuildFingerprint).toBeNull();
  });

  it(`does get modelId`, async () => {
    await Device.modelId;
    expect(NativeModulesProxy.ExpoDevice.modelId).toBeTruthy();
  });

  it(`osBuildId same as osInternalBuildId`, async () => {
    const osBuildId = await Device.osBuildId;
    const osInternalBuildId = await Device.osInternalBuildId;
    expect(NativeModulesProxy.ExpoDevice.osBuildId).toBeTruthy();
    expect(NativeModulesProxy.ExpoDevice.osBuilosInternalBuildIddId).toBeTruthy();
    expect(osBuildId).toEqual(osInternalBuildId);
  });
});

describe(`Android device tests`, () => {
  beforeAll(() => {
    mockPlatformAndroid();
  });

  it(`do call getPlatformFeaturesAsync`, async () => {
    await Device.getPlatformFeaturesAsync();
    expect(NativeModulesProxy.ExpoDevice.getPlatformFeaturesAsync).toHaveBeenCalled();
  });

  it(`do call hasPlatformFeatureAsync`, async () => {
    await Device.hasPlatformFeatureAsync('amazon.fire.tv');
    expect(
      NativeModulesProxy.ExpoDevice.hasPlatformFeatureAsync('amazon.fire.tv')
    ).toHaveBeenCalled();
  });

  it(`do call getMaxMemoryAsync`, async () => {
    await Device.getMaxMemoryAsync();
    expect(NativeModulesProxy.ExpoDevice.getMaxMemoryAsync).toHaveBeenCalled();
    expect(NativeModulesProxy.ExpoDevice.getMaxMemoryAsync).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
  });

  it(`do get designName`, async () => {
    await Device.designName;
    expect(NativeModulesProxy.ExpoDevice.designName).toBeTruthy();
  });

  it(`do get productName`, async () => {
    await Device.productName;
    expect(NativeModulesProxy.ExpoDevice.productName).toBeTruthy();
  });

  it(`do get platformApiLevel`, async () => {
    await Device.platformApiLevel;
    expect(NativeModulesProxy.ExpoDevice.platformApiLevel).toBeTruthy();
  });

  it(`do get osBuildFingerprint`, async () => {
    await Device.osBuildFingerprint;
    expect(NativeModulesProxy.ExpoDevice.osBuildFingerprint).toBeTruthy();
  });

  it(`doesn't get modelId`, async () => {
    await Device.modelId;
    expect(NativeModulesProxy.ExpoDevice.modelId).toBeNull();
  });
});
