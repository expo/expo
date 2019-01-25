// Copyright 2019-present 650 Industries. All rights reserved.

@class EXBluetoothCentralManager;
@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;
@class EXBluetoothService;
@class EXBluetoothDescriptor;

#ifndef EXBluetoothBlocks_h
#define EXBluetoothBlocks_h

#pragma mark - central

// Central manager did discover Peripheral Block
typedef void (^EXBluetoothCentralDidDiscoverPeripheralBlock)(EXBluetoothCentralManager *centralManager,EXBluetoothPeripheral *peripheral,NSDictionary *advertisementData,NSNumber *RSSI);

// Central did connect peripheral block
typedef void (^EXBluetoothCentralDidConnectPeripheralBlock)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);

// central did disconnect peripheral block
typedef void (^EXBluetoothCentralDidDisconnectPeripheralBlock)(EXBluetoothCentralManager *centralManager,EXBluetoothPeripheral *peripheral,NSError *error);

// central did update state block
typedef void (^EXBluetoothCentralDidUpdateStateBlock)(EXBluetoothCentralManager *centralManager);

// central did fail to connect peripheral block
typedef void (^EXBluetoothCentralDidFailToConnectPeripheralBlock)(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error);

#pragma mark - peripheral

// Discovered Services Block
typedef void (^EXBluetoothPeripheralDiscoverServicesBlock)(EXBluetoothPeripheral *peripheral, NSError *error);

// Discovered Included Services Block
typedef void (^EXBluetoothPeripheralDiscoverIncludedServicesBlock)(EXBluetoothPeripheral *peripheral,EXBluetoothService *service, NSError *error);

// Discovered Characteristics Block
typedef void (^EXBluetoothPeripheralDiscoverCharacteristicsBlock)(EXBluetoothPeripheral *peripheral,EXBluetoothService *service,NSError *error);

// Did Update Name
typedef void (^EXBluetoothPeripheralDidUpdateNameBlock)(EXBluetoothPeripheral *peripheral);

// Read Value For Characteristic Block
typedef void (^EXBluetoothPeripheralReadValueForCharacteristicBlock)(EXBluetoothPeripheral *peripheral,EXBluetoothCharacteristic *characteristic,NSError *error);

// Writed Value For Characteristics Block
typedef void (^EXBluetoothPeripheralWriteValueForCharacteristicsBlock)(EXBluetoothPeripheral *peripheral,EXBluetoothCharacteristic *characteristic,NSError *error);

// Notified Value For Characteristics Block
typedef void (^EXBluetoothPeripheralNotifyValueForCharacteristicsBlock)(EXBluetoothPeripheral *peripheral,EXBluetoothCharacteristic *characteristic,NSError *error);

// Discovered Descriptors For Characteristic Block
typedef void (^EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error);

// Read Value For DescriptorsBlock
typedef void (^EXBluetoothPeripheralReadValueForDescriptorsBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error);

// Writed Value For Descriptors Block
typedef void (^EXBluetoothPeripheralWriteValueForDescriptorsBlock)(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error);

// Red RSSI Block
typedef void (^EXBluetoothPeripheralReadRSSIBlock)(EXBluetoothPeripheral *peripheral, NSNumber *RSSI, NSError *error);

// TODO: Bacon: Services
// TODO: Bacon: Characteristics
// TODO: Bacon: Descriptors

#endif
