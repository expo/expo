// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetoothBlocks.h>
#import <EXCore/EXExportedModule.h>

@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;

@interface EXBluetoothService : NSObject

// The parent peripheral
@property (nonatomic, weak) EXBluetoothPeripheral *peripheral;

@property (readonly, nonatomic) BOOL isPrimary;

@property (retain, readonly, nullable) NSArray<EXBluetoothService *> *includedServices;

@property (retain, readonly, nullable) NSArray<EXBluetoothCharacteristic *> *characteristics;

@property (readonly, nonatomic, nullable) CBUUID *UUID;

- (nullable instancetype)initWithService:(nullable CBService *)service
                              peripheral:(nullable EXBluetoothPeripheral *)peripheral;

- (void)discoverIncludedServices:(nullable NSArray<CBUUID *> *)includedServiceUUIDs
                       withDiscoverIncludedServicesCallback:(nullable EXBluetoothPeripheralDiscoverIncludedServices)onDiscoverIncludedServices;

- (void)discoverCharacteristics:(nullable NSArray<CBUUID *> *)characteristicUUIDs
                      withDiscoverCharacteristicsCallback:(nullable EXBluetoothPeripheralDiscoverCharacteristics)onDiscoverCharacteristics;

- (EXBluetoothCharacteristic *)characteristicFromUUID:(NSString *)UUID;
- (EXBluetoothCharacteristic *)characteristicFromUUID:(NSString *)UUID prop:(CBCharacteristicProperties)prop;
- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject;
- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString characteristicProperties:(CBCharacteristicProperties)characteristicProperties reject:(EXPromiseRejectBlock)reject;

- (NSDictionary *)getJSON;

@end
