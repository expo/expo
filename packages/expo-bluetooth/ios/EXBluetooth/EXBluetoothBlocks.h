// Copyright 2019-present 650 Industries. All rights reserved.

@class EXBluetoothCentralManager;
@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;
@class EXBluetoothService;
@class EXBluetoothDescriptor;

#ifndef EXBluetoothBlocks_h
#define EXBluetoothBlocks_h

#pragma mark - peripheral

typedef void (^EXBluetoothPeripheralDiscoverServices)(EXBluetoothPeripheral *peripheral, NSError *error);
typedef void (^EXBluetoothPeripheralDiscoverIncludedServices)(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error);
typedef void (^EXBluetoothPeripheralDiscoverCharacteristics)(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error);
typedef void (^EXBluetoothPeripheralDidUpdateName)(EXBluetoothPeripheral *peripheral);
typedef void (^EXBluetoothPeripheralReadValueForCharacteristic)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralWriteValueForCharacteristics)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralNotifyValueForCharacteristics)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralDiscoverDescriptorsForCharacteristic)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralReadValueForDescriptors)(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error);
typedef void (^EXBluetoothPeripheralWriteValueForDescriptors)(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error);
typedef void (^EXBluetoothPeripheralReadRSSI)(EXBluetoothPeripheral *peripheral, NSNumber *RSSI, NSError *error);

// TODO: Bacon: Services
// TODO: Bacon: Characteristics
// TODO: Bacon: Descriptors

#pragma mark - central

typedef void (^EXBluetoothCentralDidChangeScanning)(EXBluetoothCentralManager *centralManager, BOOL isScanning);
typedef void (^EXBluetoothCentralDidDiscoverPeripheral)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSDictionary *advertisementData, NSNumber *RSSI);
typedef void (^EXBluetoothCentralDidConnectPeripheral)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);
typedef void (^EXBluetoothCentralDidDisconnectPeripheral)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);
typedef void (^EXBluetoothCentralDidUpdateState)(EXBluetoothCentralManager *centralManager);
typedef void (^EXBluetoothCentralDidFailToConnectPeripheral)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);

#endif
