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

- (void)readValueWithReadValueForCharacteristicCallback:(EXBluetoothPeripheralReadValueForCharacteristic)onReadValueForCharacteristic
{
  if (_peripheral) {
    [_peripheral readValueForCharacteristic:self withReadValueForCharacteristicCallback:[onReadValueForCharacteristic copy]];
  }
}

- (void)writeValue:(NSData *)data type:(CBCharacteristicWriteType)type withWriteValueForCharacteristicsCallback:(EXBluetoothPeripheralWriteValueForCharacteristics)onWriteValueForCharacteristics
{
  if (_peripheral) {
    [_peripheral writeValue:data forCharacteristic:self type:type withWriteValueForCharacteristicsCallback:[onWriteValueForCharacteristics copy]];
  }
}

- (void)setNotifyValue:(BOOL)enabled withNotifyValueForCharacteristicsCallback:(EXBluetoothPeripheralNotifyValueForCharacteristics)onNotifyValueForCharacteristics
{
  if (_peripheral) {
    [_peripheral setNotifyValue:enabled forCharacteristic:self withNotifyValueForCharacteristicsCallback:[onNotifyValueForCharacteristics copy]];
  }
}

- (void)discoverDescriptorsWithDiscoverDescriptorsForCharacteristicCallback:(EXBluetoothPeripheralDiscoverDescriptorsForCharacteristic)onDiscoverDescriptorsForCharacteristic
{
  if (_peripheral) {
    [_peripheral discoverDescriptorsForCharacteristic:self withDiscoverDescriptorsForCharacteristicCallback:[onDiscoverDescriptorsForCharacteristic copy]];
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
  return [EXBluetooth EXBluetoothCharacteristicNativeToJSON:self];
}

@end
