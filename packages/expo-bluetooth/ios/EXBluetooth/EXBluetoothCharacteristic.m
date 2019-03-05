// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXBluetooth/EXBluetoothCharacteristic.h>
#import <EXBluetooth/EXBluetoothConstants.h>
#import <EXBluetooth/EXBluetoothDescriptor.h>
#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXBluetooth/EXBluetoothService.h>

@interface EXBluetoothCharacteristic()
{
  EXBluetoothService *_service;
}

@property (nonatomic, strong) CBCharacteristic *characteristic;
@property (nonatomic, weak, readwrite) EXBluetoothPeripheral *peripheral;

@end

@implementation EXBluetoothCharacteristic

- (instancetype)initWithCharacteristic:(CBCharacteristic *)characteristic peripheral:(EXBluetoothPeripheral *)peripheral
{
  self = [super init];
  if (self) {
    _characteristic = characteristic;
    _peripheral = peripheral;
  }
  return self;
}

- (CBUUID *)UUID
{
  return _characteristic.UUID;
}

- (EXBluetoothService *)service
{
  if (!_service) {
    _service = [[EXBluetoothService alloc] initWithService:_characteristic.service peripheral:_peripheral];
  };
  return _service;
}

- (CBCharacteristicProperties)properties
{
  return _characteristic.properties;
}

- (NSData *)value
{
  return _characteristic.value;
}

- (NSArray<EXBluetoothDescriptor *> *)descriptors
{
  return nil;
}

- (BOOL)isNotifying
{
  return _characteristic.isNotifying;
}

- (void)readValueWithBlock:(EXBluetoothPeripheralReadValueForCharacteristicBlock)block
{
  if (_peripheral) {
    [_peripheral readValueForCharacteristic:self withBlock:[block copy]];
  }
}

- (void)writeValue:(NSData *)data
              type:(CBCharacteristicWriteType)type
         withBlock:(EXBluetoothPeripheralWriteValueForCharacteristicsBlock)block
{
  if (_peripheral) {
    [_peripheral writeValue:data
          forCharacteristic:self
                       type:type
                  withBlock:[block copy]];
  }
}

- (void)setNotifyValue:(BOOL)enabled
             withBlock:(EXBluetoothPeripheralNotifyValueForCharacteristicsBlock)block
{
  if (_peripheral) {
    [_peripheral setNotifyValue:enabled
              forCharacteristic:self
                      withBlock:[block copy]];
  }
}

- (void)discoverDescriptorsWithBlock:(EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock)block
{
  if (_peripheral) {
    [_peripheral discoverDescriptorsForCharacteristic:self withBlock:[block copy]];
  }
}

- (EXBluetoothDescriptor *)getDescriptorOrReject:(NSString *)UUIDString
                                          reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothDescriptor *descriptor = [self descriptorFromUUID:UUIDString];
  if (!descriptor) {
    NSString *errorMessage = [NSString stringWithFormat:@"Could not find descriptor with UUID %@ on characteristic with UUID %@ on service with UUID %@ on peripheral with UUID %@",
                              UUIDString,
                              _characteristic.UUID.UUIDString,
                              _characteristic.service.UUID.UUIDString,
                              _characteristic.service.peripheral.identifier.UUIDString];
    
    reject(EXBluetoothErrorNoDescriptor, errorMessage, nil);
  }
  return descriptor;
}

- (EXBluetoothDescriptor *)descriptorFromUUID:(NSString *)UUID
{
  for (CBDescriptor *descriptor in _characteristic.descriptors) {
    if ([descriptor.UUID.UUIDString isEqualToString:UUID]) {
      return [[EXBluetoothDescriptor alloc] initWithDescriptor:descriptor peripheral:_peripheral];
    }
  }
  return nil;
}

- (NSDictionary *)getJSON
{
  return [EXBluetooth.class EXBluetoothCharacteristic_NativeToJSON:self];
}

@end
