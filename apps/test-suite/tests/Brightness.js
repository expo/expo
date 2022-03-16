import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';

export const name = 'Brightness';
export const EPSILON = Math.pow(10, -5);

export async function test(t) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  t.describe(name, () => {
    let originalBrightness;

    t.beforeAll(async () => {
      originalBrightness = await Brightness.getBrightnessAsync();
    });

    t.afterAll(async () => {
      await Brightness.setBrightnessAsync(originalBrightness);
    });

    t.describe(`Brightness.getBrightnessAsync(), Brightness.setBrightnessAsync()`, () => {
      t.it(`gets and sets the current brightness of the app screen`, async () => {
        const originalValue = 0.2;
        let wasRejected = false;
        try {
          await Brightness.setBrightnessAsync(originalValue);
        } catch {
          wasRejected = true;
        }
        const obtainedValue = await Brightness.getBrightnessAsync();
        t.expect(Math.abs(originalValue - obtainedValue)).toBeLessThan(EPSILON);
        t.expect(wasRejected).toBe(false);
      });

      t.it(
        `set to the lowest brightness when the values passed to the setter are too low`,
        async () => {
          const tooLowValue = -0.1;
          let wasRejected = false;
          try {
            await Brightness.setBrightnessAsync(tooLowValue);
          } catch {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          t.expect(Math.abs(0 - obtainedValue)).toBeLessThan(EPSILON);
          t.expect(wasRejected).toBe(false);
        }
      );

      t.it(
        `set to the highest brightness when the values passed to the setter are too high`,
        async () => {
          const tooHighValue = 1.1;
          let wasRejected = false;
          try {
            await Brightness.setBrightnessAsync(tooHighValue);
          } catch {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          t.expect(Math.abs(1 - obtainedValue)).toBeLessThan(EPSILON);
          t.expect(wasRejected).toBe(false);
        }
      );

      t.it(`throws when NaN is passed to the setter`, async () => {
        let wasRejected = false;
        try {
          await Brightness.setBrightnessAsync(NaN);
        } catch {
          wasRejected = true;
        }
        t.expect(wasRejected).toBe(true);
      });
    });

    if (Platform.OS === 'android') {
      describeWithPermissions(
        `Brightness.getSystemBrightnessAsync(), Brightness.setSystemBrightnessAsync()`,
        () => {
          t.beforeAll(async () => {
            await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
              return Brightness.requestPermissionsAsync();
            });
          });

          t.it(`gets and sets the current system brightness`, async () => {
            const originalValue = 0.2;
            let wasRejected = false;
            try {
              await Brightness.setSystemBrightnessAsync(originalValue);
            } catch {
              wasRejected = true;
            }
            const obtainedValue = await Brightness.getSystemBrightnessAsync();
            t.expect(Math.abs(originalValue - obtainedValue)).toBeLessThan(EPSILON);
            t.expect(wasRejected).toBe(false);
          });

          t.it(
            `set to the lowest brightness when the values passed to the setter are too low`,
            async () => {
              const tooLowValue = -0.1;
              let wasRejected = false;
              try {
                await Brightness.setSystemBrightnessAsync(tooLowValue);
              } catch {
                wasRejected = true;
              }
              const obtainedValue = await Brightness.getSystemBrightnessAsync();
              t.expect(Math.abs(0 - obtainedValue)).toBeLessThan(EPSILON);
              t.expect(wasRejected).toBe(false);
            }
          );

          t.it(
            `set to the highest brightness when the values passed to the setter are too high`,
            async () => {
              const tooHighValue = 1.1;
              let wasRejected = false;
              try {
                await Brightness.setSystemBrightnessAsync(tooHighValue);
              } catch {
                wasRejected = true;
              }
              const obtainedValue = await Brightness.getSystemBrightnessAsync();
              t.expect(Math.abs(1 - obtainedValue)).toBeLessThan(EPSILON);
              t.expect(wasRejected).toBe(false);
            }
          );

          t.it(`throws when NaN is passed to the setter`, async () => {
            let wasRejected = false;
            try {
              await Brightness.setSystemBrightnessAsync(NaN);
            } catch {
              wasRejected = true;
            }
            t.expect(wasRejected).toBe(true);
          });
        }
      );

      describeWithPermissions(`Brightness.useSystemBrightnessAsync`, () => {
        t.beforeAll(async () => {
          await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
            return Brightness.requestPermissionsAsync();
          });
        });

        t.beforeEach(async () => {
          const cleanValue = 0.5;
          await Brightness.setBrightnessAsync(cleanValue);
          await Brightness.setSystemBrightnessAsync(cleanValue);
        });

        t.it(`makes the current activity use the system brightness`, async () => {
          const appValue = 0;
          const systemValue = 1;
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessAsync(systemValue);
            await Brightness.setBrightnessAsync(appValue);
            await Brightness.useSystemBrightnessAsync();
          } catch {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          t.expect(Math.abs(obtainedValue - systemValue)).toBeLessThan(EPSILON);
          t.expect(wasRejected).toBe(false);
        });

        t.it(`is overridden by setting the app brightness`, async () => {
          const appValue = 0;
          const systemValue = 1;
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessAsync(systemValue);
            await Brightness.useSystemBrightnessAsync();
            await Brightness.setBrightnessAsync(appValue);
          } catch {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          t.expect(Math.abs(obtainedValue - appValue)).toBeLessThan(EPSILON);
          t.expect(wasRejected).toBe(false);
        });
      });

      describeWithPermissions(`Brightness.isUsingSystemBrightnessAsync`, () => {
        t.beforeAll(async () => {
          await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
            return Brightness.requestPermissionsAsync();
          });
        });

        t.beforeEach(async () => {
          const cleanValue = 0.5;
          await Brightness.setBrightnessAsync(cleanValue);
          await Brightness.setSystemBrightnessAsync(cleanValue);
        });

        t.it(
          `returns a boolean specifiying whether or not the current activity is using the system brightness`,
          async () => {
            let wasRejected = false;
            const beforeValue = await Brightness.isUsingSystemBrightnessAsync();
            try {
              await Brightness.useSystemBrightnessAsync();
            } catch {
              wasRejected = true;
            }
            const afterValue = await Brightness.isUsingSystemBrightnessAsync();
            t.expect(beforeValue).toBe(false);
            t.expect(afterValue).toBe(true);
            t.expect(wasRejected).toBe(false);
          }
        );
      });

      describeWithPermissions(`Brightness Mode`, () => {
        t.beforeAll(async () => {
          await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
            return Brightness.requestPermissionsAsync();
          });
        });

        t.it(`is unaffected by setting the app brightness`, async () => {
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.MANUAL);
            await Brightness.setBrightnessAsync(0.5);
          } catch {
            wasRejected = true;
          }
          let obtainedValue = await Brightness.getSystemBrightnessModeAsync();
          t.expect(obtainedValue).toEqual(Brightness.BrightnessMode.MANUAL);
          try {
            await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.AUTOMATIC);
            await Brightness.setBrightnessAsync(0.5);
          } catch {
            wasRejected = true;
          }
          obtainedValue = await Brightness.getSystemBrightnessModeAsync();
          t.expect(obtainedValue).toEqual(Brightness.BrightnessMode.AUTOMATIC);
          t.expect(wasRejected).toBe(false);
        });

        t.it(`is set to MANUAL after setting the system brightness`, async () => {
          let wasRejected = false;
          try {
            await Brightness.setSystemBrightnessModeAsync(Brightness.BrightnessMode.AUTOMATIC);
            await Brightness.setSystemBrightnessAsync(0.5);
          } catch {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getSystemBrightnessModeAsync();
          t.expect(obtainedValue).toEqual(Brightness.BrightnessMode.MANUAL);
          t.expect(wasRejected).toBe(false);
        });
      });
    }
  });
}
