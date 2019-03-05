// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXBluetooth/EXBluetoothService.h>
#import <EXBluetooth/EXBluetoothCharacteristic.h>
#import <EXBluetooth/EXBluetoothDescriptor.h>
#import <EXBluetooth/EXBluetoothCentralManager.h>


static id EXNullIfEmpty(NSString *input) {
  if (!input || input == nil || [input isEqualToString:@""]) {
    return NSNull.null;
  }
  return input;
}

@interface EXBluetooth (JSON)

+ (NSDictionary *)ScanningOptionsJSONToNative:(nullable NSDictionary *)input;

+ (nullable NSDictionary *)EXBluetoothPeripheralNativeToJSON:(EXBluetoothPeripheral *)input;

+ (nullable NSDictionary *)EXBluetoothCentralManagerNativeToJSON:(EXBluetoothCentralManager *)input;

+ (nullable NSDictionary *)EXBluetoothServiceNativeToJSON:(EXBluetoothService *)input;

+ (nullable NSDictionary *)EXBluetoothCharacteristicNativeToJSON:(EXBluetoothCharacteristic *)input;

+ (nullable NSDictionary *)EXBluetoothDescriptorNativeToJSON:(EXBluetoothDescriptor *)input;

+ (nullable NSMutableArray *)EXBluetoothPeripheralListNativeToJSON:(NSArray<EXBluetoothPeripheral *> *)input;

+ (nullable NSDictionary *)NSErrorNativeToJSON:(NSError *)input;

+ (nullable NSDictionary *)advertisementDataNativeToJSON:(NSDictionary<NSString *,id> *)input;

+ (nullable NSMutableArray<CBUUID *> *)CBUUIDListJSONToNative:(NSArray *)input;

+ (CBCharacteristicProperties)CBCharacteristicPropertiesListJSONToNative:(NSString *)input;

+ (CBCharacteristicProperties)CBCharacteristicPropertiesJSONToNative:(NSString *)input;

+ (nullable NSMutableArray<NSString *> *)CBCharacteristicPropertiesNativeToJSON:(CBCharacteristicProperties)input;

+ (NSString *)CBPeripheralStateNativeToJSON:(CBPeripheralState)input;

+ (NSString *)CBManagerStateNativeToJSON:(CBManagerState)input;

+ (nullable NSDictionary *)CBL2CAPChannelNativeToJSON:(CBL2CAPChannel *)input
API_AVAILABLE(ios(11.0));

@end
