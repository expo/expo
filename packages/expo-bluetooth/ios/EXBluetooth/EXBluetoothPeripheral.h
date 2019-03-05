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

- (void)readRSSI:(nullable EXBluetoothPeripheralReadRSSIBlock)block;

- (void)discoverServices:(nullable NSArray<CBUUID *> *)serviceUUIDs withBlock:(nullable EXBluetoothPeripheralDiscoverServicesBlock)block;

- (void)discoverIncludedServices:(nullable NSArray<CBUUID *> *)includedServiceUUIDs
                      forService:(nullable EXBluetoothService *)service
                       withBlock:(nullable EXBluetoothPeripheralDiscoverIncludedServicesBlock)block;

- (void)discoverCharacteristics:(nullable NSArray<CBUUID *> *)characteristicUUIDs
                     forService:(nullable EXBluetoothService *)service
                      withBlock:(nullable EXBluetoothPeripheralDiscoverCharacteristicsBlock)block;

- (void)readValueForCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic withBlock:(nullable EXBluetoothPeripheralReadValueForCharacteristicBlock)block;

- (void)writeValue:(nullable NSData *)data
 forCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic
              type:(CBCharacteristicWriteType)type
         withBlock:(nullable EXBluetoothPeripheralWriteValueForCharacteristicsBlock)block;

- (void)setNotifyValue:(BOOL)enabled
     forCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic
             withBlock:(nullable EXBluetoothPeripheralNotifyValueForCharacteristicsBlock)block;

- (void)discoverDescriptorsForCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic
                                   withBlock:(nullable EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock)block;

- (void)readValueForDescriptor:(nullable EXBluetoothDescriptor *)descriptor withBlock:(nullable EXBluetoothPeripheralReadValueForDescriptorsBlock)block;

- (void)writeValue:(nullable NSData *)data
     forDescriptor:(nullable EXBluetoothDescriptor *)descriptor
         withBlock:(nullable EXBluetoothPeripheralWriteValueForDescriptorsBlock)block;

- (NSDictionary *)getJSON;

- (BOOL)guardIsConnected:(EXPromiseRejectBlock)reject;

- (EXBluetoothService *)getServiceOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject;

@end
