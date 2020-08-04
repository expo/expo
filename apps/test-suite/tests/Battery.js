import { Platform } from '@unimodules/core';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';

export const name = 'Battery';

export async function test({ describe, it, expect, jasmine }) {
  const isExpectedToSupport = Device.isDevice || Platform.OS === 'android';

  describe('Battery', async () => {
    describe(`isAvailableAsync`, () => {
      it(
        isExpectedToSupport
          ? `should be true for Android or iOS devices`
          : `should be false on iOS simulator`,
        async () => {
          expect(await Battery.isAvailableAsync()).toEqual(isExpectedToSupport);
        }
      );
    });

    const isAvailable = await Battery.isAvailableAsync();

    if (isAvailable) {
      describe(`getBatteryLevelAsync()`, () => {
        it(`returns a number between 0 and 1`, async () => {
          let batteryLevel = await Battery.getBatteryLevelAsync();
          expect(batteryLevel).toEqual(jasmine.any(Number));
          expect(batteryLevel).toBeLessThanOrEqual(1);
          expect(batteryLevel).toBeGreaterThan(0);
        });
      });
      describe(`getBatteryState()`, () => {
        it(`returns a valid BatteryState enum value`, async () => {
          const batteryState = await Battery.getBatteryStateAsync();
          expect(
            [
              Battery.BatteryState.CHARGING,
              Battery.BatteryState.FULL,
              Battery.BatteryState.UNPLUGGED,
            ].includes(batteryState)
          ).toBe(true);
        });
      });
      describe(`isLowPowerModeEnabledAsync()`, () => {
        it(`returns a boolean low power mode`, async () => {
          const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
          expect(lowPowerMode).toEqual(jasmine.any(Boolean));
        });
      });
      describe(`getPowerStateAsync()`, () => {
        it(`returns a valid PowerState object`, async () => {
          const powerState = await Battery.getPowerStateAsync();
          expect(powerState).toEqual(
            jasmine.objectContaining({
              batteryLevel: jasmine.any(Number),
              batteryState: jasmine.any(Number),
              lowPowerMode: jasmine.any(Boolean),
            })
          );
        });
      });

      describe(`Event listeners`, () => {
        // TODO(Bacon) Add detox & spies
        // TODO: check that events don't get fired after we unsubscribe
        // but we currently don't have a way to programmatically set battery statuses

        it(`addLowPowerModeListener() registers`, () => {
          const listener = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
            console.log('powerMode changed!', lowPowerMode);
          });
          // TODO: Invoke callback somehow
          expect(listener).toBeDefined();
          listener.remove();
        });
        it(`addBatteryStateListener() registers`, () => {
          const listener = Battery.addBatteryStateListener(({ batteryState }) => {
            console.log('batteryState changed!', batteryState);
          });
          // TODO: Invoke callback somehow
          expect(listener).toBeDefined();
          listener.remove();
        });
        it(`addBatteryLevelListener() registers`, () => {
          const listener = Battery.addBatteryLevelListener(({ batteryLevel }) => {
            console.log('batteryLevel changed!', batteryLevel);
          });
          // TODO: Invoke callback somehow
          expect(listener).toBeDefined();
          listener.remove();
        });
      });
    }
  });
}
