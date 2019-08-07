import * as Battery from 'expo-battery';

export const name = 'Battery';

export async function test({ describe, it, expect, jasmine }) {
  describe(name, () => {
    describe('Battery.getBatteryLevelAsync()', () => {
      it('returns a number between 0 and 1', async () => {
        let batteryLevel;
        let wasRejected = false;
        try {
          batteryLevel = await Battery.getBatteryLevelAsync();
        } catch (error) {
          wasRejected = true;
        }
        expect(wasRejected).toBe(false);
        expect(batteryLevel).toEqual(jasmine.any(Number))
        expect(batteryLevel).toBeLessThanOrEqual(1);
        expect(batteryLevel).toBeGreaterThan(0);
      });
    });
    describe('Battery.getBatteryState()', () => {
      it('returns a valid BatteryState enum value', async () => {
        let batteryState;
        let wasRejected = false;
        try {
          batteryState = await Battery.getBatteryStateAsync();
        } catch (error) {
          wasRejected = true;
        }
        expect(wasRejected).toBe(false);
        expect(batteryState).toBeDefined();
        expect(batteryState).toEqual(jasmine.any(Number))
        expect(batteryState).toBeGreaterThanOrEqual(0);
        expect(batteryState).toBeLessThanOrEqual(4);
      });
    });
    describe('Battery.isLowPowerModeEnabledAsync()',() => {
      it('returns a boolean low power mode', async () => {
        let lowPowerMode;
        let wasRejected = false;
        try {
          lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
        } catch (error) {
          wasRejected = true;
        }
        expect(wasRejected).toBe(false);
        expect(lowPowerMode).toBeDefined();
        expect(lowPowerMode).toEqual(jasmine.any(Boolean));
      });
    });
    describe('Battery.getPowerStateAsync()', () => {
      it('returns a valid PowerState object', async () => {
        let powerState;
        let wasRejected = false;
        try {
          powerState = await Battery.getPowerStateAsync();
        } catch (error) {
          wasRejected = true;
        }
        expect(wasRejected).toBe(false);
        expect(powerState).toBeDefined();
        expect(powerState).toEqual(jasmine.any(Object))
      });
    });

    describe('Event listeners', () => {
      let _subscriptionBatteryLevel, _subscriptionBatteryState, _subscriptionPowerMode;

      //event listeners do register
      it('addLowPowerModeListener() registers', () => {
        let hasError = false;
        try {
          _subscriptionPowerMode = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
            console.log('powerMode changed!', lowPowerMode);
          });
        } catch (e) {
          console.log(e);
          hasError = true;
        }
        expect(hasError).toBe(false);
        expect(_subscriptionPowerMode).toBeDefined();

        // clean up
        _subscriptionPowerMode && _subscriptionPowerMode.remove();
        _subscriptionPowerMode = null;
      });

      it('addBatteryStateListener() registers', () => {
        let hasError = false;
        try {
          _subscriptionBatteryState = Battery.addBatteryStateListener(({ batteryState }) => {
            console.log('batteryState changed!', batteryState);
          });
        } catch (e) {
          console.log(e);
          hasError = true;
        }
        expect(hasError).toBe(false);
        expect(_subscriptionBatteryState).toBeDefined();

        // clean up
        _subscriptionBatteryState && _subscriptionBatteryState.remove();
        _subscriptionBatteryState = null;
      });

      it('addBatteryLevelListener() registers', () => {
        let hasError = false;
        try {
          _subscriptionBatteryLevel = Battery.addBatteryLevelListener(({ batteryLevel }) => {
            console.log('batteryLevel changed!', batteryLevel);
          });
        } catch (e) {
          console.log(e);
          hasError = true;
        }
        expect(hasError).toBe(false);
        expect(_subscriptionBatteryLevel).toBeDefined();

        // clean up
        _subscriptionBatteryLevel && _subscriptionBatteryLevel.remove();
        _subscriptionBatteryLevel = null;
      });


      // Event listeners can unsubscribe
      it('low power mode listener can unsubscribe', () => {
        let hasError = false;

        //subscribe
        _subscriptionPowerMode = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
          console.log('powerMode changed!', lowPowerMode);
        });

        try {
          _subscriptionPowerMode && _subscriptionPowerMode.remove();
          _subscriptionPowerMode = null;
        } catch (e) {
          hasError = true;
        }
        expect(hasError).toBe(false);
        expect(_subscriptionPowerMode).toBeNull();
      });

      it('battery level listener can unsubscribe', () => {
        let hasError = false;

        //subscribe
        _subscriptionBatteryLevel = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          console.log('batteryLevel changed!', batteryLevel);
        });

        try {
          _subscriptionBatteryLevel && _subscriptionBatteryLevel.remove();
          _subscriptionBatteryLevel = null;
        } catch (e) {
          hasError = true;
        }
        expect(hasError).toBe(false);
        expect(_subscriptionBatteryLevel).toBeNull();
      });
      it('battery state listener can unsubscribe', () => {
        let hasError = false;

        //subscribe
        _subscriptionBatteryState = Battery.addBatteryStateListener(({ batteryState }) => {
          console.log('batteryState changed!', batteryState);
        });

        try {
          _subscriptionBatteryState && _subscriptionBatteryState.remove();
          _subscriptionBatteryState = null;
        } catch (e) {
          hasError = true;
        }
        expect(hasError).toBe(false);
        expect(_subscriptionBatteryState).toBeNull();
      });

      // TODO: check that events don't get fired after we unsubscribe
      // but we currently don't have a way to programmatically set battery statuses
    });
  });
}
