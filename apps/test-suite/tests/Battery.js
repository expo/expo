import * as Battery from 'expo-battery';

export const name = 'Battery';

export async function test({ describe, it, expect, jasmine }) {
  describe('getBatteryLevelAsync()', () => {
    it('returns a number between 0 and 1', async () => {
      let batteryLevel = await Battery.getBatteryLevelAsync();
      expect(batteryLevel).toEqual(jasmine.any(Number));
      expect(batteryLevel).toBeLessThanOrEqual(1);
      expect(batteryLevel).toBeGreaterThan(0);
    });
  });
  describe('getBatteryState()', () => {
    it('returns a valid BatteryState enum value', async () => {
      const batteryState = await Battery.getBatteryStateAsync();

      expect(batteryState).toBeDefined();
      expect(batteryState).toEqual(jasmine.any(Number));
      expect(batteryState).toBeGreaterThanOrEqual(0);
      expect(batteryState).toBeLessThanOrEqual(4);
    });
  });
  describe('isLowPowerModeEnabledAsync()', () => {
    it('returns a boolean low power mode', async () => {
      const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
      expect(lowPowerMode).toEqual(jasmine.any(Boolean));
    });
  });
  describe('getPowerStateAsync()', () => {
    it('returns a valid PowerState object', async () => {
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

  describe('Event listeners', () => {
    let _subscriptionBatteryLevel, _subscriptionBatteryState, _subscriptionPowerMode;

    //event listeners do register
    it('addLowPowerModeListener() registers', () => {
      _subscriptionPowerMode = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
        console.log('powerMode changed!', lowPowerMode);
      });
      expect(_subscriptionPowerMode).toBeDefined();
      // clean up
      _subscriptionPowerMode && _subscriptionPowerMode.remove();
      _subscriptionPowerMode = null;
    });

    it('addBatteryStateListener() registers', () => {
      _subscriptionBatteryState = Battery.addBatteryStateListener(({ batteryState }) => {
        console.log('batteryState changed!', batteryState);
      });
      expect(_subscriptionBatteryState).toBeDefined();

      // clean up
      _subscriptionBatteryState && _subscriptionBatteryState.remove();
      _subscriptionBatteryState = null;
    });

    it('addBatteryLevelListener() registers', () => {
      _subscriptionBatteryLevel = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        console.log('batteryLevel changed!', batteryLevel);
      });
      expect(_subscriptionBatteryLevel).toBeDefined();

      // clean up
      _subscriptionBatteryLevel && _subscriptionBatteryLevel.remove();
      _subscriptionBatteryLevel = null;
    });

    // Event listeners can unsubscribe
    it('low power mode listener can unsubscribe', () => {
      //subscribe
      _subscriptionPowerMode = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
        console.log('powerMode changed!', lowPowerMode);
      });

      _subscriptionPowerMode && _subscriptionPowerMode.remove();
      _subscriptionPowerMode = null;
      expect(_subscriptionPowerMode).toBeNull();
    });

    it('battery level listener can unsubscribe', () => {
      //subscribe
      _subscriptionBatteryLevel = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        console.log('batteryLevel changed!', batteryLevel);
      });
      _subscriptionBatteryLevel && _subscriptionBatteryLevel.remove();
      _subscriptionBatteryLevel = null;
      expect(_subscriptionBatteryLevel).toBeNull();
    });
    it('battery state listener can unsubscribe', () => {
      //subscribe
      _subscriptionBatteryState = Battery.addBatteryStateListener(({ batteryState }) => {
        console.log('batteryState changed!', batteryState);
      });

      _subscriptionBatteryState && _subscriptionBatteryState.remove();
      _subscriptionBatteryState = null;
      expect(_subscriptionBatteryState).toBeNull();
    });

    // TODO: check that events don't get fired after we unsubscribe
    // but we currently don't have a way to programmatically set battery statuses
  });
}
