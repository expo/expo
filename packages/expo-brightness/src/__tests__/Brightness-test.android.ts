import * as Brightness from '../Brightness';
import ExpoBrightness from '../ExpoBrightness';

it(`clamps the brightness value in setSystemBrightnessAsync`, async () => {
  await Brightness.setSystemBrightnessAsync(5);
  expect(ExpoBrightness.setSystemBrightnessAsync).toHaveBeenLastCalledWith(1);
  await Brightness.setSystemBrightnessAsync(-1);
  expect(ExpoBrightness.setSystemBrightnessAsync).toHaveBeenLastCalledWith(0);
});

it(`does nothing if setSystemBrightnessModeAsync is called with BrightnessMode.UNKNOWN`, async () => {
  await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.UNKNOWN);
  expect(ExpoBrightness.setSystemBrightnessModeAsync).not.toHaveBeenCalled();
});

it(`doesn't call getBrightnessAsync from getSystemBrightnessAsync`, async () => {
  await Brightness.getSystemBrightnessAsync();
  expect(ExpoBrightness.getBrightnessAsync).not.toHaveBeenCalled();
  expect(ExpoBrightness.getSystemBrightnessAsync).toHaveBeenCalled();
});

it(`doesn't call setBrightnessAsync from setSystemBrightnessAsync`, async () => {
  await Brightness.setSystemBrightnessAsync(1);
  expect(ExpoBrightness.setBrightnessAsync).not.toHaveBeenCalled();
  expect(ExpoBrightness.setSystemBrightnessAsync).toHaveBeenCalled();
});
