// Copyright 2019-present 650 Industries. All rights reserved.

#ifndef EXBluetoothConstants_h
#define EXBluetoothConstants_h

static NSString *const EXBluetoothErrorUnimplemented = @"ERR_UNIMPLEMENTED";
static NSString *const EXBluetoothErrorNoPeripheral = @"ERR_NO_PERIPHERAL";
static NSString *const EXBluetoothErrorNoService = @"ERR_NO_SERVICE";
static NSString *const EXBluetoothErrorNoCharacteristic = @"ERR_NO_CHARACTERISTIC";
static NSString *const EXBluetoothErrorNoDescriptor = @"ERR_NO_DESCRIPTOR";
static NSString *const EXBluetoothErrorWrite = @"ERR_WRITE";
static NSString *const EXBluetoothErrorRead = @"ERR_READ";
static NSString *const EXBluetoothErrorInvalidBase64 = @"ERR_INVALID_BASE64";
static NSString *const EXBluetoothErrorState = @"ERR_STATE";
static NSString *const EXBluetoothErrorScanning = @"ERR_SCANNING";

static NSString *const EXBluetoothEvent = @"bluetoothEvent";
static NSString *const EXBluetoothDisconnectEvent = @"bluetoothDisconnect";
static NSString *const EXBluetoothDidFailToConnectEvent = @"bluetoothDidFailToConnect";

static NSString *const EXBluetoothCentralDidUpdateStateEvent = @"bluetoothCentralDidUpdateState";
static NSString *const EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent = @"central.didRetrieveConnectedPeripherals";
static NSString *const EXBluetoothCentralDidRetrievePeripheralsEvent = @"central.didRetrievePeripherals";
static NSString *const EXBluetoothCentralDidDiscoverPeripheralEvent = @"central.didDiscoverPeripheral";
static NSString *const EXBluetoothCentralDidConnectPeripheralEvent = @"central.didConnectPeripheral";
static NSString *const EXBluetoothCentralDidDisconnectPeripheralEvent = @"central.didDisconnectPeripheral";
static NSString *const EXBluetoothPeripheralDidDiscoverServicesEvent = @"peripheral.didDiscoverServices";
static NSString *const EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent = @"peripheral.didDiscoverCharacteristicsForService";
static NSString *const EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent = @"peripheral.didDiscoverDescriptorsForCharacteristic";
static NSString *const EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent = @"peripheral.didUpdateValueForCharacteristic";
static NSString *const EXBluetoothPeripheralDidWriteValueForCharacteristicEvent = @"peripheral.didWriteValueForCharacteristic";
static NSString *const EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent = @"peripheral.didUpdateNotificationStateForCharacteristic";
static NSString *const EXBluetoothPeripheralDidUpdateValueForDescriptorEvent = @"peripheral.didUpdateValueForDescriptor";
static NSString *const EXBluetoothPeripheralDidWriteValueForDescriptorEvent = @"peripheral.didWriteValueForDescriptor";
static NSString *const EXBluetoothPeripheralDidReadRSSIEvent = @"peripheral.didReadRSSI";

static NSString *const EXBluetoothCentralKey = @"central";
static NSString *const EXBluetoothPeripheralKey = @"peripheral";
static NSString *const EXBluetoothDescriptorKey = @"descriptor";
static NSString *const EXBluetoothServiceKey = @"service";
static NSString *const EXBluetoothCharacteristicKey = @"characteristic";
static NSString *const EXBluetoothRSSIKey = @"RSSI";
static NSString *const EXBluetoothAdvertisementDataKey = @"advertisementData";
static NSString *const EXBluetoothServiceUUIDsKey = @"serviceUUIDs";
static NSString *const EXBluetoothPeripheralsKey = @"peripherals";

static NSString *const EXBluetoothPeripheralUUID = @"peripheralUUID";
static NSString *const EXBluetoothServiceUUID = @"serviceUUID";
static NSString *const EXBluetoothCharacteristicUUID = @"characteristicUUID";

static NSString *const EXBluetoothDescriptorUUID = @"descriptorUUID";

static NSString *const EXBluetoothEventKey = @"event";
static NSString *const EXBluetoothDataKey = @"data";
static NSString *const EXBluetoothErrorKey = @"error";
static NSString *const EXBluetoothTransactionIdKey = @"transactionId";


#endif /* EXBluetoothConstants_h */
