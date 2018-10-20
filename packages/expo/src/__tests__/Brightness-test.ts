import { NativeModules } from 'react-native';

import * as Brightness from '../Brightness';
import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from '../../test/mocking';

it(`clamps the brightness value in setBrightnessAsync`, async () => {
  await Brightness.setBrightnessAsync(5);
  expect(NativeModules.ExpoBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
  await Brightness.setBrightnessAsync(-1);
  expect(NativeModules.ExpoBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(0);
});

it(`throws when setBrightnessAsync is called with an unsupported type`, async () => {
  await expect(Brightness.setBrightnessAsync(NaN)).rejects.toThrowError(TypeError);
  await expect(Brightness.setBrightnessAsync('test' as any)).rejects.toThrowError(TypeError);
});

it(`clamps the brightness value in setSystemBrightnessAsync`, async () => {
  mockPlatformAndroid();
  await Brightness.setSystemBrightnessAsync(5);
  expect(NativeModules.ExpoBrightness.setSystemBrightnessAsync).toHaveBeenLastCalledWith(1);
  await Brightness.setSystemBrightnessAsync(-1);
  expect(NativeModules.ExpoBrightness.setSystemBrightnessAsync).toHaveBeenLastCalledWith(0);
  unmockAllProperties();
});

it(`throws when setSystemBrightnessAsync is called with an unsupported type`, async () => {
  await expect(Brightness.setSystemBrightnessAsync(NaN)).rejects.toThrowError(TypeError);
  await expect(Brightness.setSystemBrightnessAsync('test' as any)).rejects.toThrowError(TypeError);
});

it(`does nothing if setSystemBrightnessModeAsync is called with BrightnessMode.UNKNOWN`, async () => {
  mockPlatformAndroid();
  await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.UNKNOWN);
  expect(NativeModules.ExpoBrightness.setSystemBrightnessModeAsync).not.toHaveBeenCalled();
  unmockAllProperties();
});

describe('  system brightness', () => {
  beforeAll(() => {
    mockPlatformIOS();
  });

  afterAll(() => {
    unmockAllProperties();
  });

  it('getSystemBrightnessAsync calls getBrightnessAsync', async () => {
    await Brightness.getSystemBrightnessAsync();
    expect(NativeModules.ExpoBrightness.getBrightnessAsync).toHaveBeenCalled();
    expect(NativeModules.ExpoBrightness.getSystemBrightnessAsync).not.toHaveBeenCalled();
  });

  it('setSystemBrightnessAsync calls setBrightnessAsync', async () => {
    await Brightness.setSystemBrightnessAsync(1);
    expect(NativeModules.ExpoBrightness.setBrightnessAsync).toHaveBeenCalled();
    expect(NativeModules.ExpoBrightness.setSystemBrightnessAsync).not.toHaveBeenCalled();
  });
});

describe('🤖  system brightness', () => {
  beforeAll(() => {
    mockPlatformAndroid();
  });

  afterAll(() => {
    unmockAllProperties();
  });

  it('getSystemBrightnessAsync calls getBrightnessAsync', async () => {
    await Brightness.getSystemBrightnessAsync();
    expect(NativeModules.ExpoBrightness.getBrightnessAsync).not.toHaveBeenCalled();
    expect(NativeModules.ExpoBrightness.getSystemBrightnessAsync).toHaveBeenCalled();
  });

  it('setSystemBrightnessAsync calls setBrightnessAsync', async () => {
    await Brightness.setSystemBrightnessAsync(1);
    expect(NativeModules.ExpoBrightness.setBrightnessAsync).not.toHaveBeenCalled();
    expect(NativeModules.ExpoBrightness.setSystemBrightnessAsync).toHaveBeenCalled();
  });
});

/*
TODO: add new TypeError to docs
other tests (e.g. UNKNOWN returned on ios) make more sense in test suite
add note to docs about bridge doing type checking
*/
