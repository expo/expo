import * as Brightness from '../Brightness';
import ExpoBrightness from '../ExpoBrightness';

it(`calls getBrightnessAsync from getSystemBrightnessAsync`, async () => {
  await Brightness.getSystemBrightnessAsync();
  expect(ExpoBrightness.getBrightnessAsync).toHaveBeenCalled();
  expect(ExpoBrightness.getSystemBrightnessAsync).not.toHaveBeenCalled();
});

it(`calls setBrightnessAsync from setSystemBrightnessAsync`, async () => {
  await Brightness.setSystemBrightnessAsync(1);
  expect(ExpoBrightness.setBrightnessAsync).toHaveBeenCalled();
  expect(ExpoBrightness.setSystemBrightnessAsync).not.toHaveBeenCalled();
});

it(`returns false from isUsingSystemBrightnessAsync`, async () => {
  const result = await Brightness.isUsingSystemBrightnessAsync();
  expect(result).toBe(false);
});
