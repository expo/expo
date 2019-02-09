// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXCore/EXEventEmitterService.h>
#import <EXBluetooth/EXBluetoothConstants.h>
#import <EXBluetooth/EXBluetoothCentralManager.h>

@interface EXBluetooth()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL isObserving;
@property (nonatomic, strong) EXBluetoothCentralManager *manager;

@end

@implementation EXBluetooth

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  
  if (_manager) {
    if ([_manager isScanning]) {
      [_manager stopScanWithBlock:^(EXBluetoothCentralManager *centralManager, BOOL isScanning) {
        
      }];
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
  // TODO: Bacon: Maybe add restoration ID
  _manager = [[EXBluetoothCentralManager alloc] initWithQueue:[self methodQueue] options:nil];
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  [self updateStateListener];
}

- (void)updateStateListener
{
  __weak EXBluetooth *weakSelf = self;
  [_manager setUpdateStateBlock:^(EXBluetoothCentralManager *centralManager) {
    if (weakSelf) {
      // TODO: Bacon: dont use [weakSelf emitFullState];
      [weakSelf emitFullState];
      [weakSelf
       emit:EXBluetoothCentralDidUpdateStateEvent
       data:@{
              EXBluetoothCentralKey: EXNullIfNil([[EXBluetooth class] EXBluetoothCentralManager_NativeToJSON:centralManager])
              }];
    }
  }];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"BLUETOOTH_EVENT": EXBluetoothEvent,
           @"CENTRAL_OPTIONS": @{
              @"SHOW_POWER_ALERT": CBCentralManagerOptionShowPowerAlertKey,
              @"RESTORE_IDENTIFIER": CBCentralManagerOptionRestoreIdentifierKey,
           },
           @"SCAN_OPTIONS": @{
               @"ALLOW_DUPLICATES": CBCentralManagerScanOptionAllowDuplicatesKey,
               @"SOLICITED_SERVICE_UUIDS": CBCentralManagerScanOptionSolicitedServiceUUIDsKey
               },
           @"CONNECT_PERIPHERAL_OPTIONS": @{
               @"NotifyOnConnection": CBConnectPeripheralOptionNotifyOnConnectionKey,
               @"NotifyOnDisconnection": CBConnectPeripheralOptionNotifyOnDisconnectionKey,
               @"NotifyOnNotification": CBConnectPeripheralOptionNotifyOnNotificationKey,
               @"StartDelay": CBConnectPeripheralOptionStartDelayKey
               },
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

- (void)emitFullState
{
    [self emit:@"UPDATE" data:@{
                                EXBluetoothCentralKey: EXNullIfNil([_manager getJSON]),
                                EXBluetoothPeripheralsKey: [EXBluetooth.class EXBluetoothPeripheralList_NativeToJSON:[_manager.discoveredPeripherals allValues]]
                                }];
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
  _manager = [[EXBluetoothCentralManager alloc] initWithQueue:[self methodQueue] options:options];
  [self updateStateListener];
  /*
   CBCentralManagerOptionShowPowerAlertKey
   CBCentralManagerOptionRestoreIdentifierKey
   */
  resolve(nil);
}

EX_EXPORT_METHOD_AS(deallocateManagerAsync,
                    deallocateManagerAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  //TODO: Bacon: Add
  resolve(nil);
}

EX_EXPORT_METHOD_AS(getPeripheralsAsync,
                    getPeripheralsAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  resolve([EXBluetooth.class EXBluetoothPeripheralList_NativeToJSON:[_manager.discoveredPeripherals allValues]]);
  [self emitFullState];
}

// TODO: Bacon: Use serviceUUIDStrings for Android parity
EX_EXPORT_METHOD_AS(getConnectedPeripheralsAsync,
                    getConnectedPeripheralsAsync:(NSArray<NSString *> *)serviceUUIDStrings
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }

  NSMutableArray *output = [NSMutableArray array];
  NSArray<EXBluetoothPeripheral *> *peripherals = [_manager.discoveredPeripherals allValues];
  @synchronized(peripherals) {
      for (CBPeripheral *peripheral in peripherals){
          if (peripheral.state == CBPeripheralStateConnected){
            [output addObject:[[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral]];
          }
      }
  }

  resolve([EXBluetooth.class EXBluetoothPeripheralList_NativeToJSON:output]);
//  [self emitFullState];
}

 
EX_EXPORT_METHOD_AS(getCentralAsync,
                    getCentralAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  resolve(EXNullIfNil([_manager getJSON]));
}

EX_EXPORT_METHOD_AS(startScanningAsync,
                    startScanningAsync:(NSArray<NSString *> *)serviceUUIDStrings
                    options:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  
  // TODO: Bacon: Should we stop
  if ([_manager isScanning]) {
    reject(EXBluetoothErrorScanning, @"Bluetooth is already scanning.", nil);
    return;
  }
  NSArray *serviceUUIDs = [EXBluetooth.class CBUUIDList_JSONToNative:serviceUUIDStrings];
  
  // SCAN_OPTIONS
  __weak EXBluetooth *weakSelf = self;
  [_manager scanForPeripheralsWithServices:serviceUUIDs options:options withScanningStateBlock:^(EXBluetoothCentralManager *centralManager, BOOL isScanning) {
    resolve(@(isScanning));
    if (weakSelf) {
      [weakSelf emitFullState];
    }
  } withBlock:^(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSDictionary *advertisementData, NSNumber *RSSI) {
    
    if (weakSelf) {
      NSDictionary *peripheralData = [peripheral getJSON];
      
      [weakSelf emit:EXBluetoothCentralDidDiscoverPeripheralEvent data:@{
                                                                         EXBluetoothCentralKey: EXNullIfNil([EXBluetooth.class EXBluetoothCentralManager_NativeToJSON:centralManager]),
                                                                         EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
                                                                         EXBluetoothAdvertisementDataKey: EXNullIfNil([EXBluetooth.class advertisementData_NativeToJSON:advertisementData]),
                                                                         // The current received signal strength indicator (RSSI) of the peripheral, in decibels.
                                                                         EXBluetoothRSSIKey: EXNullIfNil(RSSI)
                                                                         }];
      [weakSelf emitFullState];
    }
  }];
  
}

EX_EXPORT_METHOD_AS(stopScanningAsync,
                    stopScanningAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  [_manager stopScanWithBlock:^(EXBluetoothCentralManager *centralManager, BOOL isScanning) {
    [self emitFullState];
    resolve(@(isScanning));
  }];
  
}

EX_EXPORT_METHOD_AS(connectPeripheralAsync,
                    connectPeripheralAsync:(NSString *)peripheralUUID
                    options:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  
  EXBluetoothPeripheral *peripheral = [_manager getPeripheralOrReject:peripheralUUID reject:reject];
  if (!peripheral) {
    return;
  }

  [_manager connectPeripheral:peripheral
                      options:options
             withSuccessBlock:^(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error) {
               
               NSDictionary *peripheralData = [peripheral getJSON];
               [self emitFullState];

               if (error) {
                 reject(EXBluetoothErrorKey, error.localizedDescription, error);
               } else {
                 resolve(EXNullIfNil(peripheralData));
               }
               
               // TODO: Bacon: Legacy?
//               [self
//                emit:EXBluetoothCentralDidConnectPeripheralEvent
//                data:@{
//                       EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"connect", peripheralData[@"id"]],
//                       EXBluetoothCentralKey: EXNullIfNil([centralManager getJSON]),
//                       EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
//                       }];
  } withDisconnectBlock:^(EXBluetoothCentralManager *centralManager,
                          EXBluetoothPeripheral *peripheral,
                          NSError *error) {
    [self emitFullState];

    NSDictionary *peripheralData = [peripheral getJSON];
    
    // TODO: Bacon: Is this the best way to do this?
    [self
     emit:EXBluetoothCentralDidDisconnectPeripheralEvent
     data:@{
            EXBluetoothCentralKey: EXNullIfNil([centralManager getJSON]),
            EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
            EXBluetoothErrorKey: EXNullIfNil([EXBluetooth.class NSError_NativeToJSON:error])
            }];
  }];
  // CONNECT_PERIPHERAL_OPTIONS
//  [_manager connectPeripheral:peripheral options:options[@"options"]];
//  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(readRSSIAsync,
                    readRSSIAsync:(NSString *)peripheralUUID
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  
  EXBluetoothPeripheral *peripheral = [_manager getPeripheralOrReject:peripheralUUID reject:reject];
  if (!peripheral || [peripheral guardIsConnected:reject]) {
    return;
  }

  [peripheral readRSSI:^(EXBluetoothPeripheral *peripheral, NSNumber *RSSI, NSError *error) {
  
    peripheral.RSSI = RSSI;
    NSDictionary *peripheralData = [peripheral getJSON];
    
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      resolve(EXNullIfNil(peripheralData));
    }
    
//    if (weakSelf) {
//      [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
//    }
    // TODO: Bacon: Legacy?
//    [self
//     emit:EXBluetoothPeripheralDidReadRSSIEvent
//     data:@{
//            EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", EXBluetoothRSSIKey, peripheralData[@"id"]],
//            EXBluetoothRSSIKey: RSSI,
//            EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
//            }];
  }];
  
}

-(EXBluetoothService *)getServiceFromOptionsOrReject:(NSDictionary *)options reject:(EXPromiseRejectBlock)reject
{
  if ([_manager guardEnabled:reject]) {
    return nil;
  }
  EXBluetoothPeripheral *peripheral = [_manager getPeripheralOrReject:options[EXBluetoothPeripheralUUID] reject:reject];
  if (!peripheral || [peripheral guardIsConnected:reject]) {
    return nil;
  }
  
  EXBluetoothService *service = [peripheral getServiceOrReject:options[EXBluetoothServiceUUID] reject:reject];
  if (!service) {
    return nil;
  }
  return service;
}

-(EXBluetoothCharacteristic *)getCharacteristicFromOptionsOrReject:(NSDictionary *)options reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothService *service = [self getServiceFromOptionsOrReject:options reject:reject];
  if (!service) {
    return nil;
  }
  
  EXBluetoothCharacteristic *characteristic;
  if (options[@"characteristicProperties"]) {
    CBCharacteristicProperties characteristicProperties = [EXBluetooth.class CBCharacteristicProperties_JSONToNative:options[@"characteristicProperties"]];
    characteristic = [service getCharacteristicOrReject:options[EXBluetoothCharacteristicUUID] characteristicProperties:characteristicProperties reject:reject];
  } else {
    characteristic = [service getCharacteristicOrReject:options[EXBluetoothCharacteristicUUID] reject:reject];
  }
  
  if (!characteristic) {
    return nil;
  }
  return characteristic;
}

-(EXBluetoothDescriptor *)getDescriptorFromOptionsOrReject:(NSDictionary *)options reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothCharacteristic *characteristic = [self getCharacteristicFromOptionsOrReject:options reject:reject];
  if (!characteristic) {
    return nil;
  }
  
  EXBluetoothDescriptor *descriptor = [characteristic getDescriptorOrReject:options[EXBluetoothDescriptorUUID] reject:reject];
  if (!descriptor) {
    return nil;
  }
  return descriptor;
}

EX_EXPORT_METHOD_AS(readDescriptorAsync,
                    readDescriptorAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothDescriptor *descriptor = [self getDescriptorFromOptionsOrReject:options reject:reject];
  if (descriptor == nil) {
    return;
  }
  __weak EXBluetooth *weakSelf = self;

  [descriptor readValueForWithBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON]),
                EXBluetoothDescriptorKey: EXNullIfNil([descriptor getJSON])
                });
    }
  }];
}
EX_EXPORT_METHOD_AS(writeDescriptorAsync,
                    writeDescriptorAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  // TODO: CBCharacteristicPropertyWrite CBCharacteristicPropertyWriteWithoutResponse
  EXBluetoothDescriptor *descriptor = [self getDescriptorFromOptionsOrReject:options reject:reject];
  if (descriptor == nil) {
    return;
  }
  
  NSData *data = [self _getDataOrReject:options[EXBluetoothDataKey] reject:reject];
  if (!data) {
    return;
  }
  __weak EXBluetooth *weakSelf = self;

  [descriptor writeValue:data withBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON]),
                EXBluetoothDescriptorKey: EXNullIfNil([descriptor getJSON])
                });
    }
  }];
}

EX_EXPORT_METHOD_AS(writeCharacteristicAsync,
                    writeCharacteristicAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  // TODO: CBCharacteristicPropertyWrite CBCharacteristicPropertyWriteWithoutResponse
  EXBluetoothCharacteristic *characteristic = [self getCharacteristicFromOptionsOrReject:options reject:reject];
  if (characteristic == nil) {
    return;
  }
  
  NSData *data = [self _getDataOrReject:options[EXBluetoothDataKey] reject:reject];
  if (!data) {
    return;
  }
  __weak EXBluetooth *weakSelf = self;
  [characteristic writeValue:data type:CBCharacteristicWriteWithResponse withBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
      if (error) {
        reject(EXBluetoothErrorKey, error.localizedDescription, error);
      } else {
        if (weakSelf) {
          [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
          [weakSelf emitFullState];
        }
        resolve(@{
                  EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON]),
                  EXBluetoothCharacteristicKey: EXNullIfNil([characteristic getJSON])
                  });
      }
  }];
}

EX_EXPORT_METHOD_AS(readCharacteristicAsync,
                    readCharacteristicAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothCharacteristic *characteristic = [self getCharacteristicFromOptionsOrReject:options reject:reject];
  if (characteristic == nil) {
    return;
  }
  __weak EXBluetooth *weakSelf = self;

  [characteristic readValueWithBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON]),
                EXBluetoothCharacteristicKey: EXNullIfNil([characteristic getJSON])
                });
    }
  }];
}

EX_EXPORT_METHOD_AS(setNotifyCharacteristicAsync,
                    setNotifyCharacteristicAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  // TODO: CBCharacteristicPropertyWrite CBCharacteristicPropertyWriteWithoutResponse
  EXBluetoothCharacteristic *characteristic = [self getCharacteristicFromOptionsOrReject:options reject:reject];
  if (characteristic == nil) {
    return;
  }
  BOOL shouldNotify = [options[@"shouldNotify"] boolValue];
  __weak EXBluetooth *weakSelf = self;

  [characteristic setNotifyValue:shouldNotify withBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON]),
                EXBluetoothCharacteristicKey: EXNullIfNil([characteristic getJSON])
                });
    }
  }];
}


/*
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
 */

// Bacon: Predict the following, and throw an error without crashing the app.
// TODO: Bacon: Can we try to auto-resolve this
- (BOOL)guardCharacteristicConfiguration:(CBDescriptor *)descriptor reject:(EXPromiseRejectBlock)reject
{
  if ([descriptor.UUID.UUIDString isEqualToString:CBUUIDClientCharacteristicConfigurationString]) {
    reject(EXBluetoothErrorWrite, [NSString stringWithFormat:@"Client Characteristic Configuration descriptors must be configured using setNotifyValue:forCharacteristic: | Descriptor UUID: %@ | Expected: %@", descriptor.UUID.UUIDString, CBUUIDClientCharacteristicConfigurationString], nil);
    return YES;
  }
  return NO;
}

EX_EXPORT_METHOD_AS(discoverDescriptorsForCharacteristicAsync,
                    discoverDescriptorsForCharacteristicAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothCharacteristic *characteristic = [self getCharacteristicFromOptionsOrReject:options reject:reject];
  if (characteristic == nil) {
    return;
  }
  
  __weak EXBluetooth *weakSelf = self;

  [characteristic discoverDescriptorsWithBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothCharacteristicKey: EXNullIfNil([characteristic getJSON]),
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON])
                });
    }
  }];
}

EX_EXPORT_METHOD_AS(discoverCharacteristicsForServiceAsync,
                    discoverCharacteristicsForServiceAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothService *service = [self getServiceFromOptionsOrReject:options reject:reject];
  if (service == nil) {
    return;
  }
  
  NSArray *characteristicUUIDs = [EXBluetooth.class CBUUIDList_JSONToNative:options[@"characteristicUUIDs"]];
  __weak EXBluetooth *weakSelf = self;

  [service discoverCharacteristics:characteristicUUIDs withBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothServiceKey: EXNullIfNil([service getJSON]),
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON])
                });
    }
  }];
}

EX_EXPORT_METHOD_AS(discoverIncludedServicesForServiceAsync,
                    discoverIncludedServicesForServiceAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothService *service = [self getServiceFromOptionsOrReject:options reject:reject];
  if (service == nil) {
    return;
  }
  
  NSArray *includedServicesUUIDs = [EXBluetooth.class CBUUIDList_JSONToNative:options[@"includedServicesUUIDs"]];
  __weak EXBluetooth *weakSelf = self;

  [service discoverIncludedServices:includedServicesUUIDs withBlock:^(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothServiceKey: EXNullIfNil([service getJSON]),
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON])
                });
    }
  }];
}

EX_EXPORT_METHOD_AS(discoverServicesForPeripheralAsync,
                    discoverServicesForPeripheralAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  EXBluetoothPeripheral *peripheral = [_manager getPeripheralOrReject:options[EXBluetoothPeripheralUUID] reject:reject];
  if (!peripheral || [peripheral guardIsConnected:reject]) {
    return;
  }
  
  NSArray *serviceUUIDs = [EXBluetooth.class CBUUIDList_JSONToNative:options[EXBluetoothServiceUUIDsKey]];
  __weak EXBluetooth *weakSelf = self;

  [peripheral discoverServices:serviceUUIDs withBlock:^(EXBluetoothPeripheral *peripheral, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      if (weakSelf) {
        [weakSelf.manager updateLocalPeripheralStore:peripheral.peripheral];
        [weakSelf emitFullState];
      }
      resolve(@{
                EXBluetoothPeripheralKey: EXNullIfNil([peripheral getJSON])
                });
    }
  }];
}

EX_EXPORT_METHOD_AS(disconnectPeripheralAsync,
                    disconnectPeripheralAsync:(NSString *)peripheralUUID
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([_manager guardEnabled:reject]) {
    return;
  }
  EXBluetoothPeripheral *peripheral = [_manager getPeripheralOrReject:peripheralUUID reject:reject];
  if (!peripheral) {
    return;
  }
  [_manager cancelPeripheralConnection:peripheral withBlock:^(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error) {
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      resolve(EXNullIfNil([peripheral getJSON]));
    }
  }];
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

- (BOOL)guardBluetoothEnabled:(EXPromiseRejectBlock)reject
{
  if (_manager.state < CBManagerStatePoweredOff) {
    NSString *state = [[self class] CBManagerState_NativeToJSON:_manager.state];
    reject(EXBluetoothErrorState, [NSString stringWithFormat:@"Bluetooth is unavailable. Manager state: %@", state], nil);
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

#pragma mark - CBPeripheralDelegate


- (void)peripheralDidUpdateName:(CBPeripheral *)peripheral
{
  // This method is invoked when the @link name @/link of <i>peripheral</i> changes.
}

- (void)peripheral:(CBPeripheral *)peripheral didModifyServices:(NSArray<CBService *> *)invalidatedServices
{
  //  This method is invoked when the services of a peripheral have been changed. At this point, the designated `CBService` objects have been invalidated. Services can be re-discovered via `discoverServices:`.
  
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverIncludedServicesForService:(CBService *)service error:(nullable NSError *)error
{
  //  This method returns the result of a `discoverIncludedServices:forService:` call. If the included service(s) were read successfully, they can be retrieved via `service`'s `includedServices` property.
//  [self
//   emit:EXBluetoothPeripheralDidDiscoverServicesEvent
//   data:@{
//          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"scan", peripheralData[@"id"]],
//          EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
//          EXBluetoothErrorKey: EXNullIfNil([self.class NSError_NativeToJSON:error])
//          }];
}

- (void)peripheralIsReadyToSendWriteWithoutResponse:(CBPeripheral *)peripheral
{
  // This method is invoked after a failed call to @link writeValue:forCharacteristic:type: @/link, when <i>peripheral</i> is again ready to send characteristic value updates.
}

- (void)peripheral:(CBPeripheral *)peripheral didOpenL2CAPChannel:(nullable CBL2CAPChannel *)channel error:(nullable NSError *)error
API_AVAILABLE(ios(11.0)) {
  //  This method returns the result of a @link openL2CAPChannel: @link call.
  
  //  [self.class CBL2CAPChannel_NativeToJSON:channel];
  //  [self.class NSError_NativeToJSON:error];
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
