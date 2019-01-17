// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXCore/EXEventEmitterService.h>


NSString *const EXBluetoothErrorUnimplemented = @"ERR_UNIMPLEMENTED";
NSString *const EXBluetoothErrorNoPeripheral = @"ERR_NO_PERIPHERAL";
NSString *const EXBluetoothErrorNoService = @"ERR_NO_SERVICE";
NSString *const EXBluetoothErrorNoCharacteristic = @"ERR_NO_CHARACTERISTIC";
NSString *const EXBluetoothErrorNoDescriptor = @"ERR_NO_DESCRIPTOR";
NSString *const EXBluetoothErrorWrite = @"ERR_WRITE";
NSString *const EXBluetoothErrorRead = @"ERR_READ";
NSString *const EXBluetoothErrorInvalidBase64 = @"ERR_INVALID_BASE64";
NSString *const EXBluetoothErrorState = @"ERR_STATE";


NSString *const EXBluetoothEvent = @"bluetoothEvent";
NSString *const EXBluetoothDisconnectEvent = @"bluetoothDisconnect";
NSString *const EXBluetoothDidFailToConnectEvent = @"bluetoothDidFailToConnect";

NSString *const EXBluetoothCentralDidUpdateStateEvent = @"bluetoothCentralDidUpdateState";
NSString *const EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent = @"central.didRetrieveConnectedPeripherals";
NSString *const EXBluetoothCentralDidRetrievePeripheralsEvent = @"central.didRetrievePeripherals";
NSString *const EXBluetoothCentralDidDiscoverPeripheralEvent = @"central.didDiscoverPeripheral";
NSString *const EXBluetoothCentralDidConnectPeripheralEvent = @"central.didConnectPeripheral";
NSString *const EXBluetoothCentralDidDisconnectPeripheralEvent = @"central.didDisconnectPeripheral";
NSString *const EXBluetoothPeripheralDidDiscoverServicesEvent = @"peripheral.didDiscoverServices";
NSString *const EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent = @"peripheral.didDiscoverCharacteristicsForService";
NSString *const EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent = @"peripheral.didDiscoverDescriptorsForCharacteristic";
NSString *const EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent = @"peripheral.didUpdateValueForCharacteristic";
NSString *const EXBluetoothPeripheralDidWriteValueForCharacteristicEvent = @"peripheral.didWriteValueForCharacteristic";
NSString *const EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent = @"peripheral.didUpdateNotificationStateForCharacteristic";
NSString *const EXBluetoothPeripheralDidUpdateValueForDescriptorEvent = @"peripheral.didUpdateValueForDescriptor";
NSString *const EXBluetoothPeripheralDidWriteValueForDescriptorEvent = @"peripheral.didWriteValueForDescriptor";
NSString *const EXBluetoothPeripheralDidReadRSSIEvent = @"peripheral.didReadRSSI";

NSString *const EXBluetoothCentralKey = @"central";
NSString *const EXBluetoothPeripheralKey = @"peripheral";
NSString *const EXBluetoothDescriptorKey = @"descriptor";
NSString *const EXBluetoothServiceKey = @"service";
NSString *const EXBluetoothCharacteristicKey = @"characteristic";
NSString *const EXBluetoothRSSIKey = @"rssi";
NSString *const EXBluetoothAdvertisementDataKey = @"advertisementData";
NSString *const EXBluetoothServiceUUIDsKey = @"serviceUUIDs";
NSString *const EXBluetoothPeripheralsKey = @"peripherals";

NSString *const EXBluetoothPeripheralUUID = @"peripheralUUID";
NSString *const EXBluetoothServiceUUID = @"serviceUUID";
NSString *const EXBluetoothCharacteristicUUID = @"characteristicUUID";
NSString *const EXBluetoothDescriptorUUID = @"descriptorUUID";

NSString *const EXBluetoothEventKey = @"event";
NSString *const EXBluetoothDataKey = @"data";
NSString *const EXBluetoothErrorKey = @"error";
NSString *const EXBluetoothTransactionIdKey = @"transactionId";


@interface EXBluetooth()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL isObserving;

@end

@implementation EXBluetooth {
  CBCentralManager *_manager;
  NSMutableDictionary *_peripherals;
}

- (instancetype)init {
  if ((self = [super init])) {
    _peripherals = [NSMutableDictionary dictionary];
  }
  return self;
}

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  
  if (_manager) {
    if ([_manager isScanning]) {
      [_manager stopScan];
    }
    
//    @synchronized(_peripherals) {
//      for (NSString *key in _peripherals) {
//        CBPeripheral *peripheral = _peripherals[key];
//        [_manager cancelPeripheralConnection:peripheral];
//        [_peripherals removeObjectForKey:key];
//      }
//    }
    
    _manager = nil;
  }
}

#pragma mark - Expo

EX_EXPORT_MODULE(ExpoBluetooth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _manager = [[CBCentralManager alloc] initWithDelegate:self queue:[self methodQueue] options:nil];
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"BLUETOOTH_EVENT": EXBluetoothEvent,
           @"UUID": @{
               @"PERIPHERAL": EXBluetoothPeripheralUUID,
               @"SERVICE": EXBluetoothServiceUUID,
               @"CHARACTERISTIC": EXBluetoothCharacteristicUUID,
               @"DESCRIPTOR": EXBluetoothDescriptorUUID,
               },
           @"TYPES": @{
              @"CENTRAL": EXBluetoothCentralKey,
              @"PERIPHERAL": EXBluetoothPeripheralKey,
              @"DESCRIPTOR": EXBluetoothDescriptorKey,
              @"SERVICE": EXBluetoothServiceKey,
              @"CHARACTERISTIC": EXBluetoothCharacteristicKey,
               },
           @"EVENTS": @{
               @"CENTRAL_DID_UPDATE_STATE": EXBluetoothCentralDidUpdateStateEvent,
               @"CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS": EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent,
               @"CENTRAL_DID_RETRIEVE_PERIPHERALS": EXBluetoothCentralDidRetrievePeripheralsEvent,
               @"CENTRAL_DID_DISCOVER_PERIPHERAL": EXBluetoothCentralDidDiscoverPeripheralEvent,
               @"CENTRAL_DID_CONNECT_PERIPHERAL": EXBluetoothCentralDidConnectPeripheralEvent,
               @"CENTRAL_DID_DISCONNECT_PERIPHERAL": EXBluetoothCentralDidDisconnectPeripheralEvent,
               @"PERIPHERAL_DID_DISCOVER_SERVICES": EXBluetoothPeripheralDidDiscoverServicesEvent,
               @"PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE": EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent,
               @"PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC": EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent,
               @"PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC": EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent,
               @"PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC": EXBluetoothPeripheralDidWriteValueForCharacteristicEvent,
               @"PERIPHERAL_DID_UPDATE_NOTIFICATION_STATE_FOR_CHARACTERISTIC": EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent,
               @"PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR": EXBluetoothPeripheralDidUpdateValueForDescriptorEvent,
               @"PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR": EXBluetoothPeripheralDidWriteValueForDescriptorEvent,
               @"PERIPHERAL_DID_READ_RSSI": EXBluetoothPeripheralDidReadRSSIEvent
               }
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXBluetoothEvent];
}

- (void)startObserving {
  _isObserving = YES;
}

- (void)stopObserving {
  _isObserving = NO;
}

- (void)emit:(NSString *)eventName data:(NSDictionary *)data
{
  if (_isObserving) {
    [_eventEmitter
     sendEventWithName:EXBluetoothEvent
     body:@{
            EXBluetoothEventKey: eventName,
            EXBluetoothDataKey: EXNullIfNil(data)
            }];
  }
}

EX_EXPORT_METHOD_AS(initializeManagerAsync,
                    initializeManagerAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  /*
   CBCentralManagerOptionShowPowerAlertKey
   CBCentralManagerOptionRestoreIdentifierKey
   
   */
  resolve(nil);
}

EX_EXPORT_METHOD_AS(deallocateManagerAsync,
                    deallocateManagerAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(getPeripheralsAsync,
                    getPeripheralsAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  resolve([self.class CBPeripheralList_NativeToJSON:[_peripherals allValues]]);
}

EX_EXPORT_METHOD_AS(getCentralAsync,
                    getCentralAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  resolve([self.class CBCentralManager_NativeToJSON:_manager]);
}

EX_EXPORT_METHOD_AS(startScanAsync,
                    startScanAsync:(NSArray<NSString *> *)serviceUUIDStrings
                    options:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  NSArray *serviceUUIDs = [self.class CBUUIDList_JSONToNative:serviceUUIDStrings];
  // TODO: Bacon: Fix these options
  [_manager scanForPeripheralsWithServices:serviceUUIDs options:options];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(stopScanAsync,
                    stopScanAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  [_manager stopScan];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(connectAsync,
                    connectAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"uuid"] reject:reject];
  if (!peripheral) {
    return;
  }
  
  // TODO: Bacon: Convert the options to native
  [_manager connectPeripheral:peripheral options:options[@"options"]];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(readRSSIAsync,
                    readRSSIAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"uuid"] reject:reject];
  if (!peripheral) {
    return;
  }
  
  [peripheral readRSSI];
  resolve([NSNull null]);
}

// TODO: Bacon: Guard bluetooth enabled/available
EX_EXPORT_METHOD_AS(updateDescriptorAsync,
                    updateDescriptorAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[EXBluetoothPeripheralUUID] reject:reject];
  if (!peripheral) {
    return;
  }
  
  CBService *service = [self _getServiceOrReject:options[EXBluetoothServiceUUID] peripheral:peripheral reject:reject];
  if (!service) {
    return;
  }
  
  CBCharacteristicProperties characteristicProperties = [self.class CBCharacteristicProperties_JSONToNative:options[@"characteristicProperties"]];
  CBCharacteristic *characteristic = [self _getCharacteristicOrReject:options[EXBluetoothCharacteristicUUID] service:service characteristicProperties:characteristicProperties reject:reject];
  if (!characteristic) {
    return;
  }
  
  CBDescriptor *descriptor = [self _getDescriptorOrReject:options[EXBluetoothDescriptorUUID] characteristic:characteristic reject:reject];
  if (!descriptor) {
    return;
  }
  
  switch (characteristicProperties) {
    case CBCharacteristicPropertyRead:
      [peripheral readValueForDescriptor:descriptor];
      break;
    case CBCharacteristicPropertyWrite:
    {
      // Bacon: Predict the following, and throw an error without crashing the app.
      if ([descriptor.UUID.UUIDString isEqualToString:CBUUIDClientCharacteristicConfigurationString]) {
        reject(EXBluetoothErrorWrite, @"Client Characteristic Configuration descriptors must be configured using setNotifyValue:forCharacteristic:", nil);
        return;
      }
      NSData *data = [self _getDataOrReject:options[@"data"] reject:reject];
      if (!data) {
        return;
      }
      [peripheral writeValue:data forDescriptor:descriptor];
    }
      break;
    case CBCharacteristicPropertyWriteWithoutResponse:
    case CBCharacteristicPropertyNotify:
    case CBCharacteristicPropertyIndicate:
    case CBCharacteristicPropertyBroadcast:
    case CBCharacteristicPropertyExtendedProperties:
    case CBCharacteristicPropertyNotifyEncryptionRequired:
    case CBCharacteristicPropertyAuthenticatedSignedWrites:
    case CBCharacteristicPropertyIndicateEncryptionRequired:
    default:
      reject(EXBluetoothErrorUnimplemented, @"The CharacteristicProperty you have chosen to update is not supported.", nil);
      break;
  }
}

EX_EXPORT_METHOD_AS(updateCharacteristicAsync,
                    updateCharacteristicAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[EXBluetoothPeripheralUUID] reject:reject];
  if (!peripheral) {
    return;
  }
  
  CBService *service = [self _getServiceOrReject:options[EXBluetoothServiceUUID] peripheral:peripheral reject:reject];
  if (!service) {
    return;
  }
  
  CBCharacteristicProperties characteristicProperties = [self.class CBCharacteristicProperties_JSONToNative:options[@"characteristicProperties"]];
  CBCharacteristic *characteristic = [self _getCharacteristicOrReject:options[EXBluetoothCharacteristicUUID] service:service characteristicProperties:characteristicProperties reject:reject];
  if (!characteristic) {
    return;
  }
  
  // Characteristic Updates
  switch (characteristicProperties) {
    case CBCharacteristicPropertyRead:
      [peripheral readValueForCharacteristic:characteristic];
      break;
    case CBCharacteristicPropertyWrite:
    {
      NSData *data = [self _getDataOrReject:options[@"data"] reject:reject];
      if (!data) {
        return;
      }
      [peripheral writeValue:data forCharacteristic:characteristic type:CBCharacteristicWriteWithResponse];
    }
      break;
    case CBCharacteristicPropertyWriteWithoutResponse:
    {
      NSData *data = [self _getDataOrReject:options[@"data"] reject:reject];
      if (!data) {
        return;
      }
      [peripheral writeValue:data forCharacteristic:characteristic type:CBCharacteristicWriteWithoutResponse];
    }
      break;
      // TODO: Bacon: These probably break the transaction system.
    case CBCharacteristicPropertyNotify:
    case CBCharacteristicPropertyIndicate:
    {
      // TODO: Bacon: Add filter to delegate method
      BOOL isEnabled = [options[@"isEnabled"] boolValue];
      [peripheral setNotifyValue:isEnabled forCharacteristic:characteristic];
    }
      break;
      // TODO: Bacon: Add these
    case CBCharacteristicPropertyBroadcast:
    case CBCharacteristicPropertyExtendedProperties:
    case CBCharacteristicPropertyNotifyEncryptionRequired:
    case CBCharacteristicPropertyAuthenticatedSignedWrites:
    case CBCharacteristicPropertyIndicateEncryptionRequired:
    default:
      reject(@"ERR_BLE_UPDATE_UNIMP", @"The CharacteristicProperty you have chosen to update is not implemented in expo-bluetooth.", nil);
      return;
  }
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(disconnectAsync,
                    disconnectAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"uuid"] reject:reject];
  if (!peripheral) {
    return;
  }
  
  [_manager cancelPeripheralConnection:peripheral];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(discoverAsync,
                    discoverAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([self guardBluetoothEnabled:reject]) {
    return;
  }
  NSArray *serviceUUIDs = [self.class CBUUIDList_JSONToNative:options[EXBluetoothServiceUUIDsKey]];
  
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[EXBluetoothPeripheralUUID] reject:reject];
  if (!peripheral) {
    return;
  }
  
  NSString *serviceUUIDString = options[EXBluetoothServiceUUID];
  
  if (!serviceUUIDString) {
    [peripheral discoverServices:serviceUUIDs];
    resolve([NSNull null]);
    return;
  }
  
  CBService *service = [self _getServiceOrReject:serviceUUIDString peripheral:peripheral reject:reject];
  if (!service) {
    return;
  }
  
  NSString *characteristicUUIDString = options[EXBluetoothCharacteristicUUID];
  
  if (!characteristicUUIDString) {
    [peripheral discoverCharacteristics:serviceUUIDs forService:service];
    resolve([NSNull null]);
    return;
  }
  
  CBCharacteristicProperties prop = [options[@"characteristicProperties"] integerValue];
  
  CBCharacteristic *characteristic = [self _getCharacteristicOrReject:characteristicUUIDString service:service characteristicProperties:prop reject:reject];
  if (!characteristic) {
    return;
  }
  
  [peripheral discoverDescriptorsForCharacteristic:characteristic];
  resolve([NSNull null]);
}

#pragma mark - Get Async

- (NSData *)_getDataOrReject:(NSString *)dataString reject:(EXPromiseRejectBlock)reject
{
  if (dataString != nil) {
    NSData *data = [[NSData alloc] initWithBase64EncodedString:dataString options:NSDataBase64DecodingIgnoreUnknownCharacters];
    if (!data) {
      reject(EXBluetoothErrorInvalidBase64, @"Failed to parse base64 string.", nil);
      return nil;
    }
    return data;
  } else {
    reject(EXBluetoothErrorInvalidBase64, @"Failed to parse nil string.", nil);
    return nil;
  }
}

- (CBPeripheral *)_getPeripheralOrReject:(NSString *)uuid reject:(EXPromiseRejectBlock)reject
{
  CBPeripheral *peripheral = [_peripherals objectForKey:uuid];
  if (!peripheral) {
    reject(EXBluetoothErrorNoPeripheral, [NSString stringWithFormat:@"No valid peripheral with UUID %@", uuid], nil);
  }
  return peripheral;
}

- (CBService *)_getServiceOrReject:(NSString *)uuid peripheral:(CBPeripheral *)peripheral reject:(EXPromiseRejectBlock)reject
{
  CBUUID *serviceUUID = [CBUUID UUIDWithString:uuid];
  CBService *service = [self serviceFromUUID:serviceUUID peripheral:peripheral];
  if (!service) {
    reject(EXBluetoothErrorNoService, [NSString stringWithFormat:@"No valid service with UUID %@ found on peripheral %@", uuid, peripheral.identifier.UUIDString], nil);
  }
  return service;
}

- (CBCharacteristic *)_getCharacteristicOrReject:(NSString *)uuid service:(CBService *)service characteristicProperties:(CBCharacteristicProperties)characteristicProperties reject:(EXPromiseRejectBlock)reject
{
  CBUUID *characteristicUUID = [CBUUID UUIDWithString:uuid];
  
  CBCharacteristic *characteristic = [self characteristicFromUUID:characteristicUUID service:service prop:characteristicProperties];
  
  if (characteristicProperties == CBCharacteristicPropertyNotify && !characteristic) {
    characteristic = [self characteristicFromUUID:characteristicUUID service:service prop:CBCharacteristicPropertyIndicate];
  }
  if (!characteristic) {
    characteristic = [self characteristicFromUUID:characteristicUUID service:service];
  }
  if (!characteristic) {
    NSString *errorMessage = [NSString stringWithFormat:@"Could not find characteristic with UUID %@ on service with UUID %@ on peripheral with UUID %@",
                              uuid,
                              service.UUID.UUIDString,
                              service.peripheral.identifier.UUIDString];
    reject(EXBluetoothErrorNoCharacteristic, errorMessage, nil);
  }
  
  return characteristic;
}

- (CBDescriptor *)_getDescriptorOrReject:(NSString *)uuid characteristic:(CBCharacteristic *)characteristic reject:(EXPromiseRejectBlock)reject
{
  CBDescriptor *descriptor = [self descriptorFromUUID:[CBUUID UUIDWithString:uuid] characteristic:characteristic];
  if (!descriptor) {
    NSString *errorMessage = [NSString stringWithFormat:@"Could not find descriptor with UUID %@ on characteristic with UUID %@ on service with UUID %@ on peripheral with UUID %@",
                              uuid,
                              characteristic.UUID.UUIDString,
                              characteristic.service.UUID.UUIDString,
                              characteristic.service.peripheral.identifier.UUIDString];
    
    reject(EXBluetoothErrorNoDescriptor, errorMessage, nil);
  }
  return descriptor;
}

- (BOOL)guardBluetoothEnabled:(EXPromiseRejectBlock)reject
{
  if (_manager.state < CBManagerStatePoweredOff) {
    reject(EXBluetoothErrorState, [NSString stringWithFormat:@"Bluetooth is unavailable: %@", _manager.state], nil);
    return true;
  }
  return false;
}

#pragma mark - Search

-(CBService *)serviceFromUUID:(CBUUID *)UUID peripheral:(CBPeripheral *)peripheral
{
  NSString *uuidString = UUID.UUIDString;
  
  for (CBService *service in peripheral.services) {
    if ([service.UUID.UUIDString isEqualToString:uuidString]) {
      return service;
    }
  }
  return nil;
}

- (CBCharacteristic *)characteristicFromUUID:(CBUUID *)UUID service:(CBService *)service prop:(CBCharacteristicProperties)prop
{
  NSString *uuidString = UUID.UUIDString;
  for (CBCharacteristic *characteristic in service.characteristics) {
    if ((characteristic.properties & prop) != 0x0 && [characteristic.UUID.UUIDString isEqualToString:uuidString]) {
      return characteristic;
    }
  }
  return nil;
}

- (CBCharacteristic *)characteristicFromUUID:(CBUUID *)UUID service:(CBService *)service
{
  NSString *uuidString = UUID.UUIDString;
  
  for (CBCharacteristic *characteristic in service.characteristics) {
    if ([characteristic.UUID.UUIDString isEqualToString:uuidString]) {
      return characteristic;
    }
  }
  return nil;
}

- (CBDescriptor *)descriptorFromUUID:(CBUUID *)UUID characteristic:(CBCharacteristic *)characteristic
{
  NSString *uuidString = UUID.UUIDString;
  
  for (CBDescriptor *descriptor in characteristic.descriptors) {
    if ([descriptor.UUID.UUIDString isEqualToString:uuidString]) {
      return descriptor;
    }
  }
  return nil;
}

#pragma mark - Bluetooth

-(void)discoverCharacteristics:(CBPeripheral *)peripheral forService:(CBService *)service {
  [peripheral discoverCharacteristics:nil forService:service];
}

-(void)discoverDescriptors:(CBPeripheral *)peripheral forCharacteristic:(CBCharacteristic *)characteristic {
  [peripheral discoverDescriptorsForCharacteristic:characteristic];
}

-(void)readValue:(CBPeripheral *)peripheral forCharacteristic:(CBCharacteristic *)characteristic {
  [peripheral readValueForCharacteristic:characteristic];
}

-(void)writeValue:(CBPeripheral *)peripheral forCharacteristic:(CBCharacteristic *)characteristic withValue: (NSData *)data {
  [peripheral writeValue:data forCharacteristic:characteristic type:CBCharacteristicWriteWithoutResponse];
}

-(void)writeValueWithResponse:(CBPeripheral *)peripheral forCharacteristic:(CBCharacteristic *)characteristic withValue: (NSData *)data {
  [peripheral writeValue:data forCharacteristic:characteristic type:CBCharacteristicWriteWithResponse];
}

-(void)enableNotify:(CBPeripheral *)peripheral forCharacteristic:(CBCharacteristic *)characteristic {
  [peripheral setNotifyValue:YES forCharacteristic:characteristic];
}

-(void)disableNotify:(CBPeripheral *)peripheral forCharacteristic:(CBCharacteristic *)characteristic {
  [peripheral setNotifyValue:NO forCharacteristic:characteristic];
}

-(void)readValue:(CBPeripheral *)peripheral forDescriptor:(CBDescriptor *)descriptor {
  [peripheral readValueForDescriptor:descriptor];
}

-(void)writeValue:(CBPeripheral *)peripheral forDescriptor:(CBDescriptor *)descriptor withValue: (NSData *)data {
  [peripheral writeValue:data forDescriptor:descriptor];
}

#pragma mark - CBCentralManagerDelegate

- (void)centralManagerDidUpdateState:(CBCentralManager *)central {
  if (central.state < CBManagerStatePoweredOff) {
    // All peripherals are now invalid.
    @synchronized(_peripherals) {
      for (NSString *key in _peripherals) {
        CBPeripheral *peripheral = _peripherals[key];
        [_manager cancelPeripheralConnection:peripheral];
        [_peripherals removeObjectForKey:key];
      }
    }
    
  }
  [self emit:EXBluetoothCentralDidUpdateStateEvent data:@{ EXBluetoothCentralKey: EXNullIfNil([self.class CBCentralManager_NativeToJSON:central])}];
}

- (void)centralManager:(CBCentralManager *)central didRetrieveConnectedPeripherals:(NSArray *)peripherals {
  [self emit:EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent data:@{
                                                                           EXBluetoothCentralKey: EXNullIfNil([self.class CBCentralManager_NativeToJSON:central]),
                                                                           
                                                                           EXBluetoothPeripheralsKey: EXNullIfNil([self.class CBPeripheralList_NativeToJSON:peripherals])}];
}

- (void)centralManager:(CBCentralManager *)central didRetrievePeripherals:(NSArray *)peripherals {
  [self emit:EXBluetoothCentralDidRetrievePeripheralsEvent data:@{
                                                                  EXBluetoothCentralKey: EXNullIfNil([self.class CBCentralManager_NativeToJSON:central]),
                                                                  EXBluetoothPeripheralsKey: EXNullIfNil([self.class CBPeripheralList_NativeToJSON:peripherals])} ];
}

- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary<NSString *,id> *)advertisementData
                  RSSI:(NSNumber *)RSSI
{
  @synchronized(_peripherals) {
    [_peripherals setObject:peripheral forKey:[[peripheral identifier] UUIDString]];
  }
  NSDictionary *peripheralData = [self.class CBPeripheral_NativeToJSON:peripheral];
  
  // TODO: Bacon: Roll all three items into one
  [self emit:EXBluetoothCentralDidDiscoverPeripheralEvent data:@{
                                                                 EXBluetoothCentralKey: EXNullIfNil([self.class CBCentralManager_NativeToJSON:central]),
                                                                 EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
                                                                 EXBluetoothAdvertisementDataKey: EXNullIfNil([self.class advertisementData_NativeToJSON:advertisementData]),
                                                                 // The current received signal strength indicator (RSSI) of the peripheral, in decibels.
                                                                 EXBluetoothRSSIKey: RSSI
                                                                 }];
}

- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral {
  peripheral.delegate = self;
  NSDictionary *peripheralData = [self.class CBPeripheral_NativeToJSON:peripheral];
  
  [self
   emit:EXBluetoothCentralDidConnectPeripheralEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"connect", peripheralData[@"id"]],
          EXBluetoothCentralKey: EXNullIfNil([self.class CBCentralManager_NativeToJSON:central]),
          EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
          }];
}

- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
  NSDictionary *peripheralData = [self.class CBPeripheral_NativeToJSON:peripheral];
  
  [self
   emit:EXBluetoothCentralDidDisconnectPeripheralEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"disconnect", peripheralData[@"id"]],
          EXBluetoothCentralKey: EXNullIfNil([self.class CBCentralManager_NativeToJSON:central]),
          EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
  NSDictionary *peripheralData = [self.class CBPeripheral_NativeToJSON:peripheral];
  [self
   emit:EXBluetoothCentralDidConnectPeripheralEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"connect", peripheralData[@"id"]],
          EXBluetoothCentralKey: EXNullIfNil([self.class CBCentralManager_NativeToJSON:central]),
          EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

#pragma mark - CBPeripheralDelegate

// TODO Bacon: add https://developer.apple.com/documentation/corebluetooth/cbperipheral/1519111-readrssi?language=objc RSSI
// discoverServicesAsync
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error {
  NSDictionary *peripheralData = [self.class CBPeripheral_NativeToJSON:peripheral];
  //TODO: Bacon: If this is only called once per invocation then we should change scan to get
  [self
   emit:EXBluetoothPeripheralDidDiscoverServicesEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"scan", peripheralData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
  
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error {
  NSDictionary *serviceData = [self.class CBService_NativeToJSON:service];
  
  [self
   emit:EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"scan", serviceData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
          EXBluetoothServiceKey: EXNullIfNil(serviceData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverDescriptorsForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [self.class CBCharacteristic_NativeToJSON:characteristic];
  
  [self
   emit:EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"scan", characteristicData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
          EXBluetoothCharacteristicKey: EXNullIfNil(characteristicData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [self.class CBCharacteristic_NativeToJSON:characteristic];
  
  [self
   emit:EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"read", characteristicData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
          EXBluetoothCharacteristicKey: EXNullIfNil(characteristicData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [self.class CBCharacteristic_NativeToJSON:characteristic];
  
  [self
   emit:EXBluetoothPeripheralDidWriteValueForCharacteristicEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"write", characteristicData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
          EXBluetoothCharacteristicKey: EXNullIfNil(characteristicData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [self.class CBCharacteristic_NativeToJSON:characteristic];
  
  [self
   emit:EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"read", characteristicData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
          EXBluetoothCharacteristicKey: EXNullIfNil(characteristicData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didReadRSSI:(nonnull NSNumber *)RSSI error:(nullable NSError *)error
{
  //   NSDictionary *peripheralData = [self.class CBPeripheral_NativeToJSON:peripheral];
  
  //   [self
  //    emit:EXBluetoothPeripheralDidReadRSSIEvent
  //    data:@{
  //           EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"rssi", peripheralData[@"id"]],
  //           @"rssi": RSSI,
  //           EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
  //           EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
  //           }];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error {
  NSDictionary *descriptorData = [self.class CBDescriptor_NativeToJSON:descriptor];
  
  [self
   emit:EXBluetoothPeripheralDidUpdateValueForDescriptorEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"read", descriptorData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
          EXBluetoothDescriptorKey: EXNullIfNil(descriptorData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error {
  NSDictionary *descriptorData = [self.class CBDescriptor_NativeToJSON:descriptor];
  [self
   emit:EXBluetoothPeripheralDidWriteValueForDescriptorEvent
   data:@{
          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"write", descriptorData[@"id"]],
          EXBluetoothPeripheralKey: EXNullIfNil([self.class CBPeripheral_NativeToJSON:peripheral]),
          EXBluetoothDescriptorKey: EXNullIfNil(descriptorData),
          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
          }];
}

- (CBUUID *)generateUUID:(NSString *)uuidString {
  NSString *outputString = uuidString;
  if (uuidString.length == 4) {
    outputString = [NSString stringWithFormat:@"0000%@-0000-1000-8000-00805f9b34fb", uuidString];
  } else if (uuidString.length == 8) {
    outputString = [NSString stringWithFormat:@"%@-0000-1000-8000-00805f9b34fb", uuidString];
  }
  return [CBUUID UUIDWithString:outputString];
}

@end

