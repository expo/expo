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
    return [NSNull null];
  }
  return input;
}

@interface EXBluetooth (JSON)

+ (NSDictionary *)EXBluetoothPeripheral_NativeToJSON:(EXBluetoothPeripheral *)input;

+ (NSDictionary *)EXBluetoothCentralManager_NativeToJSON:(EXBluetoothCentralManager *)input;

+ (NSDictionary *)EXBluetoothService_NativeToJSON:(EXBluetoothService *)input;

+ (NSDictionary *)EXBluetoothCharacteristic_NativeToJSON:(EXBluetoothCharacteristic *)input;

+ (NSDictionary *)EXBluetoothDescriptor_NativeToJSON:(EXBluetoothDescriptor *)input;

+ (NSMutableArray *)EXBluetoothPeripheralList_NativeToJSON:(NSArray<EXBluetoothPeripheral *> *)input;

+ (NSDictionary *)NSError_NativeToJSON:(NSError *)input;

+ (NSDictionary *)advertisementData_NativeToJSON:(NSDictionary<NSString *,id> *)input;

+ (NSMutableArray<CBUUID *> *)CBUUIDList_JSONToNative:(NSArray *)input;

+ (CBCharacteristicProperties)CBCharacteristicPropertiesList_JSONToNative:(NSString *)input;

+ (CBCharacteristicProperties)CBCharacteristicProperties_JSONToNative:(NSString *)input;

+ (NSMutableArray<NSString *> *)CBCharacteristicProperties_NativeToJSON:(CBCharacteristicProperties)input;

+ (NSString *)CBPeripheralState_NativeToJSON:(CBPeripheralState)input;

+ (NSString *)CBManagerState_NativeToJSON:(CBManagerState)input;

+ (NSDictionary *)CBL2CAPChannel_NativeToJSON:(CBL2CAPChannel *)input
API_AVAILABLE(ios(11.0));

@end
