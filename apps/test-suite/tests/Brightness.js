'use strict';

import { Brightness } from 'expo';

export const name = 'Brightness';
export const EPSILON = Math.pow(10, -5);

export function test(t) {
  t.describe('Brightness', () => {
    t.describe('Brightness.getBrightnessAsync(), Brightness.setBrightnessAsync()', () => {
      t.it('gets and sets the current brightness of the app screen', async () => {
        const originalValue = 0.2;
        let wasRejected = false;
        try {
          await Brightness.setBrightnessAsync(originalValue);
        } catch (error) {
          wasRejected = true;
        }
        const obtainedValue = await Brightness.getBrightnessAsync();
        t.expect(Math.abs(originalValue - obtainedValue)).toBeLessThan(EPSILON);
        t.expect(wasRejected).toBe(false);
      });

      t.it(
        'set to the lowest brightness when the values passed to the setter are too low',
        async () => {
          const tooLowValue = -0.1;
          let wasRejected = false;
          try {
            await Brightness.setBrightnessAsync(tooLowValue);
          } catch (error) {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          t.expect(Math.abs(0 - obtainedValue)).toBeLessThan(EPSILON);
          t.expect(wasRejected).toBe(false);
        }
      );

      t.it(
        'set to the highest brightness when the values passed to the setter are too high',
        async () => {
          const tooHighValue = 1.1;
          let wasRejected = false;
          try {
            await Brightness.setBrightnessAsync(tooHighValue);
          } catch (error) {
            wasRejected = true;
          }
          const obtainedValue = await Brightness.getBrightnessAsync();
          t.expect(Math.abs(1 - obtainedValue)).toBeLessThan(EPSILON);
          t.expect(wasRejected).toBe(false);
        }
      );
    });
    t.describe('Brightness.setSystemBrightnessAsync()', () => {
      t.it('doesnt crash', async () => {
        // changing system brightness on android wont work with insufficient permissions, but wont crash
        let errorCode = '';
        let wasRejected = false;
        try {
          await Brightness.setSystemBrightnessAsync(0.5);
        } catch (error) {
          errorCode = error.code;
          wasRejected = true;
        }
        t.expect(wasRejected === false || errorCode === 'E_BRIGHTNESS_PERMISSIONS').toBe(true);
      });
    });

    t.describe('Brightness.getSystemBrightness()', () => {
      t.it('doesnt crash', async () => {
        // changing system brightness on android wont work with insufficient permissions, but wont crash
        const obtainedValue = await Brightness.getSystemBrightnessAsync();
        t.expect(obtainedValue).toBeGreaterThan(0 - EPSILON);
        t.expect(obtainedValue).toBeLessThan(1 + EPSILON);
      });
    });
  });
}
