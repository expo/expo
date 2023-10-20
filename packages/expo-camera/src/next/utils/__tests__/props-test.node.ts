import { CameraType, FlashMode } from '../../Camera.types';
import { convertNativeProps } from '../props';

describe(convertNativeProps, () => {
  it(`allows nullish`, () => {
    expect(convertNativeProps()).toStrictEqual({});
  });
  it(`converts known properties to native props`, () => {
    expect(
      convertNativeProps({
        type: CameraType.front,
        flashMode: FlashMode.on,
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
