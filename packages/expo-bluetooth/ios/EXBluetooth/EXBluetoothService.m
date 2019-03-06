// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetoothService.h>
#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXBluetooth/EXBluetoothCharacteristic.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXBluetooth/EXBluetoothConstants.h>

@interface EXBluetoothService()

@property (nonatomic, strong) CBService *service;

@end

@implementation EXBluetoothService

- (instancetype)initWithService:(CBService *)service peripheral:(EXBluetoothPeripheral *)peripheral
{
  self = [super init];
  if (self) {
    _service = service;
    _peripheral = peripheral;
  }
  return self;
}

- (CBUUID *)UUID
{
  return _service.UUID;
}

- (EXBluetoothPeripheral *)peripheral
{
  return _peripheral;
}

- (BOOL)isPrimary
{
  return _service.isPrimary;
}

- (NSArray<EXBluetoothService *> *)includedServices
{
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (CBService *service in _service.includedServices) {
    [output addObject:[[EXBluetoothService alloc] initWithService:service peripheral:_peripheral]];
  }
  return output;
}

- (NSArray<EXBluetoothCharacteristic *> *)characteristics
{
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (CBCharacteristic *characteristic in _service.characteristics) {
    [output addObject:[[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:_peripheral]];
  }
  return output;
}

- (void)discoverCharacteristics:(NSArray<CBUUID *> *)characteristicUUIDs withDiscoverCharacteristicsCallback:(EXBluetoothPeripheralDiscoverCharacteristics)onDiscoverCharacteristics
{
  if (_peripheral) {
    [_peripheral discoverCharacteristics:characteristicUUIDs forService:self withDiscoverCharacteristicsCallback:[onDiscoverCharacteristics copy]];
  }
}

- (void)discoverIncludedServices:(NSArray<CBUUID *> *)includedServiceUUIDs withDiscoverIncludedServicesCallback:(EXBluetoothPeripheralDiscoverIncludedServices)onDiscoverIncludedServices
{
  if (_peripheral) {
    [_peripheral discoverIncludedServices:includedServiceUUIDs forService:self withDiscoverIncludedServicesCallback:[onDiscoverIncludedServices copy]];
  }
}

- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString
                                characteristicProperties:(CBCharacteristicProperties)characteristicProperties
                                                  reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothCharacteristic *characteristic = [self characteristicFromUUID:UUIDString prop:characteristicProperties];
  
  if (characteristicProperties == CBCharacteristicPropertyNotify && !characteristic) {
    characteristic = [self characteristicFromUUID:UUIDString prop:CBCharacteristicPropertyIndicate];
  }
  //  if (!characteristic) {
  //    characteristic = [self characteristicFromUUID:UUIDString service:service];
  //  }
  if (!characteristic) {
    NSString *errorMessage = [NSString stringWithFormat:@"Could not find characteristic with UUID %@ that contains property %@ on service with UUID %@ on peripheral with UUID %@",
                              UUIDString,
                              [EXBluetooth CBCharacteristicPropertiesNativeToJSON:characteristicProperties],
                              _service.UUID.UUIDString,
                              _service.peripheral.identifier.UUIDString];
    reject(EXBluetoothErrorNoCharacteristic, errorMessage, nil);
  }
  
  return characteristic;
}

- (EXBluetoothCharacteristic *)characteristicFromUUID:(NSString *)UUID prop:(CBCharacteristicProperties)prop
{
  for (CBCharacteristic *characteristic in _service.characteristics) {
    if ((characteristic.properties & prop) != 0x0 && [characteristic.UUID.UUIDString isEqualToString:UUID]) {
      return [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:_peripheral];
    }
  }
  return nil;
}

- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothCharacteristic *characteristic = [self characteristicFromUUID:UUIDString];
  if (!characteristic) {
    NSString *errorMessage = [NSString stringWithFormat:@"Could not find characteristic with UUID %@ on service with UUID %@ on peripheral with UUID %@",
                              UUIDString,
                              _service.UUID.UUIDString,
                              _service.peripheral.identifier.UUIDString];
    reject(EXBluetoothErrorNoCharacteristic, errorMessage, nil);
  }
  return characteristic;
}

- (EXBluetoothCharacteristic *)characteristicFromUUID:(NSString *)UUID
{
  for (CBCharacteristic *characteristic in _service.characteristics) {
    if ([characteristic.UUID.UUIDString isEqualToString:UUID]) {
      return [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:_peripheral];
    }
  }
  return nil;
}

- (NSDictionary *)getJSON
{
  return [EXBluetooth EXBluetoothServiceNativeToJSON:self];
}

@end
