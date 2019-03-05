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

+ (NSDictionary *)ScanningOptionsJSONToNative:(NSDictionary *)input;

+ (NSDictionary *)EXBluetoothPeripheralNativeToJSON:(EXBluetoothPeripheral *)input;

+ (NSDictionary *)EXBluetoothCentralManagerNativeToJSON:(EXBluetoothCentralManager *)input;

+ (NSDictionary *)EXBluetoothServiceNativeToJSON:(EXBluetoothService *)input;

+ (NSDictionary *)EXBluetoothCharacteristicNativeToJSON:(EXBluetoothCharacteristic *)input;

+ (NSDictionary *)EXBluetoothDescriptorNativeToJSON:(EXBluetoothDescriptor *)input;

+ (NSMutableArray *)EXBluetoothPeripheralListNativeToJSON:(NSArray<EXBluetoothPeripheral *> *)input;

+ (NSDictionary *)NSErrorNativeToJSON:(NSError *)input;

+ (NSDictionary *)advertisementDataNativeToJSON:(NSDictionary<NSString *,id> *)input;

+ (NSMutableArray<CBUUID *> *)CBUUIDListJSONToNative:(NSArray *)input;

+ (CBCharacteristicProperties)CBCharacteristicPropertiesListJSONToNative:(NSString *)input;

+ (CBCharacteristicProperties)CBCharacteristicPropertiesJSONToNative:(NSString *)input;

+ (NSMutableArray<NSString *> *)CBCharacteristicPropertiesNativeToJSON:(CBCharacteristicProperties)input;

+ (NSString *)CBPeripheralStateNativeToJSON:(CBPeripheralState)input;

+ (NSString *)CBManagerStateNativeToJSON:(CBManagerState)input;

+ (NSDictionary *)CBL2CAPChannelNativeToJSON:(CBL2CAPChannel *)input
API_AVAILABLE(ios(11.0));

@end
