// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXBluetooth/EXBluetoothCharacteristic.h>
#import <EXBluetooth/EXBluetoothService.h>
#import <EXBluetooth/EXBluetoothDescriptor.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXBluetooth/EXBluetoothConstants.h>

#define EXBluetoothPeripheralIsSelf(peripheral) [_peripheral.identifier.UUIDString isEqualToString:peripheral.identifier.UUIDString]

@interface EXBluetoothCharacteristic()
@property (nonatomic, strong) CBCharacteristic *characteristic;
@end

@interface EXBluetoothService()
@property (nonatomic, strong) CBService *service;
@end

@interface EXBluetoothDescriptor()
@property (nonatomic, strong) CBDescriptor *descriptor;
@end

@interface EXBluetoothPeripheral() <CBPeripheralDelegate>
{
  EXBluetoothPeripheralDidUpdateNameBlock _didUpdateNameBlock;
  EXBluetoothPeripheralReadRSSIBlock _readRSSIBlock;
  EXBluetoothPeripheralDiscoverServicesBlock _discoverServicesBlock;
  
  // Discovery
  NSMutableDictionary *_discoverCharacteristicsBlocks;
  NSMutableDictionary *_discoverIncludedServicesBlocks;
  NSMutableDictionary *_discoverDescriptorsForCharacteristicBlocks;

  // Ops
  NSMutableDictionary *_readValueForCharacteristicsBlocks;
  NSMutableDictionary *_writeValueForCharacteristicsBlocks;
  NSMutableDictionary *_notifyValueForCharacteristics;
  NSMutableDictionary *_readValueForDescriptorsBlock;
  NSMutableDictionary *_writeValueForDescriptorsBlock;
}

@end

@implementation EXBluetoothPeripheral

- (instancetype)initWithPeripheral:(CBPeripheral *)peripheral
{
  NSAssert(peripheral, @"EXBluetoothPeripheral cannot init with a nullable peripheral");
  self = [super init];
  if (self) {
    _peripheral = peripheral;
    _peripheral.delegate = self;
    
    // Discovery
    _discoverCharacteristicsBlocks = [[NSMutableDictionary alloc] init];
    _discoverIncludedServicesBlocks = [[NSMutableDictionary alloc] init];
    _discoverDescriptorsForCharacteristicBlocks = [[NSMutableDictionary alloc] init];
    // Ops
    _readValueForCharacteristicsBlocks = [[NSMutableDictionary alloc] init];
    _writeValueForCharacteristicsBlocks = [[NSMutableDictionary alloc] init];
    _notifyValueForCharacteristics = [[NSMutableDictionary alloc] init];
    _readValueForDescriptorsBlock = [[NSMutableDictionary alloc] init];
    _writeValueForDescriptorsBlock = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)setDelegate:(id<CBPeripheralDelegate>)delegate
{
  _peripheral.delegate = delegate;
}

- (void)setPeripheral:(CBPeripheral *)peripheral
{
  _peripheral = peripheral;
  _peripheral.delegate = self;
}

- (BOOL)canSendWriteWithoutResponse
{
  return _peripheral.canSendWriteWithoutResponse;
}

- (id<CBPeripheralDelegate>)delegate
{
  return _peripheral.delegate;
}

- (NSUUID *)identifier
{
  return _peripheral.identifier;
}

- (NSString *)name
{
  return _peripheral.name;
}

- (CBPeripheralState)state
{
  return _peripheral.state;
}

- (NSArray<EXBluetoothService *> *)services
{
  NSMutableArray *array = [[NSMutableArray alloc] init];
  for (CBService *service in _peripheral.services) {
    [array addObject:[[EXBluetoothService alloc] initWithService:service peripheral:self]];
  }
  return array;
}

- (void)readRSSI:(EXBluetoothPeripheralReadRSSIBlock)block
{
  NSAssert(block, @"readRSSI: block cannot be nil");
  _readRSSIBlock = block;
  [_peripheral readRSSI];
}

- (void)discoverServices:(NSArray<CBUUID *> *)serviceUUIDs withBlock:(EXBluetoothPeripheralDiscoverServicesBlock)block
{
  NSAssert(block, @"discoverServices:withBlock: block cannot be nil");
  _discoverServicesBlock = block;
  _peripheral.delegate = self;
  [_peripheral discoverServices:serviceUUIDs];
}

- (void)discoverIncludedServices:(NSArray<CBUUID *> *)includedServiceUUIDs
                      forService:(EXBluetoothService *)service
                       withBlock:(EXBluetoothPeripheralDiscoverIncludedServicesBlock)block
{
  NSAssert(block, @"discoverIncludedServices:forService:withBlock: block cannot be nil");
  [_discoverIncludedServicesBlocks setObject:block forKey:service.UUID.UUIDString];
  [_peripheral discoverIncludedServices:includedServiceUUIDs forService:service.service];
}

- (void)discoverCharacteristics:(NSArray<CBUUID *> *)characteristicUUIDs
                     forService:(EXBluetoothService *)service
                      withBlock:(EXBluetoothPeripheralDiscoverCharacteristicsBlock)block
{
  NSAssert(block, @"discoverCharacteristics:forService:withBlock: block cannot be nil");
  [_discoverCharacteristicsBlocks setObject:block forKey:service.UUID.UUIDString];
  [_peripheral discoverCharacteristics:characteristicUUIDs forService:service.service];
}

- (void)readValueForCharacteristic:(EXBluetoothCharacteristic *)characteristic withBlock:(EXBluetoothPeripheralReadValueForCharacteristicBlock)block
{
  NSAssert(block, @"readValueForCharacteristic:withBlock: block cannot be nil");
  [_readValueForCharacteristicsBlocks setValue:block forKey:characteristic.UUID.UUIDString];
  [_peripheral readValueForCharacteristic:characteristic.characteristic];
}

- (void)writeValue:(NSData *)data
 forCharacteristic:(EXBluetoothCharacteristic *)characteristic
              type:(CBCharacteristicWriteType)type
         withBlock:(EXBluetoothPeripheralWriteValueForCharacteristicsBlock)block
{
  NSAssert(block, @"writeValue:forCharacteristic:type:withBlock: block cannot be nil");
  [_writeValueForCharacteristicsBlocks setValue:block forKey:characteristic.UUID.UUIDString];
  [_peripheral writeValue:data forCharacteristic:characteristic.characteristic type:type];
}

- (void)setNotifyValue:(BOOL)enabled forCharacteristic:(EXBluetoothCharacteristic *)characteristic withBlock:(EXBluetoothPeripheralNotifyValueForCharacteristicsBlock)block
{
  
  if (enabled) {
    NSAssert(block, @"setNotifyValue:forCharacteristic:withBlock: block cannot be nil");
    [_notifyValueForCharacteristics setValue:block forKey:characteristic.UUID.UUIDString];
  } else {
    [_notifyValueForCharacteristics removeObjectForKey:characteristic.UUID.UUIDString];
  }
  
  [_peripheral setNotifyValue:enabled forCharacteristic:characteristic.characteristic];
}

-(void)discoverDescriptorsForCharacteristic:(EXBluetoothCharacteristic *)characteristic withBlock:(EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock)block
{
  NSAssert(block, @"discoverDescriptorsForCharacteristic:withBlcok: block cannot be nil");
  [_discoverDescriptorsForCharacteristicBlocks setObject:block forKey:characteristic.UUID.UUIDString];
  [_peripheral discoverDescriptorsForCharacteristic:characteristic.characteristic];
}

- (void)readValueForDescriptor:(EXBluetoothDescriptor *)descriptor withBlock:(EXBluetoothPeripheralReadValueForDescriptorsBlock)block
{
  NSAssert(block, @"readValueForDescriptor:withBlock: block cannot be nil");
  [_readValueForDescriptorsBlock setValue:block forKey:descriptor.UUID.UUIDString];
  [_peripheral readValueForDescriptor:descriptor.descriptor];
}

- (void)writeValue:(NSData *)data forDescriptor:(EXBluetoothDescriptor *)descriptor withBlock:(EXBluetoothPeripheralWriteValueForDescriptorsBlock)block
{
  NSAssert(block, @"writeValue:forDescriptor:withBlock: block cannot be nil");
  [_writeValueForDescriptorsBlock setValue:block forKey:descriptor.UUID.UUIDString];
  [_peripheral writeValue:data forDescriptor:descriptor.descriptor];
}

#pragma mark - CBPeripheralDelegate

- (void)peripheralDidUpdateName:(CBPeripheral *)peripheral
{
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !_didUpdateNameBlock) {
    return;
  }
  
  _didUpdateNameBlock(self);
}

- (void)peripheral:(CBPeripheral *)peripheral didModifyServices:(NSArray<CBService *> *)invalidatedServices
{
  if (!EXBluetoothPeripheralIsSelf(peripheral)) {
    return;
  }

  // TODO: Bacon: Somehow notify that we've invalidated services
}

- (void)peripheral:(CBPeripheral *)peripheral didReadRSSI:(NSNumber *)RSSI error:(NSError *)error
{
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !_readRSSIBlock) {
    return;
  }
  _RSSI = RSSI;
  _readRSSIBlock(self, RSSI, error);
  _readRSSIBlock = nil;
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error
{
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !_discoverServicesBlock) {
    return;
  }
  _discoverServicesBlock(self, error);
  _discoverServicesBlock = nil;
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverIncludedServicesForService:(CBService *)service error:(NSError *)error
{
  EXBluetoothPeripheralDiscoverIncludedServicesBlock block = [_discoverIncludedServicesBlocks objectForKey:service.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !block) {
    return;
  }
  EXBluetoothService *mService = [[EXBluetoothService alloc] initWithService:service peripheral:self];
  block(self, mService, error);
  [_discoverIncludedServicesBlocks removeObjectForKey:service.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error
{
  EXBluetoothPeripheralDiscoverCharacteristicsBlock block = [_discoverCharacteristicsBlocks objectForKey:service.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !block) {
    return;
  }
  EXBluetoothService *mService = [[EXBluetoothService alloc] initWithService:service peripheral:self];
  block(self, mService, error);
  [_discoverCharacteristicsBlocks removeObjectForKey:service.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
  if (!EXBluetoothPeripheralIsSelf(peripheral)) {
    return;
  }
  EXBluetoothPeripheralReadValueForCharacteristicBlock readBlock = [_readValueForCharacteristicsBlocks objectForKey:characteristic.UUID.UUIDString];
  EXBluetoothCharacteristic *mCharacteristic = [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self];
  if (readBlock) {
    readBlock(self, mCharacteristic, error);
    [_readValueForCharacteristicsBlocks removeObjectForKey:characteristic.UUID.UUIDString];
  }
  EXBluetoothPeripheralNotifyValueForCharacteristicsBlock notifyBlock = [_notifyValueForCharacteristics objectForKey:characteristic.UUID.UUIDString];
  if (notifyBlock) {
    notifyBlock(self, mCharacteristic, error);
  }
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
  EXBluetoothPeripheralWriteValueForCharacteristicsBlock block = [_writeValueForCharacteristicsBlocks objectForKey:characteristic.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !block) {
    return;
  }
  EXBluetoothCharacteristic *mCharacteristic = [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self];
  block(self, mCharacteristic, error);
  [_writeValueForCharacteristicsBlocks removeObjectForKey:characteristic.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
  EXBluetoothPeripheralNotifyValueForCharacteristicsBlock block = [_notifyValueForCharacteristics objectForKey:characteristic.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !block) {
    return;
  }
  EXBluetoothCharacteristic *mCharacteristic = [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self];
  block(self, mCharacteristic, error);
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverDescriptorsForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
  EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock block = [_discoverDescriptorsForCharacteristicBlocks objectForKey:characteristic.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !block) {
    return;
  }
  EXBluetoothCharacteristic *mCharacteristic = [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self];
  block(self, mCharacteristic, error);
  [_discoverDescriptorsForCharacteristicBlocks removeObjectForKey:characteristic.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error
{
  EXBluetoothPeripheralReadValueForDescriptorsBlock block = [_readValueForDescriptorsBlock objectForKey:descriptor.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !block) {
    return;
  }
  EXBluetoothDescriptor *mDescriptor = [[EXBluetoothDescriptor alloc] initWithDescriptor:descriptor peripheral:self];
  block(self, mDescriptor, error);
  [_readValueForDescriptorsBlock removeObjectForKey:descriptor.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error
{
  EXBluetoothPeripheralWriteValueForDescriptorsBlock block = [_writeValueForDescriptorsBlock objectForKey:descriptor.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !block) {
    return;
  }
  EXBluetoothDescriptor *exDescriptor = [[EXBluetoothDescriptor alloc] initWithDescriptor:descriptor peripheral:self];
  block(self, exDescriptor, error);
  [_writeValueForDescriptorsBlock removeObjectForKey:descriptor.UUID.UUIDString];
}

- (NSDictionary *)getJSON
{
  return [[EXBluetooth class] EXBluetoothPeripheral_NativeToJSON:self];
}

-(BOOL)guardIsConnected:(EXPromiseRejectBlock)reject
{
  if (_peripheral.state != CBPeripheralStateConnected) {
    NSString *state = [[EXBluetooth class] CBPeripheralState_NativeToJSON:_peripheral.state];

    reject(EXBluetoothErrorState, [NSString stringWithFormat:@"Peripheral is not connected: %@ state: %@", _peripheral.identifier.UUIDString, state], nil);
    return true;
  }
  return false;
}

- (EXBluetoothService *)getServiceOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject
{
  CBUUID *serviceUUID = [CBUUID UUIDWithString:UUIDString];
  EXBluetoothService *service = [self serviceFromUUID:serviceUUID];
  if (!service) {
    reject(EXBluetoothErrorNoService, [NSString stringWithFormat:@"No valid service with UUID %@ found on peripheral %@", UUIDString, _peripheral.identifier.UUIDString], nil);
  }
  return service;
}

- (EXBluetoothService *)serviceFromUUID:(CBUUID *)UUID
{
  NSString *uuidString = UUID.UUIDString;
  
  for (CBService *service in _peripheral.services) {
    if ([service.UUID.UUIDString isEqualToString:uuidString]) {
      return [[EXBluetoothService alloc] initWithService:service peripheral:self];
    }
  }
  return nil;
}

@end
