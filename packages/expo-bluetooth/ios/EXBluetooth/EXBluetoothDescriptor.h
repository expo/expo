// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetoothBlocks.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXBluetooth/EXBluetoothConstants.h>

@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;

/**
 * Mimic from `CBDescriptor`
 */
@interface EXBluetoothDescriptor : NSObject

@property (readonly, nonatomic, nullable) CBUUID *UUID;
@property (nonatomic, assign, readonly, nullable) EXBluetoothCharacteristic *characteristic;

// The value of the descriptor. The corresponding value types for the various descriptors are detailed in CBUUID.h.
@property (retain, readonly, nullable) id value;

- (nullable instancetype)initWithDescriptor:(nullable CBDescriptor *)descriptor peripheral:(nullable EXBluetoothPeripheral *)peripheral;

- (void)readValueForWithBlock:(nullable EXBluetoothPeripheralReadValueForDescriptorsBlock)block;
- (void)writeValue:(nullable NSData *)data withBlock:(nullable EXBluetoothPeripheralWriteValueForDescriptorsBlock)block;

- (NSDictionary *)getJSON;

@end
