import { NativeModules } from 'react-native';
import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';
import { Platform } from '@unimodules/core';


import * as ScreenOrientation from '../ScreenOrientation/ScreenOrientation';

it(`throws when lockAsync is called with an unsupported type`, async () => {
  await expect(ScreenOrientation.lockAsync(NaN as any)).rejects.toThrowError(TypeError);
  await expect(ScreenOrientation.lockAsync('test' as any)).rejects.toThrowError(TypeError);
});

it(`NativeModules.lockAsync is not called with known unsupported locks`, async () => {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.OTHER);
  expect(NativeModules.ExpoScreenOrientation.lockAsync).not.toHaveBeenCalled();
});

it(`throws when supportsOrientationLockAsync is called with an unsupported type`, async () => {
  await expect(ScreenOrientation.supportsOrientationLockAsync(NaN as any)).rejects.toThrowError(
    TypeError
  );
  await expect(ScreenOrientation.supportsOrientationLockAsync('test' as any)).rejects.toThrowError(
    TypeError
  );
});

it(`throws when addOrientationChangeListener is called with an unsupported type`, async () => {
  expect(() => ScreenOrientation.addOrientationChangeListener(NaN as any)).toThrow(TypeError);
  expect(() => ScreenOrientation.addOrientationChangeListener('test' as any)).toThrow(TypeError);
});

it(`throws when removeOrientationChangeListener is called with an unsupported type`, async () => {
  expect(() => ScreenOrientation.removeOrientationChangeListener(NaN as any)).toThrow(TypeError);
  expect(() => ScreenOrientation.removeOrientationChangeListener('test' as any)).toThrow(TypeError);
  expect(() => ScreenOrientation.removeOrientationChangeListener({} as any)).toThrow(TypeError);
});

describe(`Android screen orientation`, () => {
  beforeEach(() => {
    mockPlatformAndroid();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  it(`calls NativeModules.lockPlatformAsync with only Android properties`, async () => {
    const screenOrientationConstantAndroid = 1;
    const androidProperties = {
      screenOrientationConstantAndroid,
    };
    const iOSProperties = {
      screenOrientationArrayIOS: [],
    };
    const badProperties = {
      bad: 'shouldnt be here',
    };

    await ScreenOrientation.lockPlatformAsync({
      ...androidProperties,
      ...iOSProperties,
      ...badProperties,
    });

    expect(NativeModules.ExpoScreenOrientation.lockPlatformAsync).toBeCalledWith(
      screenOrientationConstantAndroid
    );
  });

  it(`throws when lockPlatformAsync is called with unsupported types in its Android properties`, async () => {
    await expect(
      ScreenOrientation.lockPlatformAsync({ screenOrientationConstantAndroid: NaN as any })
    ).rejects.toThrowError(TypeError);
    await expect(
      ScreenOrientation.lockPlatformAsync({ screenOrientationConstantAndroid: 'test' as any })
    ).rejects.toThrowError(TypeError);
  });
});

describe(`iOS screen orientation`, () => {
  beforeEach(() => {
    mockPlatformIOS();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  it(`calls NativeModules.lockPlatformAsync with only iOS properties`, async () => {
    const androidProperties = {
      screenOrientationConstantAndroid: 1,
    };

    const screenOrientationArrayIOS = [];
    const iOSProperties = {
      screenOrientationArrayIOS,
    };
    const badProperties = {
      bad: 'shouldnt be here',
    };

    await ScreenOrientation.lockPlatformAsync({
      ...androidProperties,
      ...iOSProperties,
      ...badProperties,
    });

    expect(NativeModules.ExpoScreenOrientation.lockPlatformAsync).toBeCalledWith(
      screenOrientationArrayIOS
    );
  });

  it(`throws when lockPlatformAsync is called with unsupported types in its iOS properties`, async () => {
    await expect(
      ScreenOrientation.lockPlatformAsync({ screenOrientationArrayIOS: 3 as any })
    ).rejects.toThrowError(TypeError);
    await expect(
      ScreenOrientation.lockPlatformAsync({ screenOrientationArrayIOS: ['foo' as any] })
    ).rejects.toThrowError(TypeError);
  });
});
