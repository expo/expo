// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetoothBlocks.h>
#import <EXCore/EXExportedModule.h>

@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;
@class EXBluetoothDescriptor;
@class EXBluetoothService;

/**
 * Mimic from `CBPeripheral`
 */
@interface EXBluetoothPeripheral : NSObject

@property (weak, nonatomic, nullable) id<CBPeripheralDelegate> delegate;

@property (readonly, nonatomic, nullable) NSUUID *identifier;

@property (retain, readonly, nullable) NSString *name;

@property (nonatomic, readwrite, strong) CBPeripheral *peripheral;

@property (readonly) BOOL canSendWriteWithoutResponse;

@property (readonly) CBPeripheralState state;

@property (retain, readonly, nullable) NSArray<EXBluetoothService *> *services;

@property (retain, readwrite, nullable) NSNumber *RSSI;

@property (retain, readwrite, nullable) NSDictionary<NSString *, id> *advertisementData;

- (nullable instancetype)initWithPeripheral:(nullable CBPeripheral *)peripheral;

- (void)readRSSI:(EXBluetoothPeripheralReadRSSI)onReadRSSI;

- (void)discoverServices:(NSArray<CBUUID *> *)serviceUUIDs withDiscoverServicesCallback:(EXBluetoothPeripheralDiscoverServices)onDiscoverServices;

- (void)discoverIncludedServices:(NSArray<CBUUID *> *)includedServiceUUIDs
                      forService:(EXBluetoothService *)service withDiscoverIncludedServicesCallback:(EXBluetoothPeripheralDiscoverIncludedServices)onDiscoverIncludedServices;

- (void)discoverCharacteristics:(NSArray<CBUUID *> *)characteristicUUIDs
                     forService:(EXBluetoothService *)service withDiscoverCharacteristicsCallback:(EXBluetoothPeripheralDiscoverCharacteristics)onDiscoverCharacteristics;

- (void)readValueForCharacteristic:(EXBluetoothCharacteristic *)characteristic
withReadValueForCharacteristicCallback:(EXBluetoothPeripheralReadValueForCharacteristic)onReadValueForCharacteristic;

- (void)writeValue:(NSData *)data
 forCharacteristic:(EXBluetoothCharacteristic *)characteristic
              type:(CBCharacteristicWriteType)type
  withWriteValueForCharacteristicsCallback:(EXBluetoothPeripheralWriteValueForCharacteristics)onWriteValueForCharacteristics;

- (void)setNotifyValue:(BOOL)enabled forCharacteristic:(EXBluetoothCharacteristic *)characteristic withNotifyValueForCharacteristicsCallback:(EXBluetoothPeripheralNotifyValueForCharacteristics)onNotifyValueForCharacteristics;

-(void)discoverDescriptorsForCharacteristic:(EXBluetoothCharacteristic *)characteristic withDiscoverDescriptorsForCharacteristicCallback:(EXBluetoothPeripheralDiscoverDescriptorsForCharacteristic)onDiscoverDescriptorsForCharacteristic;


- (void)readValueForDescriptor:(EXBluetoothDescriptor *)descriptor withReadValueForDescriptors:(EXBluetoothPeripheralReadValueForDescriptors)onReadValueForDescriptors;

- (void)writeValue:(NSData *)data forDescriptor:(EXBluetoothDescriptor *)descriptor withWriteValueForDescriptorsCallback:(EXBluetoothPeripheralWriteValueForDescriptors)onWriteValueForDescriptors;

- (NSDictionary *)getJSON;

- (BOOL)guardIsConnected:(EXPromiseRejectBlock)reject;

- (EXBluetoothService *)getServiceOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject;

@end
