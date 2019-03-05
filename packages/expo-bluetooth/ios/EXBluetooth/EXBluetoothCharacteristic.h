// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXExportedModule.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXBluetooth/EXBluetoothBlocks.h>

/**
 * Mimic from `CBCharacteristic`
 */
@interface EXBluetoothCharacteristic : NSObject

@property(readonly, nonatomic, nullable) CBUUID *UUID;

@property(assign, readonly, nonatomic, nullable) EXBluetoothService *service;

@property(readonly, nonatomic) CBCharacteristicProperties properties;

@property(retain, readonly, nullable) NSData *value;
// A list of the CBDescriptors that have so far (!!) been discovered in this characteristic.
@property(retain, readonly, nullable) NSArray<EXBluetoothDescriptor *> *descriptors;
// Whether the characteristic is currently notifying or not.
@property(readonly) BOOL isNotifying;

- (nullable instancetype)initWithCharacteristic:(nullable CBCharacteristic *)characteristic
                                     peripheral:(nullable EXBluetoothPeripheral *)peripheral;

- (void)readValueWithBlock:(nullable EXBluetoothPeripheralReadValueForCharacteristicBlock)block;

- (void)writeValue:(nullable NSData *)data
              type:(CBCharacteristicWriteType)type
         withBlock:(nullable EXBluetoothPeripheralWriteValueForCharacteristicsBlock)block;

- (void)setNotifyValue:(BOOL)enabled
             withBlock:(nullable EXBluetoothPeripheralNotifyValueForCharacteristicsBlock)block;

- (void)discoverDescriptorsWithBlock:(nullable EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock)block;

- (EXBluetoothDescriptor *)getDescriptorOrReject:(NSString *)UUIDString
                                          reject:(EXPromiseRejectBlock)reject;

- (EXBluetoothDescriptor *)descriptorFromUUID:(NSString *)UUID;

- (NSDictionary *)getJSON;

@end
