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
import { NativeModulesProxy } from 'expo-core';

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

function scanForSinglePeripheral(options) {
  return new Promise(resolve => {
    const stopScanning = Bluetooth.startScan(options, peripheral => {
      /* Named peripherals have a higher chance of interaction. For brevity let's use them. */
      if (peripheral.name && peripheral.name.length) {
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

export async function test({ describe, it, xit, expect, afterEach, beforeEach, jasmine }) {
  await Permissions.askAsync(Permissions.LOCATION);

  let originalTimeout;
  const longerTimeout = 30000;
  beforeEach(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = longerTimeout;

    await Bluetooth._reset();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  async function toThrowAsync(method) {
    try {
      await method();
      expect('Method').toBe('To Fail');
    } catch (error) {
      return error.message;
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
  afterEach(unmockAllProperties);
  describe('startScanAsync', () => {
    xit(`get's a valid peripheral`, async () => {
      const peripheral = await scanForSinglePeripheral();
      validatePeripheral(peripheral, expect);
    });
  });
  describe('stopScanAsync', () => {
    xit(`doesn't fail`, async () => {
      await Bluetooth.startScan({}, () => {});
      await Bluetooth.stopScanAsync();
    });
  });
  describe('observeUpdates', () => {
    xit('works', async () => {
      function getsUpdated() {
        return new Promise(async res => {
          const subscription = await Bluetooth.observeUpdates(({ peripherals }) => {
            console.log('BLE Screen: observeUpdatesAsync: ', peripherals);
            res(peripherals);
            subscription.remove();
          });
        });
      }

      const stopScanning = Bluetooth.startScan({}, peripheral => {});

      expect(await getsUpdated()).toBeDefined();

      stopScanning();
    });
  });
  describe('observeStateAsync', () => {
    function getCentralManagerStateAsync() {
      return new Promise(async resolve => {
        const subscription = await Bluetooth.observeStateAsync(state => {
          subscription.remove();
          resolve(state);
        });
      });
    }

    it(`get's the central state`, async () => {
      const state = await getCentralManagerStateAsync();
      expect(Object.values(Bluetooth.CentralState).includes(state)).toBe(true);
    });
  });

  describe('readRSSIAsync', () => {
    rejectsInvalidPeripheralUUID(Bluetooth.readRSSIAsync);
    it('fails if the peripheral is not connected.', async () => {
      const peripheral = await scanForSinglePeripheral();

      const errorMessage = await toThrowAsync(() => Bluetooth.readRSSIAsync(peripheral.id));
      expect(errorMessage.includes('not connected')).toBe(true);
    });
    xit('invokes native method', async () => {
      const peripheral = await scanForSinglePeripheral();

      const RSSI = await Bluetooth.readRSSIAsync(peripheral.id);
      console.log('HEYYYYY', RSSI);
      expect(RSSI).toBeDefined();
      // expect(ExpoBluetooth.readRSSIAsync).toHaveBeenLastCalledWith(peripheralUUID);
    });
  });
  //   describe('connecting/disconnecting', () => {
  //     describe('connectAsync', () => {
  //       rejectsInvalidPeripheralUUID(() => Bluetooth.connectAsync(null));
  //       it('times out', async () => {
  //         const timeout = 5;
  //         const callback = jest.fn();
  //         Bluetooth.connectAsync(peripheralUUID, { onDisconnect: callback, timeout });
  //         expect(callback).not.toBeCalled();
  //         await sleep(timeout + 1);
  //         expect(callback).toBeCalled();
  //       });
  //       it('invokes native method', async () => {
  //         const options = { some: 'v' };
  //         await Bluetooth.connectAsync(peripheralUUID, { options });
  //         expect(ExpoBluetooth.connectPeripheralAsync).toHaveBeenLastCalledWith(
  //           peripheralUUID,
  //           options
  //         );
  //       });
  //     });
  //     describe('disconnectAsync', () => {
  //       rejectsInvalidPeripheralUUID(() => Bluetooth.disconnectAsync(null));
  //       it('invokes native method', async () => {
  //         await Bluetooth.disconnectAsync(peripheralUUID);
  //         expect(ExpoBluetooth.disconnectPeripheralAsync).toHaveBeenLastCalledWith(peripheralUUID);
  //       });
  //     });
  //   });
  //   describe('reading', () => {
  //     describe('readCharacteristicAsync', async () => {
  //       const someReadValue = await Bluetooth.readCharacteristicAsync(
  //         getGATTNumbersFromID(internalCharacteristicID)
  //       );
  //     });
  //     describe('readDescriptorAsync', async () => {
  //       const someReadValue = await Bluetooth.readDescriptorAsync(
  //         getGATTNumbersFromID(internalDescriptorID)
  //       );
  //     });
  //   });
  //   describe('writing', () => {
  //     describe('writeCharacteristicAsync', async () => {
  //       // properties.includes('write');
  //       await Bluetooth.writeCharacteristicAsync({
  //         ...getGATTNumbersFromID(internalCharacteristicID),
  //         data: JSONToNative('bacon'),
  //       });
  //     });
  //     describe('writeCharacteristicWithoutResponseAsync', async () => {
  //       await Bluetooth.writeCharacteristicWithoutResponseAsync({
  //         ...getGATTNumbersFromID(internalCharacteristicID),
  //         data: JSONToNative('bacon'),
  //       });
  //     });
  //     describe('writeDescriptorAsync', async () => {
  //       await Bluetooth.writeDescriptorAsync({
  //         ...getGATTNumbersFromID(internalDescriptorID),
  //         data: JSONToNative('bacon'),
  //       });
  //     });
  //   });
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
  //   describe('get async', () => {
  //     describe('getPeripheralsAsync', async () => {
  //       const arr = await Bluetooth.getPeripheralsAsync();
  //       expect(Array.isArray(arr)).toBe(true);
  //       expect(ExpoBluetooth.getPeripheralsAsync).toHaveBeenLastCalledWith();
  //     });
  //     describe('getConnectedPeripheralsAsync', async () => {
  //       const arr = await Bluetooth.getConnectedPeripheralsAsync();
  //       expect(Array.isArray(arr)).toBe(true);
  //       expect(ExpoBluetooth.getConnectedPeripheralsAsync).toHaveBeenLastCalledWith();
  //     });
  //     describe('getCentralAsync', async () => {
  //       const central = await Bluetooth.getPeripheralsAsync();
  //       expect(ExpoBluetooth.getCentralAsync).toHaveBeenLastCalledWith();
  //     });
  //     describe('isScanningAsync', async () => {
  //       const isScanning = await Bluetooth.isScanningAsync();
  //       expect(typeof isScanning).toBe('boolean');
  //       expect(ExpoBluetooth.getCentralAsync).toHaveBeenLastCalledWith();
  //     });
  //   });
  //   const debugPeripheral = { id: peripheralUUID };
  //   const debugService = { id: internalServiceID };
  //   const debugCharacteristic = { id: internalCharacteristicID };
  //   describe('discovery', () => {
  //     describe('discoverServicesForPeripheralAsync', async () => {
  //       const {
  //         peripheral: { services },
  //       } = await Bluetooth.discoverServicesForPeripheralAsync({ id: debugPeripheral.id });
  //       expect(Array.isArray(services)).toBe(true);
  //     });
  //     describe('discoverIncludedServicesForServiceAsync', async () => {
  //       const {
  //         peripheral: { includedServices },
  //       } = await Bluetooth.discoverIncludedServicesForServiceAsync({ id: debugPeripheral.id });
  //       expect(Array.isArray(includedServices)).toBe(true);
  //     });
  //     describe('discoverCharacteristicsForServiceAsync', async () => {
  //       const {
  //         service: { characteristics },
  //       } = await Bluetooth.discoverCharacteristicsForServiceAsync({ id: debugService.id });
  //       expect(Array.isArray(characteristics)).toBe(true);
  //     });
  //     describe('discoverDescriptorsForCharacteristicAsync', async () => {
  //       const {
  //         characteristic: { descriptors },
  //       } = await Bluetooth.discoverDescriptorsForCharacteristicAsync({ id: debugCharacteristic.id });
  //       expect(Array.isArray(descriptors)).toBe(true);
  //     });
  //   });
  //   describe('requestMTUAsync', async () => {
  //     const debugMTU = 24;
  //     await Bluetooth.android.requestMTUAsync(peripheralUUID, debugMTU);
  //   });
  //   // describe('getPeripherals', () => {
  //   // });
  //   describe('loadPeripheralAsync', async () => {
  //     // TODO: Bacon: Test shape
  //     it('loads', async () => {
  //       try {
  //         await Bluetooth.loadPeripheralAsync({
  //           id: debugPeripheral.id,
  //         });
  //       } catch (error) {}
  //     });
  //     //       discoveryDate = new Date(discoveryTimestamp).toISOString();
  //   });
  //   describe('Android only', () => {
  //     beforeEach(mockPlatformAndroid);
  //     afterEach(unmockAllProperties);
  //     describe('requestMTUAsync', () => {
  //       it(`works as expected`, async () => {
  //         await Bluetooth.android.requestMTUAsync(peripheralUUID, 512);
  //       });
  //     });
  //     describe('createBondAsync', () => {
  //       it(`works as expected`, async () => {
  //         await Bluetooth.android.createBondAsync(peripheralUUID);
  //       });
  //     });
  //     describe('removeBondAsync', () => {
  //       it(`works as expected`, async () => {
  //         await Bluetooth.android.removeBondAsync(peripheralUUID);
  //       });
  //     });
  //     describe('enableBluetoothAsync', () => {
  //       it(`works as expected`, async () => {
  //         await Bluetooth.android.enableBluetoothAsync(true);
  //       });
  //     });
  //     describe('getBondedPeripheralsAsync', () => {
  //       it(`works as expected`, async () => {
  //         await Bluetooth.android.getBondedPeripheralsAsync();
  //       });
  //     });
  //     describe('requestConnectionPriorityAsync', () => {
  //       it(`works as expected`, async () => {
  //         await Bluetooth.android.requestConnectionPriorityAsync(peripheralUUID, -1);
  //       });
  //     });
  //   });
}
// getStaticInfoFromGATT(this.props);
