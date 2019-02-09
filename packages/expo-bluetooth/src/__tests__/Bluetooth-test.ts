import { mockPlatformIOS, unmockAllProperties, mockPlatformAndroid } from 'jest-expo';

import {
  Characteristics,
  Descriptors,
  JSONToNative,
  nativeToJSON,
  Services,
} from 'expo-bluetooth-utils';
import * as Bluetooth from '../Bluetooth';
import ExpoBluetooth from '../ExpoBluetooth';

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

afterEach(unmockAllProperties);

describe('startScanAsync', () => {
  it(`get's a subscription`, () => {
    const serviceUUIDsToQuery = ['<DEBUG>'];
    const androidScanMode = '<DEBUG_ANDROID_SCAN_MODE>';
    const subscription = Bluetooth.startScan(
      { serviceUUIDsToQuery, androidScanMode },
      peripheral => {}
    );
    expect(ExpoBluetooth.startScanningAsync).toHaveBeenLastCalledWith(serviceUUIDsToQuery, {
      androidScanMode,
    });
    expect(subscription.remove).toBeDefined();
  });
});

describe('stopScanAsync', () => {
  it(`doesn't fail`, async () => {
    await Bluetooth.stopScanAsync();
    expect(ExpoBluetooth.stopScanningAsync).toHaveBeenLastCalledWith();
  });
});

describe('observeUpdates', () => {
  it('works', async () => {
    this.subscription = await Bluetooth.observeUpdates(({ peripherals }) => {
      console.log('BLE Screen: observeUpdatesAsync: ', peripherals);
      // this.setState(({ peripherals: currentPeripherals }) => {
      //     return {
      //         peripherals: {
      //             ...currentPeripherals,
      //             ...peripherals,
      //         },
      //     };
      // });
    });
  });
});

describe('observeStateAsync', () => {
  it(`invokes the callback right away`, () => {
    const callback = jest.fn();
    Bluetooth.observeStateAsync(callback);
    expect(callback).toBeCalled();
  });

  it(`get's the central state`, () => {
    Bluetooth.observeStateAsync(function() {});
    expect(ExpoBluetooth.getCentralAsync).toHaveBeenLastCalledWith();
  });
});

function rejectsInvalidPeripheralUUID(method) {
  it('rejects an invalid peripheral UUID', async () => {
    await expect(method()).rejects.toThrow('expo-bluetooth: Invalid UUID provided');
  });
}

describe('readRSSIAsync', () => {
  rejectsInvalidPeripheralUUID(() => Bluetooth.readRSSIAsync(null as any));

  it('invokes native method', async () => {
    await Bluetooth.readRSSIAsync(peripheralUUID);
    expect(ExpoBluetooth.readRSSIAsync).toHaveBeenLastCalledWith(peripheralUUID);
  });
});

describe('connecting/disconnecting', () => {
  describe('connectAsync', () => {
    rejectsInvalidPeripheralUUID(() => Bluetooth.connectAsync(null as any));

    it('times out', async () => {
      const timeout = 5;
      const callback = jest.fn();
      Bluetooth.connectAsync(peripheralUUID, { onDisconnect: callback, timeout });
      expect(callback).not.toBeCalled();
      await sleep(timeout + 1);
      expect(callback).toBeCalled();
    });
    it('invokes native method', async () => {
      const options = { some: 'v' };
      await Bluetooth.connectAsync(peripheralUUID, { options });
      expect(ExpoBluetooth.connectPeripheralAsync).toHaveBeenLastCalledWith(
        peripheralUUID,
        options
      );
    });
  });

  describe('disconnectAsync', () => {
    rejectsInvalidPeripheralUUID(() => Bluetooth.disconnectAsync(null as any));

    it('invokes native method', async () => {
      await Bluetooth.disconnectAsync(peripheralUUID);
      expect(ExpoBluetooth.disconnectPeripheralAsync).toHaveBeenLastCalledWith(peripheralUUID);
    });
  });
});

describe('reading', () => {
  describe('readCharacteristicAsync', async () => {
    const someReadValue = await Bluetooth.readCharacteristicAsync(
      getGATTNumbersFromID(internalCharacteristicID)
    );
  });

  describe('readDescriptorAsync', async () => {
    const someReadValue = await Bluetooth.readDescriptorAsync(
      getGATTNumbersFromID(internalDescriptorID)
    );
  });
});

describe('writing', () => {
  describe('writeCharacteristicAsync', async () => {
    // properties.includes('write');
    await Bluetooth.writeCharacteristicAsync({
      ...getGATTNumbersFromID(internalCharacteristicID),
      data: JSONToNative('bacon'),
    });
  });

  describe('writeCharacteristicWithoutResponseAsync', async () => {
    await Bluetooth.writeCharacteristicWithoutResponseAsync({
      ...getGATTNumbersFromID(internalCharacteristicID),
      data: JSONToNative('bacon'),
    });
  });

  describe('writeDescriptorAsync', async () => {
    await Bluetooth.writeDescriptorAsync({
      ...getGATTNumbersFromID(internalDescriptorID),
      data: JSONToNative('bacon'),
    });
  });
});

describe('modify notifications', () => {
  describe('shouldNotifyDescriptorAsync', () => {
    //   if (!isNotifying && properties.includes('notify')) {
    //     await Bluetooth.shouldNotifyDescriptorAsync({
    //       ...getGATTNumbersFromID(this.props.id),
    //       shouldNotify: true,
    //     });
    //   }
  });
});

describe('get async', () => {
  describe('getPeripheralsAsync', async () => {
    const arr = await Bluetooth.getPeripheralsAsync();
    expect(Array.isArray(arr)).toBe(true);
    expect(ExpoBluetooth.getPeripheralsAsync).toHaveBeenLastCalledWith();
  });
  describe('getConnectedPeripheralsAsync', async () => {
    const arr = await Bluetooth.getConnectedPeripheralsAsync();
    expect(Array.isArray(arr)).toBe(true);
    expect(ExpoBluetooth.getConnectedPeripheralsAsync).toHaveBeenLastCalledWith();
  });

  describe('getCentralAsync', async () => {
    const central = await Bluetooth.getPeripheralsAsync();
    expect(ExpoBluetooth.getCentralAsync).toHaveBeenLastCalledWith();
  });

  describe('isScanningAsync', async () => {
    const isScanning = await Bluetooth.isScanningAsync();
    expect(typeof isScanning).toBe('boolean');
    expect(ExpoBluetooth.getCentralAsync).toHaveBeenLastCalledWith();
  });
});

const debugPeripheral = { id: peripheralUUID };
const debugService = { id: internalServiceID };
const debugCharacteristic = { id: internalCharacteristicID };

describe('discovery', () => {
  describe('discoverServicesForPeripheralAsync', async () => {
    const {
      peripheral: { services },
    } = await Bluetooth.discoverServicesForPeripheralAsync({ id: debugPeripheral.id });
    expect(Array.isArray(services)).toBe(true);
  });
  describe('discoverIncludedServicesForServiceAsync', async () => {
    const {
      peripheral: { includedServices },
    } = await Bluetooth.discoverIncludedServicesForServiceAsync({ id: debugPeripheral.id });
    expect(Array.isArray(includedServices)).toBe(true);
  });

  describe('discoverCharacteristicsForServiceAsync', async () => {
    const {
      service: { characteristics },
    } = await Bluetooth.discoverCharacteristicsForServiceAsync({ id: debugService.id });
    expect(Array.isArray(characteristics)).toBe(true);
  });

  describe('discoverDescriptorsForCharacteristicAsync', async () => {
    const {
      characteristic: { descriptors },
    } = await Bluetooth.discoverDescriptorsForCharacteristicAsync({ id: debugCharacteristic.id });
    expect(Array.isArray(descriptors)).toBe(true);
  });
});

describe('requestMTUAsync', async () => {
  const debugMTU = 24;
  await Bluetooth.android.requestMTUAsync(peripheralUUID, debugMTU);
});

// describe('getPeripherals', () => {

// });

describe('loadPeripheralAsync', async () => {
  // TODO: Bacon: Test shape
  it('loads', async () => {
    try {
      await Bluetooth.loadPeripheralAsync({
        id: debugPeripheral.id,
      });
    } catch (error) {}
  });

  //       discoveryDate = new Date(discoveryTimestamp).toISOString();
});

describe('Android only', () => {
  beforeEach(mockPlatformAndroid);
  afterEach(unmockAllProperties);
  describe('requestMTUAsync', () => {
    it(`works as expected`, async () => {
      await Bluetooth.android.requestMTUAsync(peripheralUUID, 512);
    });
  });
  describe('createBondAsync', () => {
    it(`works as expected`, async () => {
      await Bluetooth.android.createBondAsync(peripheralUUID);
    });
  });
  describe('removeBondAsync', () => {
    it(`works as expected`, async () => {
      await Bluetooth.android.removeBondAsync(peripheralUUID);
    });
  });
  describe('enableBluetoothAsync', () => {
    it(`works as expected`, async () => {
      await Bluetooth.android.enableBluetoothAsync(true);
    });
  });
  describe('getBondedPeripheralsAsync', () => {
    it(`works as expected`, async () => {
      await Bluetooth.android.getBondedPeripheralsAsync();
    });
  });
  describe('requestConnectionPriorityAsync', () => {
    it(`works as expected`, async () => {
      await Bluetooth.android.requestConnectionPriorityAsync(peripheralUUID, -1);
    });
  });
});

// getStaticInfoFromGATT(this.props);
