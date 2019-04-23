import { NativeModulesProxy } from '@unimodules/core';
import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';

import * as Brightness from '../Brightness';

it(`clamps the brightness value in setBrightnessAsync`, async () => {
  await Brightness.setBrightnessAsync(5);
  expect(NativeModulesProxy.ExpoBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
  await Brightness.setBrightnessAsync(-1);
  expect(NativeModulesProxy.ExpoBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(0);
});

it(`throws when setBrightnessAsync is called with an unsupported type`, async () => {
  await expect(Brightness.setBrightnessAsync(NaN)).rejects.toThrowError(TypeError);
  await expect(Brightness.setBrightnessAsync('test' as any)).rejects.toThrowError(TypeError);
});

it(`clamps the brightness value in setSystemBrightnessAsync`, async () => {
  mockPlatformAndroid();
  await Brightness.setSystemBrightnessAsync(5);
  expect(NativeModulesProxy.ExpoBrightness.setSystemBrightnessAsync).toHaveBeenLastCalledWith(1);
  await Brightness.setSystemBrightnessAsync(-1);
  expect(NativeModulesProxy.ExpoBrightness.setSystemBrightnessAsync).toHaveBeenLastCalledWith(0);
  unmockAllProperties();
});

it(`throws when setSystemBrightnessAsync is called with an unsupported type`, async () => {
  await expect(Brightness.setSystemBrightnessAsync(NaN)).rejects.toThrowError(TypeError);
  await expect(Brightness.setSystemBrightnessAsync('test' as any)).rejects.toThrowError(TypeError);
});

it(`does nothing if setSystemBrightnessModeAsync is called with BrightnessMode.UNKNOWN`, async () => {
  mockPlatformAndroid();
  await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.UNKNOWN);
  expect(NativeModulesProxy.ExpoBrightness.setSystemBrightnessModeAsync).not.toHaveBeenCalled();
  unmockAllProperties();
});

describe(`iOS system brightness`, () => {
  beforeAll(() => {
    mockPlatformIOS();
  });

  afterAll(() => {
    unmockAllProperties();
  });

  it(`calls getBrightnessAsync from getSystemBrightnessAsync`, async () => {
    await Brightness.getSystemBrightnessAsync();
    expect(NativeModulesProxy.ExpoBrightness.getBrightnessAsync).toHaveBeenCalled();
    expect(NativeModulesProxy.ExpoBrightness.getSystemBrightnessAsync).not.toHaveBeenCalled();
  });

  it(`calls setBrightnessAsync from setSystemBrightnessAsync`, async () => {
    await Brightness.setSystemBrightnessAsync(1);
    expect(NativeModulesProxy.ExpoBrightness.setBrightnessAsync).toHaveBeenCalled();
    expect(NativeModulesProxy.ExpoBrightness.setSystemBrightnessAsync).not.toHaveBeenCalled();
  });

  it(`returns false from isUsingSystemBrightnessAsync`, async () => {
    const result = await Brightness.isUsingSystemBrightnessAsync();
    expect(result).toBe(false);
  });
});

describe(`Android system brightness`, () => {
  beforeAll(() => {
    mockPlatformAndroid();
  });

  afterAll(() => {
    unmockAllProperties();
  });

  it(`doesn't call getBrightnessAsync from getSystemBrightnessAsync`, async () => {
    await Brightness.getSystemBrightnessAsync();
    expect(NativeModulesProxy.ExpoBrightness.getBrightnessAsync).not.toHaveBeenCalled();
    expect(NativeModulesProxy.ExpoBrightness.getSystemBrightnessAsync).toHaveBeenCalled();
  });

  it(`doesn't call setBrightnessAsync from setSystemBrightnessAsync`, async () => {
    await Brightness.setSystemBrightnessAsync(1);
    expect(NativeModulesProxy.ExpoBrightness.setBrightnessAsync).not.toHaveBeenCalled();
    expect(NativeModulesProxy.ExpoBrightness.setSystemBrightnessAsync).toHaveBeenCalled();
  });
});
