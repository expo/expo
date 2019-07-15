/* eslint-disable prettier/prettier */
import * as Battery from 'expo-battery';

export const name = 'Battery';

export async function test({ describe, it, expect, jasmine }) {
    describe(name, () => {
        describe('Test Getters', () => {
            it('Gets current battery level', async () => {
                let batteryLevel;
                let wasRejected = false;
                try {
                    batteryLevel = await Battery.getBatteryLevelAsync();
                } catch (error) {
                    wasRejected = true;
                }
                expect(batteryLevel).toBeLessThanOrEqual(1);
                expect(batteryLevel).toBeGreaterThan(0);
                expect(wasRejected).toBe(false);
            });
            it('Gets battery state', async () => {
                let batteryState;
                let wasRejected = false;
                try {
                    batteryState = await Battery.getBatteryStateAsync();
                } catch (error) {
                    wasRejected = true;
                }
                expect(batteryState).toBeDefined();
                expect(batteryState).toEqual(jasmine.any(String));
                expect(wasRejected).toBe(false);
            });
            it('Gets low power mode', async () => {
                let lowPowerMode;
                let wasRejected = false;
                try {
                    lowPowerMode = await Battery.getLowPowerModeStatusAsync();
                } catch (error) {
                    wasRejected = true;
                }
                expect(lowPowerMode).toBeDefined();
                expect(lowPowerMode).toEqual(jasmine.any(String));
                expect(wasRejected).toBe(false);
            });
            it('Gets power state', async () => {
                let powerState;
                let wasRejected = false;
                try {
                    powerState = await Battery.getPowerStateAsync();
                } catch (error) {
                    wasRejected = true;
                }
                expect(powerState).toBeDefined();
                expect(wasRejected).toBe(false);
            });
        });

        describe('Event listeners', () => {
            let _subscriptionBatteryLevel, _subscriptionBatteryState, _subscriptionPowerMode;

            //event listeners do register
            it('Registers event listeners', () => {
                let hasError = false;
                try {
                    _subscriptionPowerMode = Battery.watchPowerModeChange(({ lowPowerMode }) => {
                        console.log('powerMode changed!', lowPowerMode);
                    });
                    _subscriptionBatteryState = Battery.watchBatteryStateChange(({ batteryState }) => {
                        console.log('batteryState changed!', batteryState);
                    });
                    _subscriptionBatteryLevel = Battery.watchBatteryLevelChange(({ batteryLevel }) => {
                        console.log('batteryLevel changed!', batteryLevel);
                    });
                } catch(e) {
                    console.log(e);
                    hasError = true;
                }
                expect(hasError).toBe(false);
                expect(_subscriptionBatteryLevel).toBeDefined();
                expect(_subscriptionBatteryState).toBeDefined();
                expect(_subscriptionPowerMode).toBeDefined();
            })

            //Event listeners can unsubscribe
            it('Remove all event listeners', async () => {
                let hasError = false;
                try {
                    _subscriptionPowerMode && _subscriptionPowerMode.remove();
                    _subscriptionPowerMode = null;
                    _subscriptionBatteryState && _subscriptionBatteryState.remove();
                    _subscriptionBatteryState = null;
                    _subscriptionBatteryLevel && _subscriptionBatteryLevel.remove();
                    _subscriptionBatteryLevel = null;
                } catch (e) {
                    hasError = true;
                }
                expect(_subscriptionBatteryLevel).toBeNull();
                expect(_subscriptionBatteryState).toBeNull();
                expect(_subscriptionPowerMode).toBeNull();
                expect(hasError).toBe(false);
            });
        });
    });
}
