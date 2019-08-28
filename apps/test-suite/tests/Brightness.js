import * as Permissions from 'expo-permissions';
import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';
import * as TestUtils from '../TestUtils';

export const name = 'Brightness';
export const EPSILON = Math.pow(10, -5);

export function canRunAsync({ isAutomated, isDevice }) {
  return isDevice && !isAutomated;
}

export async function test({
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  xit,
  xdescribe,
  jasmine,
  expect,
  ...t
}) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? xdescribe : describe;

  describe(name, () => {
    let originalBrightness;

    beforeAll(async () => {
      originalBrightness = await Brightness.getBrightnessAsync();
    });

    afterAll(async () => {
      await Brightness.setBrightnessAsync(originalBrightness);
    });

    describe(`Brightness.getBrightnessAsync(), Brightness.setBrightnessAsync()`, () => {
      it(`gets and sets the current brightness of the app screen`, async () => {
        const originalValue = 0.2;
        let wasRejected = false;
        try {
          await Brightness.setBrightnessAsync(originalValue);
        } catch (error) {
          wasRejected = true;
        }
        const obtainedValue = await Brightness.getBrightnessAsync();
        expect(Math.abs(originalValue - obtainedValue)).toBeLessThan(EPSILON);
        expect(wasRejected).toBe(false);
      });

      it(`set to the lowest brightness when the values passed to the setter are too low`, async () => {
        const tooLowValue = -0.1;
        let wasRejected = false;
        try {
          await Brightness.setBrightnessAsync(tooLowValue);
        } catch (error) {
          wasRejected = true;
        }
        const obtainedValue = await Brightness.getBrightnessAsync();
        expect(Math.abs(0 - obtainedValue)).toBeLessThan(EPSILON);
        expect(wasRejected).toBe(false);
      });

      it(`set to the highest brightness when the values passed to the setter are too high`, async () => {
        const tooHighValue = 1.1;
        let wasRejected = false;
        try {
          await Brightness.setBrightnessAsync(tooHighValue);
        } catch (error) {
          wasRejected = true;
        }
        const obtainedValue = await Brightness.getBrightnessAsync();
        expect(Math.abs(1 - obtainedValue)).toBeLessThan(EPSILON);
        expect(wasRejected).toBe(false);
      });

      it(`throws when NaN is passed to the setter`, async () => {
        let wasRejected = false;
        try {
          await Brightness.setBrightnessAsync(NaN);
        } catch (error) {
          wasRejected = true;
        }
        expect(wasRejected).toBe(true);
      });
    });

    if (Platform.OS === 'android') {
      describeWithPermissions(
        `Brightness.getSystemBrightnessAsync(), Brightness.setSystemBrightnessAsync()`,
        () => {
          beforeAll(async () => {
            await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
              return Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS);
            });
          });

          it(`gets and sets the current system brightness`, async () => {
            const originalValue = 0.2;
            let wasRejected = false;
            try {
              await Brightness.setSystemBrightnessAsync(originalValue);
            } catch (error) {
              wasRejected = true;
            }
            const obtainedValue = await Brightness.getSystemBrightnessAsync();
            expect(Math.abs(originalValue - obtainedValue)).toBeLessThan(EPSILON);
            expect(wasRejected).toBe(false);
          });

          it(`set to the lowest brightness when the values passed to the setter are too low`, async () => {
            const tooLowValue = -0.1;
            let wasRejected = false;
            try {
              await Brightness.setSystemBrightnessAsync(tooLowValue);
            } catch (error) {
              wasRejected = true;
            }
            const obtainedValue = await Brightness.getSystemBrightnessAsync();
            expect(Math.abs(0 - obtainedValue)).toBeLessThan(EPSILON);
            expect(wasRejected).toBe(false);
          });

          it(`set to the highest brightness when the values passed to the setter are too high`, async () => {
            const tooHighValue = 1.1;
            let wasRejected = false;
            try {
              await Brightness.setSystemBrightnessAsync(tooHighValue);
            } catch (error) {
              wasRejected = true;
            }
            const obtainedValue = await Brightness.getSystemBrightnessAsync();
            expect(Math.abs(1 - obtainedValue)).toBeLessThan(EPSILON);
            expect(wasRejected).toBe(false);
          });

          it(`throws when NaN is passed to the setter`, async () => {
            let wasRejected = false;
            try {
              await Brightness.setSystemBrightnessAsync(NaN);
            } catch (error) {
              wasRejected = true;
            }
            expect(wasRejected).toBe(true);
          });
        }
      );

      describeWithPermissions(`Brightness.useSystemBrightnessAsync`, () => {
        beforeAll(async () => {
          await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
            return Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS);
          });
        });

        beforeEach(async () => {
          const cleanValue = 0.5;
          await Brightness.setBrightnessAsync(cleanValue);
          await Brightness.setSystemBrightnessAsync(cleanValue);
        });

        it(`makes the current activity use the system brightness`, async () => {
          const appValue = 0;
          const systemValue = 1;
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessAsync(systemValue);
            await Brightness.setBrightnessAsync(appValue);
            await Brightness.useSystemBrightnessAsync();
          } catch (error) {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          expect(Math.abs(obtainedValue - systemValue)).toBeLessThan(EPSILON);
          expect(wasRejected).toBe(false);
        });

        it(`is overridden by setting the app brightness`, async () => {
          const appValue = 0;
          const systemValue = 1;
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessAsync(systemValue);
            await Brightness.useSystemBrightnessAsync();
            await Brightness.setBrightnessAsync(appValue);
          } catch (error) {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          expect(Math.abs(obtainedValue - appValue)).toBeLessThan(EPSILON);
          expect(wasRejected).toBe(false);
        });
      });

      describeWithPermissions(`Brightness.isUsingSystemBrightnessAsync`, () => {
        beforeAll(async () => {
          await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
            return Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS);
          });
        });

        beforeEach(async () => {
          const cleanValue = 0.5;
          await Brightness.setBrightnessAsync(cleanValue);
          await Brightness.setSystemBrightnessAsync(cleanValue);
        });

        it(`returns a boolean specifiying whether or not the current activity is using the system brightness`, async () => {
          let wasRejected = false;
          const beforeValue = await Brightness.isUsingSystemBrightnessAsync();
          try {
            await Brightness.useSystemBrightnessAsync();
          } catch (error) {
            wasRejected = true;
          }
          const afterValue = await Brightness.isUsingSystemBrightnessAsync();
          expect(beforeValue).toBe(false);
          expect(afterValue).toBe(true);
          expect(wasRejected).toBe(false);
        });
      });

      describeWithPermissions(`Brightness Mode`, () => {
        beforeAll(async () => {
          await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
            return Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS);
          });
        });

        it(`is unaffected by setting the app brightness`, async () => {
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.MANUAL);
            await Brightness.setBrightnessAsync(0.5);
          } catch (error) {
            wasRejected = true;
          }
          let obtainedValue = await Brightness.getSystemBrightnessModeAsync();
          expect(obtainedValue).toEqual(Brightness.BrightnessMode.MANUAL);
          try {
            await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.AUTOMATIC);
            await Brightness.setBrightnessAsync(0.5);
          } catch (error) {
            wasRejected = true;
          }
          obtainedValue = await Brightness.getSystemBrightnessModeAsync();
          expect(obtainedValue).toEqual(Brightness.BrightnessMode.AUTOMATIC);
          expect(wasRejected).toBe(false);
        });

        it(`is set to MANUAL after setting the system brightness`, async () => {
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.AUTOMATIC);
            await Brightness.setSystemBrightnessAsync(0.5);
          } catch (error) {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getSystemBrightnessModeAsync();
          expect(obtainedValue).toEqual(Brightness.BrightnessMode.MANUAL);
          expect(wasRejected).toBe(false);
        });
      });
    }
  });
}
