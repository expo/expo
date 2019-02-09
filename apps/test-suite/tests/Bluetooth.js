import { mockPlatformIOS, unmockAllProperties, mockPlatformAndroid } from 'jest-expo';

import {
  Characteristics,
  Descriptors,
  JSONToNative,
  nativeToJSON,
  Services,
} from 'expo-bluetooth-utils';
import * as Bluetooth from 'expo-bluetooth';
import { Permissions } from 'expo';
import { NativeModulesProxy, Platform } from 'expo-core';

const { ExpoBluetooth } = NativeModulesProxy;

const sleep = t => new Promise(r => setTimeout(r, t));

const peripheralUUID = '<DEBUG_PERIPHERAL_UUID>';
const internalServiceID = 'peripheral|service';
const internalCharacteristicID = internalServiceID + '|characteristic';
const internalDescriptorID = internalCharacteristicID + '|descriptor';

function getGATTNumbersFromID(id) {
  if (!id || id === '') {
    throw new Error('getGATTNumbersFromID(): Cannot get static data for null GATT number');
  }
  const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = id.split('|');
  return {
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    descriptorUUID,
  };
}

function getStaticDataFromGATT({ id }) {
  if (!id || id === '') {
    throw new Error('getStaticDataFromGATT(): Cannot get static data for null GATT number');
  }
  const inputValues = [{}, Services, Characteristics, Descriptors];
  const components = id.split('|');
  const dataSet = inputValues[components.length - 1];
  return dataSet[components[components.length - 1]];
}

function getStaticInfoFromGATT(gatt) {
  const dataSet = getStaticDataFromGATT(gatt);
  let parsedValue = null;
  if (dataSet) {
    // TODO: Bacon: Add format to each data set item. Since this isn't done lets try converting every value to UTF-8

    if (gatt.value != null && dataSet.format === 'utf8') {
      parsedValue = nativeToJSON(gatt.value);
    }

    return {
      ...gatt,
      parsedValue,
      specForGATT: dataSet,
    };
  }
  return gatt;
}

export const name = 'Bluetooth';


async function attemptQuickConnectionAsync(peripheralUUID, onDisconnect, timeout) {
    try {
        return await Bluetooth.connectAsync(peripheralUUID, { onDisconnect, timeout });
    } catch (error) {
        return;
    }
}
async function getConnectedPeripheralAsync(onDisconnect) {
    let attemptedConnections = [];
    return new Promise(async resolve => {
        let connected;
        const stopScanning = await Bluetooth.startScanningAsync({}, async peripheral => {
            /* Named peripherals have a higher chance of interaction. For brevity let's use them. */
            if (Platform.OS === 'ios' && peripheral.name === "BaconBook") {
                await stopScanning();
                const _connected = await attemptQuickConnectionAsync(peripheral.id,onDisconnect, 5000);
                resolve(peripheral);
                return;
            }
            if (!connected && peripheral.name && peripheral.name.length && attemptedConnections.indexOf(peripheral.id) < 0) {
                attemptedConnections.push(peripheral.id);
                console.log('attempt to connect to ', peripheral.id);
                const _connected = await attemptQuickConnectionAsync(peripheral.id, onDisconnect, 3000);
                if (!connected && _connected) {
                    connected = _connected;
                    console.log("actually connected to: ", connected.id, connected.name);
                    stopScanning();
                    
                    resolve(peripheral);
                }
            }
        });
});
//   const peripheral = await scanForSinglePeripheral();
//   try {
//     console.log('attempt to connect to ', peripheral);
//     return await Bluetooth.connectAsync(peripheral.id, { timeout: 240000, ...options });
//   } catch (error) {
//     throw new Error(
//       'Failed to connect to a peripheral in time, this is expected. Please try again.'
//     );
//   }
}

function scanForSinglePeripheral(options) {
  return new Promise(async resolve => {
    const stopScanning = await Bluetooth.startScanningAsync(options, peripheral => {
      /* Named peripherals have a higher chance of interaction. For brevity let's use them. */
      if (peripheral.name && peripheral.name.length) {
        //   if (peripheral.name === 'LE-reserved') {
        stopScanning();
        resolve(peripheral);
      }
    });
  });
}

function validatePeripheral(peripheral, expect) {
  expect(peripheral).toBeDefined();
  expect(typeof peripheral.state).toBe('string');
  expect(Object.values(Bluetooth.PeripheralState).includes(peripheral.state)).toBe(true);
  expect(peripheral.advertisementData).toBeDefined();
}

export async function test({
  describe,
  xdescribe,
  it,
  xit,
  expect,
  afterEach,
  beforeEach,
  jasmine,
}) {
  await Permissions.askAsync(Permissions.LOCATION);



  async function clearAllConnections() {
    try {
        
        const connected = await Bluetooth.getConnectedPeripheralsAsync();
        console.log("- CLEAR", connected.length);
        
        await Promise.all(connected.map(({ id }) => {

            return Promise.all([
                Bluetooth.disconnectAsync(id), 
                // Bluetooth.android.clearCacheForPeripheralAsync(id)
            ]) 
        }));

        // for (const peripheral of connected) {
        //     await Bluetooth.disconnectAsync(peripheral.id);
        //     console.log("- DISCONNECTED: ", peripheral.id);
        //     if (Bluetooth.android.refreshPeripheralAsync) {
        //         await Bluetooth.android.refreshPeripheralAsync(peripheral.id);
        //         console.log("- REFRESHED: ", peripheral.id);

        //     }
        // }

        const thenConnected = await Bluetooth.getConnectedPeripheralsAsync();
        console.log("- SUCCESSFUL CLEAR: ", 
        thenConnected.length
        );
    } catch (e) {
        console.log("FAILED TO CLEAR: ", e.message);
    }
    await Bluetooth._reset();
  }

//   await clearAllConnections();


  let originalTimeout;
  const longerTimeout = 35000;
  
  
  beforeEach(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = longerTimeout;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  async function toThrowAsync(method) {
    try {
      await method();
      expect('Method').toBe('To Fail');
    } catch (error) {
      return error;
    }
  }

  function rejectsInvalidPeripheralUUID(method) {
    it('rejects an invalid peripheral UUID', async () => {
      let message;
      try {
        await method();
        expect('Method').toBe('To Fail');
      } catch (error) {
        message = error.message;
      }
      expect(message).toBe('expo-bluetooth: Invalid UUID provided');
    });
  }


  xdescribe('1. Scanning', () => {
    beforeEach(async () => {
      await Bluetooth.stopScanAsync();
    });

    describe('startScanAsync', () => {
      it(`throws an error when the device is already scanning.`, async () => {
          expect(await Bluetooth.isScanningAsync()).toBe(false);
          await Bluetooth.startScanningAsync({}, () => {});
          const error = toThrowAsync(() => Bluetooth.startScanningAsync({}, () => {}));
          expect(error).toBeDefined();
      });

      // TODO: Bacon: Broken on Android.
      it('can stop scanning with the returned function.', async () => {
        let isScanning = await Bluetooth.isScanningAsync();
        expect(typeof isScanning).toBe('boolean');
        const stopScan = await Bluetooth.startScanningAsync({}, async () => {});
        expect(await Bluetooth.isScanningAsync()).toBe(true);
        await stopScan();
        expect(await Bluetooth.isScanningAsync()).toBe(false);
      });

    });

        describe('stopScanAsync', () => {
            it(`correctly works with isScanningAsync()`, async () => {
                expect(await Bluetooth.isScanningAsync()).toBe(false);
                await Bluetooth.startScanningAsync({}, () => {});
                expect(await Bluetooth.isScanningAsync()).toBe(true);
                await Bluetooth.stopScanAsync();
                expect(await Bluetooth.isScanningAsync()).toBe(false);
            });
        });
    });

    xdescribe('2. Connecting', async () => {

        beforeEach(async () => {
            await Bluetooth.stopScanAsync();
            await clearAllConnections()
        })

        describe('disconnectAsync', () => {
            rejectsInvalidPeripheralUUID(Bluetooth.disconnectAsync);
        });

        describe('connectAsync()', () => {
            rejectsInvalidPeripheralUUID(Bluetooth.connectAsync);
      
            it('calls onDisconnect', async () => {
              function connectThenDisconnect() {
                return new Promise(async (resolve, reject) => {
                  try {
                    const peripheral = await getConnectedPeripheralAsync( () => {
                        resolve(true);
                    });
                    await Bluetooth.disconnectAsync(peripheral.id);
                    console.log("Disconnected...")
                    await sleep(20);
                  } catch (error) {
                    throw error;
                  }
                });
              }
              expect(await connectThenDisconnect()).toBe(true);
            });
      
            // TODO: Bacon: This is hard on iOS because it can connect instantly. Maybe there is a way to clear caches.
            xit('times out', async () => {
              const peripheral = await scanForSinglePeripheral();
              const { code } = await toThrowAsync(() => Bluetooth.connectAsync(peripheral.id, { timeout: 1 }));
              expect(code).toBe('timeout');
            });
          });

        it(`can discover and connect to a peripheral`, async () => {
            const connectedPeripheral = await getConnectedPeripheralAsync();
            validatePeripheral(connectedPeripheral, expect);
            await Bluetooth.disconnectAsync(connectedPeripheral.id);
        });
        
        it(`can discover, connect, and disconnect a peripheral`, async () => {
            const connectedPeripheral = await getConnectedPeripheralAsync();
            validatePeripheral(connectedPeripheral, expect);
            await Bluetooth.disconnectAsync(connectedPeripheral.id);
        });
        
        it(`can discover, connect, and load a peripheral`, async () => {
            const connectedPeripheral = await getConnectedPeripheralAsync();
            validatePeripheral(connectedPeripheral, expect);
            const loaded = await Bluetooth.loadPeripheralAsync(connectedPeripheral, true);
            expect(loaded).toBeDefined();
        });
    });


    xdescribe('3. Retrieving', () => {
        it('getPeripheralsAsync', async () => {
          const arr = await Bluetooth.getPeripheralsAsync();
          expect(Array.isArray(arr)).toBe(true);
          // expect(ExpoBluetooth.getPeripheralsAsync).toHaveBeenLastCalledWith();
        });
        it('getConnectedPeripheralsAsync', async () => {
          const arr = await Bluetooth.getConnectedPeripheralsAsync();
          expect(Array.isArray(arr)).toBe(true);
          // expect(ExpoBluetooth.getConnectedPeripheralsAsync).toHaveBeenLastCalledWith();
        });
        it('getCentralAsync', async () => {
          const central = await Bluetooth.getCentralAsync();
          expect(central).toBeDefined();
          expect(Object.values(Bluetooth.CentralState).includes(central.state)).toBe(true);
          // expect(ExpoBluetooth.getCentralAsync).toHaveBeenLastCalledWith();
        });
      });

      xdescribe('4. RSSI - readRSSIAsync()', () => {
        rejectsInvalidPeripheralUUID(Bluetooth.readRSSIAsync);
    
        it('fails if the peripheral is not connected.', async () => {
          const peripheral = await scanForSinglePeripheral();
          if (peripheral.state === Bluetooth.PeripheralState.Connected) {
              await Bluetooth.disconnectAsync(peripheral.id);
          }

          const { message: errorMessage } = await toThrowAsync(() =>
            Bluetooth.readRSSIAsync(peripheral.id)
          );
          expect(errorMessage.includes('not connected')).toBe(true);
        });
    
        // TODO: Bacon: Broken on iOS - not ever calling the delegate method didReadRSSI
        xit('can read an RSSI as expected.', async () => {
            const connectedPeripheral = await getConnectedPeripheralAsync();
          const RSSI = await Bluetooth.readRSSIAsync(connectedPeripheral.id);
          console.log('HEYYYYY', RSSI);
          expect(RSSI).toBeDefined();
          expect(typeof RSSI).toBe('number');
        });
      });

      xdescribe('5. Observing', () => {
        describe('observeUpdates()', () => {
            it('will be called with all of the current peripheral data.', async () => {
              function getsUpdated() {
                return new Promise(async res => {
                  const subscription = await Bluetooth.observeUpdates(({ peripherals }) => {
                    console.log('BLE Screen: observeUpdatesAsync: ', peripherals);
                    res(peripherals);
                    subscription.remove();
                  });
                });
              }
        
              const stopScanning = await Bluetooth.startScanningAsync({}, peripheral => {});
              expect(await getsUpdated()).toBeDefined();
              stopScanning();
            });
          });
          describe('observeStateAsync()', () => {
            function getCentralManagerStateAsync() {
              return new Promise(async resolve => {
                const subscription = await Bluetooth.observeStateAsync(state => {
                  subscription.remove();
                  resolve(state);
                });
              });
            }
        
            it(`get's the central manager state.`, async () => {
              const state = await getCentralManagerStateAsync();
              expect(Object.values(Bluetooth.CentralState).includes(state)).toBe(true);
            });
          });
      })
//   const peripheral = await scanForSinglePeripheral();
//       validatePeripheral(peripheral, expect);

  //   afterEach(unmockAllProperties);

//   describe('modify notifications', () => {
//     describe('shouldNotifyDescriptorAsync', () => {
//       //   if (!isNotifying && properties.includes('notify')) {
//       //     await Bluetooth.shouldNotifyDescriptorAsync({
//       //       ...getGATTNumbersFromID(this.props.id),
//       //       shouldNotify: true,
//       //     });
//       //   }
//     });
//   });

    describe('6. Discovery', () => {

    describe('discoverServicesForPeripheralAsync()', async () => {

        it(`discovers, then connects to a peripheral, the peripheral then discovers it's services.`, async () => {
            const connectedPeripheral = await getConnectedPeripheralAsync();
            validatePeripheral(connectedPeripheral, expect);

            const {
              peripheral: { services },
            } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });

            expect(Array.isArray(services)).toBe(true);

            // TODO: Bacon: Validate services
        });

        describe('discoverIncludedServicesForServiceAsync()', async () => {
            it(`discovers included services for a given service.`, async () => {
                const connectedPeripheral = await getConnectedPeripheralAsync();
                validatePeripheral(connectedPeripheral, expect);
    
                const {
                    peripheral: { services },
                  } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });
                  expect(Array.isArray(services)).toBe(true);
                  expect(services.length > 0).toBe(true);
                  if (services.length) {
                      const {
                        service: { includedServices },
                      } = await Bluetooth.discoverIncludedServicesForServiceAsync({ id: services[0].id });

                      expect(Array.isArray(includedServices)).toBe(true);

                  }
                  
    
    
                // TODO: Bacon: Validate services
            });
        });

    describe('discoverCharacteristicsForServiceAsync()', async () => {
     
        it(`discovers characteristics for a given service.`, async () => {

            const connectedPeripheral = await getConnectedPeripheralAsync();
            validatePeripheral(connectedPeripheral, expect);

            const {
                peripheral: { services },
                } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });
                expect(Array.isArray(services)).toBe(true);
                expect(services.length > 0).toBe(true);
                if (services.length) {
                    const {
                        service: { characteristics },
                    } = await Bluetooth.discoverCharacteristicsForServiceAsync({ id: services[0].id });
                
                    expect(Array.isArray(characteristics)).toBe(true);
                }

        });

        describe('discoverDescriptorsForCharacteristicAsync()', async () => {
            it(`discovers descriptors for a given characteristic.`, async () => {
                const connectedPeripheral = await getConnectedPeripheralAsync();
                validatePeripheral(connectedPeripheral, expect);
    
                const {
                    peripheral: { services },
                    } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });
                    expect(Array.isArray(services)).toBe(true);
                    expect(services.length > 0).toBe(true);
                    if (services.length) {
                        const {
                            service: { characteristics },
                        } = await Bluetooth.discoverCharacteristicsForServiceAsync({ id: services[0].id });
                    
                        expect(Array.isArray(characteristics)).toBe(true);
                        expect(characteristics.length > 0).toBe(true);
                        if (characteristics.length) {
                            const {
                                characteristic: { descriptors },
                              } = await Bluetooth.discoverDescriptorsForCharacteristicAsync({ id: characteristics[0].id });
                              expect(Array.isArray(descriptors)).toBe(true);
                        }
                    }
          });
        });
    });
   

    });
   

  });

  return;

  
 
    xdescribe('reading', async () => {

        const connectedPeripheral = await getConnectedPeripheralAsync();
        const loaded = await Bluetooth.loadPeripheralAsync(connectedPeripheral, true);

        console.log(" LOADED ", loaded);
    //     it('readCharacteristicAsync', async () => {
    //     const someReadValue = await Bluetooth.readCharacteristicAsync(
    //       getGATTNumbersFromID(internalCharacteristicID)
    //     );
    //   });
    //   it('readDescriptorAsync', async () => {
    //     const someReadValue = await Bluetooth.readDescriptorAsync(
    //       getGATTNumbersFromID(internalDescriptorID)
    //     );
    //   });
    });
    xdescribe('writing', () => {
        it('writeCharacteristicAsync', async () => {
        // properties.includes('write');
        await Bluetooth.writeCharacteristicAsync({
          ...getGATTNumbersFromID(internalCharacteristicID),
          data: JSONToNative('bacon'),
        });
      });
      it('writeCharacteristicWithoutResponseAsync', async () => {
        await Bluetooth.writeCharacteristicWithoutResponseAsync({
          ...getGATTNumbersFromID(internalCharacteristicID),
          data: JSONToNative('bacon'),
        });
      });
      it('writeDescriptorAsync', async () => {
        await Bluetooth.writeDescriptorAsync({
          ...getGATTNumbersFromID(internalDescriptorID),
          data: JSONToNative('bacon'),
        });
      });
    });
    




 
  // const debugPeripheral = { id: peripheralUUID };
  // const debugService = { id: internalServiceID };
  // const debugCharacteristic = { id: internalCharacteristicID };
 
  
 
  if (Platform.OS === 'android') {

    xdescribe('Android only', () => {
        //   beforeEach(mockPlatformAndroid);
        //   afterEach(unmockAllProperties);
        xdescribe('requestMTUAsync', () => {
          it(`works as expected`, async () => {
            const peripheral = await getConnectedPeripheralAsync();
            await Bluetooth.android.requestMTUAsync(peripheral.id, 4);
          });
        });
    
        describe('clearCacheForPeripheralAsync', () => {
            beforeEach(async () => {
                console.log("BEFORE EACH");
                await clearAllConnections();
            });
            
        //     it(`works as expected`, async () => {
        //     const peripheral = await getConnectedPeripheralAsync();
        //     await Bluetooth.android.clearCacheForPeripheralAsync(peripheral.id);
        //   });
          it(`b works as expected`, async () => {
            const peripheral = await getConnectedPeripheralAsync();
    
          });
          it(`c works as expected`, async () => {
            const peripheral = await getConnectedPeripheralAsync();
    
          });
          it(`d works as expected`, async () => {
            const peripheral = await getConnectedPeripheralAsync();
          });
        });
        xdescribe('bonding', () => {
          it(`works as expected`, async () => {
            const peripheral = await scanForSinglePeripheral();
            await Bluetooth.android.createBondAsync(peripheral.id);
    
            await Bluetooth.android.removeBondAsync(peripheral.id);
          });
        });
        xdescribe('enableBluetoothAsync', () => {
          it(`works as expected`, async () => {
            // Bluetooth.android.observeBluetoothAvailabilty(central => {})
            await Bluetooth.android.enableBluetoothAsync(true);
          });
        });
        xdescribe('getBondedPeripheralsAsync', () => {
          it(`works as expected`, async () => {
            await Bluetooth.android.getBondedPeripheralsAsync();
          });
        });
        xdescribe('requestConnectionPriorityAsync', () => {
          it(`works as expected`, async () => {
            const peripheral = await scanForSinglePeripheral();
            await Bluetooth.android.requestConnectionPriorityAsync(peripheral.id, 1);
          });
        });
      });

  }

}
// getStaticInfoFromGATT(this.props);
