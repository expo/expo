// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetoothService.h>
#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXBluetooth/EXBluetoothCharacteristic.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXBluetooth/EXBluetoothConstants.h>

@interface EXBluetoothService()

@property (nonatomic, strong) CBService *service;
@property (nonatomic, weak) EXBluetoothPeripheral *peipheral;

@end

@implementation EXBluetoothService

-(instancetype)initWithService:(CBService *)service peripheral:(EXBluetoothPeripheral *)peripheral
{
  self = [super init];
  if (self) {
    _service = service;
    _peipheral = peripheral;
  }
  return self;
}

- (CBUUID *)UUID
{
  return _service.UUID;
}

- (EXBluetoothPeripheral *)peripheral
{
  return _peipheral;
}

- (BOOL)isPrimary
{
  return _service.isPrimary;
}

- (NSArray<EXBluetoothService *> *)includedServices
{
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (CBService *service in _service.includedServices) {
    [output addObject:[[EXBluetoothService alloc] initWithService:service peripheral:_peipheral]];
  }
  return output;
}

- (NSArray<EXBluetoothCharacteristic *> *)characteristics
{
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (CBCharacteristic *characteristic in _service.characteristics) {
    [output addObject:[[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:_peipheral]];
  }
  return output;
}

- (void)discoverCharacteristics:(NSArray<CBUUID *> *)characteristicUUIDs withBlock:(EXBluetoothPeripheralDiscoverCharacteristicsBlock)block
{
  if (_peipheral) {
    [_peipheral discoverCharacteristics:characteristicUUIDs forService:self withBlock:[block copy]];
  }
}

- (void)discoverIncludedServices:(NSArray<CBUUID *> *)includedServiceUUIDs withBlock:(EXBluetoothPeripheralDiscoverIncludedServicesBlock)block
{
  if (_peipheral) {
    [_peipheral discoverIncludedServices:includedServiceUUIDs forService:self withBlock:[block copy]];
  }
}

- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString characteristicProperties:(CBCharacteristicProperties)characteristicProperties reject:(EXPromiseRejectBlock)reject
{
  CBUUID *characteristicUUID = [CBUUID UUIDWithString:UUIDString];
  
  EXBluetoothCharacteristic *characteristic = [self characteristicFromUUID:characteristicUUID prop:characteristicProperties];
  
  if (characteristicProperties == CBCharacteristicPropertyNotify && !characteristic) {
    characteristic = [self characteristicFromUUID:characteristicUUID prop:CBCharacteristicPropertyIndicate];
  }
  //  if (!characteristic) {
  //    characteristic = [self characteristicFromUUID:characteristicUUID service:service];
  //  }
  if (!characteristic) {
    NSString *errorMessage = [NSString stringWithFormat:@"Could not find characteristic with UUID %@ that contains property %@ on service with UUID %@ on peripheral with UUID %@",
                              UUIDString,
                              [[EXBluetooth class] CBCharacteristicProperties_NativeToJSON:characteristicProperties],
                              _service.UUID.UUIDString,
                              _service.peripheral.identifier.UUIDString];
    reject(EXBluetoothErrorNoCharacteristic, errorMessage, nil);
  }
  
  return characteristic;
}

- (EXBluetoothCharacteristic *)characteristicFromUUID:(CBUUID *)UUID prop:(CBCharacteristicProperties)prop
{
  NSString *uuidString = UUID.UUIDString;
  for (CBCharacteristic *characteristic in _service.characteristics) {
    if ((characteristic.properties & prop) != 0x0 && [characteristic.UUID.UUIDString isEqualToString:uuidString]) {
      return [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:_peipheral];
    }
  }
  return nil;
}

- (EXBluetoothCharacteristic *)getCharacteristicOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject
{
  CBUUID *characteristicUUID = [CBUUID UUIDWithString:UUIDString];
  EXBluetoothCharacteristic *characteristic = [self characteristicFromUUID:characteristicUUID];
  if (!characteristic) {
    NSString *errorMessage = [NSString stringWithFormat:@"Could not find characteristic with UUID %@ on service with UUID %@ on peripheral with UUID %@",
                              UUIDString,
                              _service.UUID.UUIDString,
                              _service.peripheral.identifier.UUIDString];
    reject(EXBluetoothErrorNoCharacteristic, errorMessage, nil);
  }
  return characteristic;
}

- (EXBluetoothCharacteristic *)characteristicFromUUID:(CBUUID *)UUID
{
  NSString *uuidString = UUID.UUIDString;
  
  for (CBCharacteristic *characteristic in _service.characteristics) {
    if ([characteristic.UUID.UUIDString isEqualToString:uuidString]) {
      return [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:_peipheral];
    }
  }
  return nil;
}

- (NSDictionary *)getJSON
{
  return [[EXBluetooth class] EXBluetoothService_NativeToJSON:self];
}

@end
