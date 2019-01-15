// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth.h>
#import <CoreBluetooth/CoreBluetooth.h>

static id EXNullIfEmpty(NSString *input) {
  if (!input || input == nil || [input isEqualToString:@""]) {
    return [NSNull null];
  }
  return input;
}

@interface EXBluetooth (JSON)

+ (NSDictionary *)CBPeripheral_NativeToJSON:(CBPeripheral *)input;

+ (NSDictionary *)CBCentralManager_NativeToJSON:(CBCentralManager *)input;

+ (NSDictionary *)CBService_NativeToJSON:(CBService *)input;

+ (NSDictionary *)CBCharacteristic_NativeToJSON:(CBCharacteristic *)input;

+ (NSDictionary *)CBDescriptor_NativeToJSON:(CBDescriptor *)input;

+ (NSMutableArray *)CBPeripheralList_NativeToJSON:(NSArray<CBPeripheral *> *)input;

+ (NSDictionary *)NSError_NativeToJSON:(NSError *)input;

+ (NSDictionary *)advertisementData_NativeToJSON:(NSDictionary<NSString *,id> *)input;

+ (NSMutableArray<CBUUID *> *)CBUUIDList_JSONToNative:(NSArray *)input;

+ (CBCharacteristicProperties)CBCharacteristicProperties_JSONToNative:(NSString *)input;

@end
