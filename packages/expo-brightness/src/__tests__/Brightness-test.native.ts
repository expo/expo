import * as Brightness from '../Brightness';
import ExpoBrightness from '../ExpoBrightness';

it(`clamps the brightness value in setBrightnessAsync`, async () => {
  await Brightness.setBrightnessAsync(5);
  expect(ExpoBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
  await Brightness.setBrightnessAsync(-1);
  expect(ExpoBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(0);
});

it(`throws when setBrightnessAsync is called with an unsupported type`, async () => {
  await expect(Brightness.setBrightnessAsync(NaN)).rejects.toThrow(TypeError);
  await expect(Brightness.setBrightnessAsync('test' as any)).rejects.toThrow(TypeError);
});

it(`throws when setSystemBrightnessAsync is called with an unsupported type`, async () => {
  await expect(Brightness.setSystemBrightnessAsync(NaN)).rejects.toThrow(TypeError);
  await expect(Brightness.setSystemBrightnessAsync('test' as any)).rejects.toThrow(TypeError);
});
