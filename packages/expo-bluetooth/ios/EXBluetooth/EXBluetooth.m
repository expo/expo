// Copyright 2018-present 650 Industries. All rights reserved.
#import <EXBluetooth/EXBluetooth.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXCore/EXEventEmitterService.h>

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

NSString *const EXBluetoothCentral = @"central";
NSString *const EXBluetoothPeripheral = @"peripheral";
NSString *const EXBluetoothEventKey = @"event";
NSString *const EXBluetoothDataKey = @"data";

@interface EXBluetooth()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

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
//    for (NSString *key in _peripherals) {
//      CBPeripheral *peripheral = _peripherals[key];
//      [_manager cancelPeripheralConnection:peripheral];
//      [_peripherals removeObjectForKey:key];
//    }
    
    if ([_manager isScanning]) {
         [_manager stopScan];
    }
    
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
  _manager = [[CBCentralManager alloc] initWithDelegate:self queue:nil options:nil];
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"BLUETOOTH_EVENT": EXBluetoothEvent,
           @"Events": @{
               @"CENTRAL_DID_UPDATE_STATE_EVENT": EXBluetoothCentralDidUpdateStateEvent,
               @"CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS_EVENT": EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent,
               @"CENTRAL_DID_RETRIEVE_PERIPHERALS_EVENT": EXBluetoothCentralDidRetrievePeripheralsEvent,
               @"CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT": EXBluetoothCentralDidDiscoverPeripheralEvent,
               @"CENTRAL_DID_CONNECT_PERIPHERAL_EVENT": EXBluetoothCentralDidConnectPeripheralEvent,
               @"CENTRAL_DID_DISCONNECT_PERIPHERAL_EVENT": EXBluetoothCentralDidDisconnectPeripheralEvent,
               @"PERIPHERAL_DID_DISCOVER_SERVICES_EVENT": EXBluetoothPeripheralDidDiscoverServicesEvent,
               @"PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE_EVENT": EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent,
               @"PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC_EVENT": EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent,
               @"PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC_EVENT": EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent,
               @"PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC_EVENT": EXBluetoothPeripheralDidWriteValueForCharacteristicEvent,
               @"PERIPHERAL_DID_UPDATE_NOTIFICATION_STATE_FOR_CHARACTERISTIC_EVENT": EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent,
               @"PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR_EVENT": EXBluetoothPeripheralDidUpdateValueForDescriptorEvent,
               @"PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR_EVENT": EXBluetoothPeripheralDidWriteValueForDescriptorEvent
               }
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXBluetoothEvent];
}

- (void)startObserving {
  
}

- (void)stopObserving {
  
}

- (void)emit:(NSString *)eventName data:(NSDictionary *)data
{
  [_eventEmitter
   sendEventWithName:EXBluetoothEvent
   body:@{
          EXBluetoothEventKey: eventName,
          EXBluetoothDataKey: EXNullIfNil(data)
          }];
}

EX_EXPORT_METHOD_AS(getPeripheralsAsync,
                    getPeripheralsAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  resolve([[self class] CBPeripheralList_NativeToJSON:[_peripherals allValues]]);
}

EX_EXPORT_METHOD_AS(getCentralAsync,
                    getCentralAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  resolve([[self class] CBCentralManager_NativeToJSON:_manager]);
}

EX_EXPORT_METHOD_AS(startScanAsync,
                    startScanAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  NSArray *serviceUUIDs = [[self class] CBUUIDList_JSONToNative:options[@"serviceUUIDs"]];
  NSDictionary *scanOptions = options[@"options"];
  [_manager scanForPeripheralsWithServices:serviceUUIDs options:scanOptions];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(stopScanAsync,
                    stopScanAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [_manager stopScan];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(connectAsync,
                    connectAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"uuid"] reject:reject];
  if (!peripheral) return;
  
  // TODO: Bacon: Convert the options to native
  [_manager connectPeripheral:peripheral options:options[@"options"]];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(readRSSIAsync,
                    readRSSIAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"uuid"] reject:reject];
  if (!peripheral) return;
  
  [peripheral readRSSI];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(updateAsync,
                    updateAsync:(NSDictionary *)options
                     resolve:(EXPromiseResolveBlock)resolve
                     reject:(EXPromiseRejectBlock)reject)
{
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"peripheralUUID"] reject:reject];
  if (!peripheral) return;
  
  CBService *service = [self _getServiceOrReject:options[@"serviceUUID"] peripheral:peripheral reject:reject];
  if (!service) return;
  
  CBCharacteristicProperties prop = [options[@"characteristicProperties"] integerValue];

  CBCharacteristic *characteristic = [self _getCharacteristicOrReject:options[@"characteristicUUID"] service:service characteristicProperties:prop reject:reject];
  if (!characteristic) return;
  
  NSString *operation = [options[@"operation"] stringValue];
  
  NSString *descriptorUUIDString = options[@"descriptorUUID"];
  
  if (descriptorUUIDString != nil && ![descriptorUUIDString isEqualToString:@""]) {
    CBDescriptor *descriptor = [self _getDescriptorOrReject:descriptorUUIDString characteristic:characteristic reject:reject];
    if (!descriptor) return;
    
    if ([operation isEqualToString:@"read"]) {
      [peripheral readValueForDescriptor:descriptor];
    } else {
      NSData *data = [[NSData alloc] initWithBase64EncodedString:options[@"data"] options:NSDataBase64DecodingIgnoreUnknownCharacters];
      if (!data) {
        reject(@"E_INVALID_FORMAT", @"Failed to parse base64 string.", nil);
        return;
      }
      [peripheral writeValue:data forDescriptor:descriptor];
    }
  } else {
    if ([operation isEqualToString:@"read"]) {
      [peripheral readValueForCharacteristic:characteristic];
    } else {
      CBCharacteristicWriteType writeType = CBCharacteristicWriteWithResponse;
      if (options[@"shouldMute"] != nil && [options[@"shouldMute"] boolValue] == YES) {
        writeType = CBCharacteristicWriteWithoutResponse;
      }
      
      NSData *data = [[NSData alloc] initWithBase64EncodedString:options[@"data"] options:NSDataBase64DecodingIgnoreUnknownCharacters];
      if (!data) {
        reject(@"E_INVALID_FORMAT", @"Failed to parse base64 string.", nil);
        return;
      }
      [peripheral writeValue:data forCharacteristic:characteristic type:writeType];
    }
  }
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(disconnectAsync,
                    disconnectAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"uuid"] reject:reject];
  if (!peripheral) return;
  
  [_manager cancelPeripheralConnection:peripheral];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(discover,
                    discover:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  NSArray *serviceUUIDs = [[self class] CBUUIDList_JSONToNative:options[@"serviceUUIDs"]];

  CBPeripheral *peripheral = [self _getPeripheralOrReject:options[@"peripheralUUID"] reject:reject];
  if (!peripheral) return;
  
  NSString *serviceUUIDString = options[@"serviceUUID"];

  if (!serviceUUIDString) {
    [peripheral discoverServices:serviceUUIDs];
    resolve([NSNull null]);
    return;
  }
  
  CBService *service = [self _getServiceOrReject:serviceUUIDString peripheral:peripheral reject:reject];
  if (!service) return;
  
  NSString *characteristicUUIDString = options[@"characteristicUUID"];

  if (!characteristicUUIDString) {
    [peripheral discoverCharacteristics:serviceUUIDs forService:service];
    resolve([NSNull null]);
    return;
  }
  
  CBCharacteristicProperties prop = [options[@"characteristicProperties"] integerValue];
  
  CBCharacteristic *characteristic = [self _getCharacteristicOrReject:characteristicUUIDString service:service characteristicProperties:prop reject:reject];
  if (!characteristic) return;

  [peripheral discoverDescriptorsForCharacteristic:characteristic];
  resolve([NSNull null]);
}

#pragma mark - Get Async

- (CBPeripheral *)_getPeripheralOrReject:(NSString *)uuid reject:(EXPromiseRejectBlock)reject
{
  CBPeripheral *peripheral = [_peripherals objectForKey:uuid];
  if (!peripheral) {
    reject(@"ERR_NO_PERIPHERAL", [NSString stringWithFormat:@"No valid peripheral with UUID %@", uuid], nil);
  }
  return peripheral;
}

- (CBService *)_getServiceOrReject:(NSString *)uuid peripheral:(CBPeripheral *)peripheral reject:(EXPromiseRejectBlock)reject
{
  CBUUID *serviceUUID = [CBUUID UUIDWithString:uuid];
  CBService *service = [self serviceFromUUID:serviceUUID peripheral:peripheral];
  if (!service) {
    reject(@"ERR_NO_SERVICE", [NSString stringWithFormat:@"No valid service with UUID %@ found on peripheral %@", uuid, peripheral.identifier.UUIDString], nil);
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
    reject(@"ERR_NO_CHARACTERISTIC", errorMessage, nil);
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
    
    reject(@"ERR_NO_DESCRIPTOR", errorMessage, nil);
  }
  return descriptor;
}

#pragma mark - Search

-(CBService *)serviceFromUUID:(CBUUID *)UUID peripheral:(CBPeripheral *)peripheral
{
  for (CBService *service in peripheral.services) {
    if ([service.UUID.UUIDString isEqualToString:UUID.UUIDString]) {
      return service;
    }
  }
  return nil;
}

- (CBCharacteristic *)characteristicFromUUID:(CBUUID *)UUID service:(CBService *)service prop:(CBCharacteristicProperties)prop
{
  for (CBCharacteristic *characteristic in service.characteristics) {
    if ((characteristic.properties & prop) != 0x0 && [characteristic.UUID.UUIDString isEqualToString: UUID.UUIDString]) {
      return characteristic;
    }
  }
  return nil;
}

- (CBCharacteristic *)characteristicFromUUID:(CBUUID *)UUID service:(CBService *)service
{
  for (CBCharacteristic *characteristic in service.characteristics) {
    if ([characteristic.UUID.UUIDString isEqualToString: UUID.UUIDString]) {
      return characteristic;
    }
  }
  return nil;
}

- (CBDescriptor *)descriptorFromUUID:(CBUUID *)UUID characteristic:(CBCharacteristic *)characteristic
{
  for (CBDescriptor *descriptor in characteristic.descriptors) {
    if ([descriptor.UUID.UUIDString isEqualToString: UUID.UUIDString]) {
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
  [self emit:EXBluetoothCentralDidUpdateStateEvent data:@{ @"central": EXNullIfNil([[self class] CBCentralManager_NativeToJSON:central])}];
}

- (void)centralManager:(CBCentralManager *)central didRetrieveConnectedPeripherals:(NSArray *)peripherals {
  [self emit:EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent data:@{
                                                                           @"central": EXNullIfNil([[self class] CBCentralManager_NativeToJSON:central]),

                                                                           @"peripherals": EXNullIfNil([[self class] CBPeripheralList_NativeToJSON:peripherals])}];
}

- (void)centralManager:(CBCentralManager *)central didRetrievePeripherals:(NSArray *)peripherals {
  [self emit:EXBluetoothCentralDidRetrievePeripheralsEvent data:@{
                                                                  @"central": EXNullIfNil([[self class] CBCentralManager_NativeToJSON:central]),
                                                                  @"peripherals": EXNullIfNil([[self class] CBPeripheralList_NativeToJSON:peripherals])} ];
}

- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary<NSString *,id> *)advertisementData
                  RSSI:(NSNumber *)RSSI
{
  [_peripherals setObject:peripheral forKey:[[peripheral identifier] UUIDString]];
  NSDictionary *peripheralData = [[self class] CBPeripheral_NativeToJSON:peripheral];

  // TODO: Bacon: Roll all three items into one
  [self emit:EXBluetoothCentralDidDiscoverPeripheralEvent data:@{
                                                                 @"central": EXNullIfNil([[self class] CBCentralManager_NativeToJSON:central]),
                                                                 @"peripheral": EXNullIfNil(peripheralData),
                                                                 @"advertisementData": EXNullIfNil([[self class] advertisementData_NativeToJSON:advertisementData]),
                                                                 // The current received signal strength indicator (RSSI) of the peripheral, in decibels.
                                                                 @"rssi": RSSI
                                                                 }];
}

- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral {
  peripheral.delegate = self;
  NSDictionary *peripheralData = [[self class] CBPeripheral_NativeToJSON:peripheral];

  [self
   emit:EXBluetoothCentralDidConnectPeripheralEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"connect", peripheralData[@"id"]],
          @"central": EXNullIfNil([[self class] CBCentralManager_NativeToJSON:central]),
          @"peripheral": EXNullIfNil(peripheralData),
          }];
}

- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
  [self
   emit:EXBluetoothCentralDidDisconnectPeripheralEvent
   data:@{
          @"central": EXNullIfNil([[self class] CBCentralManager_NativeToJSON:central]),
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
  NSDictionary *peripheralData = [[self class] CBPeripheral_NativeToJSON:peripheral];
  [self
   emit:EXBluetoothCentralDidConnectPeripheralEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"connect", peripheralData[@"id"]],
          @"central": EXNullIfNil([[self class] CBCentralManager_NativeToJSON:central]),
          @"peripheral": EXNullIfNil(peripheralData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

#pragma mark - CBPeripheralDelegate

// TODO Bacon: add https://developer.apple.com/documentation/corebluetooth/cbperipheral/1519111-readrssi?language=objc RSSI
// discoverServicesAsync
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error {
  NSDictionary *peripheralData = [[self class] CBPeripheral_NativeToJSON:peripheral];
  //TODO: Bacon: If this is only called once per invocation then we should change scan to get
  [self
   emit:EXBluetoothPeripheralDidDiscoverServicesEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"scan", peripheralData[@"id"]],
          @"peripheral": EXNullIfNil(peripheralData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
  
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error {
  NSDictionary *serviceData = [[self class] CBService_NativeToJSON:service];

  [self
   emit:EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"scan", serviceData[@"id"]],
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"service": EXNullIfNil(serviceData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverDescriptorsForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [[self class] CBCharacteristic_NativeToJSON:characteristic];

  [self
   emit:EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"scan", characteristicData[@"id"]],
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"characteristic": EXNullIfNil(characteristicData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [[self class] CBCharacteristic_NativeToJSON:characteristic];

  [self
   emit:EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"read", characteristicData[@"id"]],
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"characteristic": EXNullIfNil(characteristicData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [[self class] CBCharacteristic_NativeToJSON:characteristic];

  [self
   emit:EXBluetoothPeripheralDidWriteValueForCharacteristicEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"write", characteristicData[@"id"]],
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"characteristic": EXNullIfNil(characteristicData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
  NSDictionary *characteristicData = [[self class] CBCharacteristic_NativeToJSON:characteristic];

  [self
   emit:EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"read", characteristicData[@"id"]],
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"characteristic": EXNullIfNil(characteristicData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error {
  NSDictionary *descriptorData = [[self class] CBDescriptor_NativeToJSON:descriptor];

  [self
   emit:EXBluetoothPeripheralDidUpdateValueForDescriptorEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"read", descriptorData[@"id"]],
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"descriptor": EXNullIfNil(descriptorData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error {
  NSDictionary *descriptorData = [[self class] CBDescriptor_NativeToJSON:descriptor];
  [self
   emit:EXBluetoothPeripheralDidWriteValueForDescriptorEvent
   data:@{
          @"transactionId": [NSString stringWithFormat:@"%@|%@", @"write", descriptorData[@"id"]],
          @"peripheral": EXNullIfNil([[self class] CBPeripheral_NativeToJSON:peripheral]),
          @"descriptor": EXNullIfNil(descriptorData),
          @"error": EXNullIfNil([[self class] NSError_NativeToJSON:error])
          }];
}

- (CBUUID *)generateUUID:(NSString *)uuidString {
  NSString *outputString = uuidString;
  if ([uuidString length] == 4) {
    outputString = [NSString stringWithFormat:@"0000%@-0000-1000-8000-00805f9b34fb", uuidString];
  } else if ([uuidString length] == 8) {
    outputString = [NSString stringWithFormat:@"%@-0000-1000-8000-00805f9b34fb", uuidString];
  }
  CBUUID *uuid = [CBUUID UUIDWithString:outputString];
  return uuid;
}

@end

