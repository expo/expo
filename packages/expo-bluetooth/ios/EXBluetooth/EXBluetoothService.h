// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetoothBlocks.h>
#import <EXCore/EXExportedModule.h>

@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;

@interface EXBluetoothService : NSObject

// The Bluetooth UUID of the service.
@property(readonly, nonatomic, nullable) CBUUID *UUID;
// A back-pointer to the peripheral this service belongs to.
@property(nonatomic, assign, readonly, nullable) EXBluetoothPeripheral *peripheral;
// The type of the service (primary or secondary).
@property(readonly, nonatomic) BOOL isPrimary;
// A list of included CBServices that have so far been discovered in this service.
@property(retain, readonly, nullable) NSArray<EXBluetoothService *> *includedServices;
// A list of CBCharacteristics that have so far been discovered in this service.
@property(retain, readonly, nullable) NSArray<EXBluetoothCharacteristic *> *characteristics;

- (nullable instancetype)init NS_UNAVAILABLE;
- (nullable instancetype)initWithService:(nullable CBService *)service peripheral:(nullable EXBluetoothPeripheral *)peripheral;

- (void)discoverIncludedServices:(nullable NSArray<CBUUID *> *)includedServiceUUIDs
                       withBlock:(nullable EXBluetoothPeripheralDiscoverIncludedServicesBlock)block;

- (void)discoverCharacteristics:(nullable NSArray<CBUUID *> *)characteristicUUIDs
                      withBlock:(nullable EXBluetoothPeripheralDiscoverCharacteristicsBlock)block;

- (EXBluetoothCharacteristic *)characteristicFromUUID:(CBUUID *)UUID;
- (EXBluetoothCharacteristic *)characteristicFromUUID:(CBUUID *)UUID prop:(CBCharacteristicProperties)prop;
- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject;
- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString characteristicProperties:(CBCharacteristicProperties)characteristicProperties reject:(EXPromiseRejectBlock)reject;

- (NSDictionary *)getJSON;

@end
