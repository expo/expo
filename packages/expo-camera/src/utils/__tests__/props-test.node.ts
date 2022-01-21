import { AutoFocus, CameraType, FlashMode, WhiteBalance } from '../../Camera.types';
import { convertNativeProps } from '../props';

describe(convertNativeProps, () => {
  it(`allows nullish`, () => {
    expect(convertNativeProps()).toStrictEqual({});
  });
  it(`converts known properties to native props`, () => {
    expect(
      convertNativeProps({
        type: 'front' as CameraType,
        flashMode: 'torch' as FlashMode,
        autoFocus: 'auto' as AutoFocus,
        whiteBalance: 'continuous' as WhiteBalance,
      })
    ).toStrictEqual({
      autoFocus: 'auto',
      flashMode: 'torch',
      type: 'front',
      whiteBalance: 'continuous',
    });
  });
  it(`converts unknown properties to undefined values`, () => {
    expect(
      convertNativeProps({
        type: 'invalid',
        foo: 'bar',
      } as any)
    ).toStrictEqual({
      type: undefined,
      foo: 'bar',
    });
  });
});
