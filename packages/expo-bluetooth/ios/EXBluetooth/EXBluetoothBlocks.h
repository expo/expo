// Copyright 2019-present 650 Industries. All rights reserved.

@class EXBluetoothCentralManager;
@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;
@class EXBluetoothService;
@class EXBluetoothDescriptor;

#ifndef EXBluetoothBlocks_h
#define EXBluetoothBlocks_h

#pragma mark - peripheral

typedef void (^EXBluetoothPeripheralDiscoverServicesBlock)(EXBluetoothPeripheral *peripheral, NSError *error);
typedef void (^EXBluetoothPeripheralDiscoverIncludedServicesBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error);
typedef void (^EXBluetoothPeripheralDiscoverCharacteristicsBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error);
typedef void (^EXBluetoothPeripheralDidUpdateNameBlock)(EXBluetoothPeripheral *peripheral);
typedef void (^EXBluetoothPeripheralReadValueForCharacteristicBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralWriteValueForCharacteristicsBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralNotifyValueForCharacteristicsBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);
typedef void (^EXBluetoothPeripheralReadValueForDescriptorsBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error);
typedef void (^EXBluetoothPeripheralWriteValueForDescriptorsBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error);
typedef void (^EXBluetoothPeripheralReadRSSIBlock)(EXBluetoothPeripheral *peripheral, NSNumber *RSSI, NSError *error);

// TODO: Bacon: Services
// TODO: Bacon: Characteristics
// TODO: Bacon: Descriptors

#pragma mark - central

typedef void (^EXBluetoothCentralDidDiscoverPeripheralBlock)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSDictionary *advertisementData,NSNumber *RSSI);
typedef void (^EXBluetoothCentralDidConnectPeripheralBlock)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);
typedef void (^EXBluetoothCentralDidDisconnectPeripheralBlock)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);
typedef void (^EXBluetoothCentralDidUpdateStateBlock)(EXBluetoothCentralManager *centralManager);
typedef void (^EXBluetoothCentralDidFailToConnectPeripheralBlock)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);

#endif
