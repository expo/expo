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
  EXBluetoothPeripheralDidUpdateName _onDidUpdateName;
  EXBluetoothPeripheralReadRSSI _onReadRSSI;
  EXBluetoothPeripheralDiscoverServices _onDiscoverServices;
  // Operations
  NSMutableDictionary *_onReadValueForCharacteristics;
  NSMutableDictionary *_onWriteValueForCharacteristics;
  NSMutableDictionary *_onNotifyValueForCharacteristics;
  NSMutableDictionary *_onReadValueForDescriptors;
  NSMutableDictionary *_onWriteValueForDescriptors;
  
  // Discovery
  NSMutableDictionary *_onDiscoverCharacteristics;
  NSMutableDictionary *_onDiscoverIncludedServices;
  NSMutableDictionary *_onDiscoverDescriptorsForCharacteristic;
}

@end

@implementation EXBluetoothPeripheral

- (instancetype)initWithPeripheral:(CBPeripheral *)peripheral
{
  NSAssert(peripheral, @"EXBluetoothPeripheral cannot be created without a native peripheral.");
  self = [super init];
  if (self) {
    _peripheral = peripheral;
    _peripheral.delegate = self;
    
    // Operations
    _onReadValueForCharacteristics = [[NSMutableDictionary alloc] init];
    _onWriteValueForCharacteristics = [[NSMutableDictionary alloc] init];
    _onNotifyValueForCharacteristics = [[NSMutableDictionary alloc] init];
    _onReadValueForDescriptors = [[NSMutableDictionary alloc] init];
    _onWriteValueForDescriptors = [[NSMutableDictionary alloc] init];
    // Discovery
    _onDiscoverCharacteristics = [[NSMutableDictionary alloc] init];
    _onDiscoverIncludedServices = [[NSMutableDictionary alloc] init];
    _onDiscoverDescriptorsForCharacteristic = [[NSMutableDictionary alloc] init];
   
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

- (void)readRSSI:(EXBluetoothPeripheralReadRSSI)onReadRSSI
{
  _onReadRSSI = onReadRSSI;
  [_peripheral readRSSI];
}

- (void)discoverServices:(NSArray<CBUUID *> *)serviceUUIDs
               withDiscoverServicesCallback:(EXBluetoothPeripheralDiscoverServices)onDiscoverServices
{
  _onDiscoverServices = onDiscoverServices;
  _peripheral.delegate = self;
  [_peripheral discoverServices:serviceUUIDs];
}

- (void)discoverIncludedServices:(NSArray<CBUUID *> *)includedServiceUUIDs
                      forService:(EXBluetoothService *)service
                       withDiscoverIncludedServicesCallback:(EXBluetoothPeripheralDiscoverIncludedServices)onDiscoverIncludedServices
{
  [_onDiscoverIncludedServices setObject:onDiscoverIncludedServices forKey:service.UUID.UUIDString];
  [_peripheral discoverIncludedServices:includedServiceUUIDs forService:service.service];
}

- (void)discoverCharacteristics:(NSArray<CBUUID *> *)characteristicUUIDs
                     forService:(EXBluetoothService *)service withDiscoverCharacteristicsCallback:(EXBluetoothPeripheralDiscoverCharacteristics)onDiscoverCharacteristics
{
  [_onDiscoverCharacteristics setObject:onDiscoverCharacteristics forKey:service.UUID.UUIDString];
  [_peripheral discoverCharacteristics:characteristicUUIDs forService:service.service];
}

- (void)readValueForCharacteristic:(EXBluetoothCharacteristic *)characteristic
                         withReadValueForCharacteristicCallback:(EXBluetoothPeripheralReadValueForCharacteristic)onReadValueForCharacteristic
{
  [_onReadValueForCharacteristics setValue:onReadValueForCharacteristic forKey:characteristic.UUID.UUIDString];
  [_peripheral readValueForCharacteristic:characteristic.characteristic];
}

- (void)writeValue:(NSData *)data
 forCharacteristic:(EXBluetoothCharacteristic *)characteristic
              type:(CBCharacteristicWriteType)type
         withWriteValueForCharacteristicsCallback:(EXBluetoothPeripheralWriteValueForCharacteristics)onWriteValueForCharacteristics
{
  [_onWriteValueForCharacteristics setValue:onWriteValueForCharacteristics forKey:characteristic.UUID.UUIDString];
  [_peripheral writeValue:data forCharacteristic:characteristic.characteristic type:type];
}

- (void)setNotifyValue:(BOOL)enabled forCharacteristic:(EXBluetoothCharacteristic *)characteristic withNotifyValueForCharacteristicsCallback:(EXBluetoothPeripheralNotifyValueForCharacteristics)onNotifyValueForCharacteristics
{
  
  if (enabled) {
    [_onNotifyValueForCharacteristics setValue:onNotifyValueForCharacteristics forKey:characteristic.UUID.UUIDString];
  } else {
    [_onNotifyValueForCharacteristics removeObjectForKey:characteristic.UUID.UUIDString];
  }
  
  [_peripheral setNotifyValue:enabled forCharacteristic:characteristic.characteristic];
}

-(void)discoverDescriptorsForCharacteristic:(EXBluetoothCharacteristic *)characteristic withDiscoverDescriptorsForCharacteristicCallback:(EXBluetoothPeripheralDiscoverDescriptorsForCharacteristic)onDiscoverDescriptorsForCharacteristic
{
  [_onDiscoverDescriptorsForCharacteristic setObject:onDiscoverDescriptorsForCharacteristic forKey:characteristic.UUID.UUIDString];
  [_peripheral discoverDescriptorsForCharacteristic:characteristic.characteristic];
}

- (void)readValueForDescriptor:(EXBluetoothDescriptor *)descriptor withReadValueForDescriptors:(EXBluetoothPeripheralReadValueForDescriptors)onReadValueForDescriptors
{
  [_onReadValueForDescriptors setValue:onReadValueForDescriptors forKey:descriptor.UUID.UUIDString];
  [_peripheral readValueForDescriptor:descriptor.descriptor];
}

- (void)writeValue:(NSData *)data forDescriptor:(EXBluetoothDescriptor *)descriptor withWriteValueForDescriptorsCallback:(EXBluetoothPeripheralWriteValueForDescriptors)onWriteValueForDescriptors
{
  [_onWriteValueForDescriptors setValue:onWriteValueForDescriptors forKey:descriptor.UUID.UUIDString];
  [_peripheral writeValue:data forDescriptor:descriptor.descriptor];
}

#pragma mark - CBPeripheralDelegate

- (void)peripheralDidUpdateName:(CBPeripheral *)peripheral
{
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !_onDidUpdateName) {
    return;
  }
  
  _onDidUpdateName(self);
}

- (void)peripheral:(CBPeripheral *)peripheral
 didModifyServices:(NSArray<CBService *> *)invalidatedServices
{
  if (!EXBluetoothPeripheralIsSelf(peripheral)) {
    return;
  }
  
  // TODO: Bacon: Somehow notify that we've invalidated services
}

- (void)peripheral:(CBPeripheral *)peripheral didReadRSSI:(NSNumber *)RSSI error:(nullable NSError *)error
{
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !_onReadRSSI) {
    return;
  }
  _RSSI = RSSI;
  _onReadRSSI(self, RSSI, error);
  _onReadRSSI = nil;
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error
{
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !_onDiscoverServices) {
    return;
  }
  _onDiscoverServices(self, error);
  _onDiscoverServices = nil;
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverIncludedServicesForService:(CBService *)service
             error:(NSError *)error
{
  EXBluetoothPeripheralDiscoverIncludedServices callback = _onDiscoverIncludedServices[service.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !callback) {
    return;
  }
  callback(self, [[EXBluetoothService alloc] initWithService:service peripheral:self], error);
  [_onDiscoverIncludedServices removeObjectForKey:service.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error
{
  EXBluetoothPeripheralDiscoverCharacteristics callback = _onDiscoverCharacteristics[service.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !callback) {
    return;
  }
  callback(self, [[EXBluetoothService alloc] initWithService:service peripheral:self], error);
  [_onDiscoverCharacteristics removeObjectForKey:service.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic
             error:(NSError *)error
{
  if (!EXBluetoothPeripheralIsSelf(peripheral)) {
    return;
  }
  EXBluetoothPeripheralReadValueForCharacteristic readCallback = _onReadValueForCharacteristics[characteristic.UUID.UUIDString];
  EXBluetoothCharacteristic *exCharacteristic = [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self];
  if (readCallback) {
    readCallback(self, exCharacteristic, error);
    [_onReadValueForCharacteristics removeObjectForKey:characteristic.UUID.UUIDString];
  }
  EXBluetoothPeripheralNotifyValueForCharacteristics notifyCallback = _onNotifyValueForCharacteristics[characteristic.UUID.UUIDString];
  if (notifyCallback) {
    notifyCallback(self, exCharacteristic, error);
    [_onNotifyValueForCharacteristics removeObjectForKey:characteristic.UUID.UUIDString];
  }
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic
             error:(NSError *)error
{
  EXBluetoothPeripheralWriteValueForCharacteristics callback = _onWriteValueForCharacteristics[characteristic.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !callback) {
    return;
  }
  callback(self, [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self], error);
  [_onWriteValueForCharacteristics removeObjectForKey:characteristic.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic
             error:(NSError *)error
{
  EXBluetoothPeripheralNotifyValueForCharacteristics callback = _onNotifyValueForCharacteristics[characteristic.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !callback) {
    return;
  }
  callback(self, [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self], error);
  [_onNotifyValueForCharacteristics removeObjectForKey:characteristic.UUID.UUIDString];
  
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverDescriptorsForCharacteristic:(CBCharacteristic *)characteristic
             error:(NSError *)error
{
  EXBluetoothPeripheralDiscoverDescriptorsForCharacteristic callback = _onDiscoverDescriptorsForCharacteristic[characteristic.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !callback) {
    return;
  }
  callback(self, [[EXBluetoothCharacteristic alloc] initWithCharacteristic:characteristic peripheral:self], error);
  [_onDiscoverDescriptorsForCharacteristic removeObjectForKey:characteristic.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForDescriptor:(CBDescriptor *)descriptor
             error:(NSError *)error
{
  EXBluetoothPeripheralReadValueForDescriptors callback = _onReadValueForDescriptors[descriptor.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !callback) {
    return;
  }
  callback(self, [[EXBluetoothDescriptor alloc] initWithDescriptor:descriptor peripheral:self], error);
  [_onReadValueForDescriptors removeObjectForKey:descriptor.UUID.UUIDString];
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error
{
  EXBluetoothPeripheralWriteValueForDescriptors callback = _onWriteValueForDescriptors[descriptor.UUID.UUIDString];
  if (!EXBluetoothPeripheralIsSelf(peripheral) || !callback) {
    return;
  }
  callback(self, [[EXBluetoothDescriptor alloc] initWithDescriptor:descriptor peripheral:self], error);
  [_onWriteValueForDescriptors removeObjectForKey:descriptor.UUID.UUIDString];
}

- (BOOL)guardIsConnected:(EXPromiseRejectBlock)reject
{
  if (_peripheral.state != CBPeripheralStateConnected) {
    NSString *state = [EXBluetooth CBPeripheralStateNativeToJSON:_peripheral.state];
    
    reject(EXBluetoothErrorState, [NSString stringWithFormat:@"Peripheral is not connected: %@ state: %@", _peripheral.identifier.UUIDString, state], nil);
    return YES;
  }
  return NO;
}

- (EXBluetoothService *)getServiceOrReject:(NSString *)UUIDString
                                    reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothService *service = [self serviceFromUUID:UUIDString];
  if (!service) {
    reject(EXBluetoothErrorNoService, [NSString stringWithFormat:@"No valid service with UUID %@ found on peripheral %@", UUIDString, _peripheral.identifier.UUIDString], nil);
  }
  return service;
}

- (EXBluetoothService *)serviceFromUUID:(NSString *)UUID
{
  for (CBService *service in _peripheral.services) {
    if ([service.UUID.UUIDString isEqualToString:UUID]) {
      return [[EXBluetoothService alloc] initWithService:service peripheral:self];
    }
  }
  return nil;
}

- (NSDictionary *)getJSON
{
  return [EXBluetooth EXBluetoothPeripheralNativeToJSON:self];
}

@end
