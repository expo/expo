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
      
      [_manager stopScanWithCallback:^(EXBluetoothCentralManager *centralManager, BOOL isScanning) {
        
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
  [_manager setOnDidUpdateState:^(EXBluetoothCentralManager *centralManager) {
    if (weakSelf) {
      // TODO: Bacon: dont use [weakSelf emitFullState];
      [weakSelf emitFullState];
      [weakSelf
       emit:EXBluetoothEvent_CENTRAL_STATE_CHANGED
       data:@{
              EXBluetoothCentralKey: EXNullIfNil([EXBluetooth EXBluetoothCentralManagerNativeToJSON:centralManager])
              }];
    }
  }];
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
           @"EVENTS": @{
               @"UPDATE_STATE": EXBluetoothEvent_UPDATE_STATE,
               @"CENTRAL_SCAN_STARTED": EXBluetoothEvent_CENTRAL_SCAN_STARTED,
               @"CENTRAL_SCAN_STOPPED": EXBluetoothEvent_CENTRAL_SCAN_STOPPED,
               @"CENTRAL_STATE_CHANGED": EXBluetoothEvent_CENTRAL_STATE_CHANGED,
               @"CENTRAL_DISCOVERED_PERIPHERAL": EXBluetoothEvent_CENTRAL_DISCOVERED_PERIPHERAL,
               @"PERIPHERAL_DISCOVERED_SERVICES": EXBluetoothEvent_PERIPHERAL_DISCOVERED_SERVICES,
               @"PERIPHERAL_CONNECTED": EXBluetoothEvent_PERIPHERAL_CONNECTED,
               @"PERIPHERAL_DISCONNECTED": EXBluetoothEvent_PERIPHERAL_DISCONNECTED,
               @"SERVICE_DISCOVERED_INCLUDED_SERVICES": EXBluetoothEvent_SERVICE_DISCOVERED_INCLUDED_SERVICES,
               @"SERVICE_DISCOVERED_CHARACTERISTICS": EXBluetoothEvent_SERVICE_DISCOVERED_CHARACTERISTICS,
               @"CHARACTERISTIC_DISCOVERED_DESCRIPTORS": EXBluetoothEvent_CHARACTERISTIC_DISCOVERED_DESCRIPTORS,
               @"CHARACTERISTIC_DID_WRITE": EXBluetoothEvent_CHARACTERISTIC_DID_WRITE,
               @"CHARACTERISTIC_DID_READ": EXBluetoothEvent_CHARACTERISTIC_DID_READ,
               @"CHARACTERISTIC_DID_NOTIFY": EXBluetoothEvent_CHARACTERISTIC_DID_NOTIFY,
               @"DESCRIPTOR_DID_WRITE": EXBluetoothEvent_DESCRIPTOR_DID_WRITE,
               @"DESCRIPTOR_DID_READ": EXBluetoothEvent_DESCRIPTOR_DID_READ,
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
  [self emit:EXBluetoothEvent_UPDATE_STATE data:@{
                              EXBluetoothCentralKey: EXNullIfNil([_manager getJSON]),
                              EXBluetoothPeripheralsKey: [EXBluetooth EXBluetoothPeripheralListNativeToJSON:[_manager.discoveredPeripherals allValues]]
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

EX_EXPORT_METHOD_AS(initAsync,
                    initAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  NSDictionary *nativeOptions = [EXBluetooth centralManagerOptionsJSONToNative:options];
  _manager = [[EXBluetoothCentralManager alloc] initWithQueue:[self methodQueue] options:nativeOptions];
  [self updateStateListener];
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
  
  resolve([EXBluetooth EXBluetoothPeripheralListNativeToJSON:[_manager.discoveredPeripherals allValues]]);
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
  
  resolve([EXBluetooth EXBluetoothPeripheralListNativeToJSON:output]);
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

EX_EXPORT_METHOD_AS(getPeripheralAsync,
                    getPeripheralAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothPeripheral *peripheral = [self getPeripheralFromOptionsOrReject:options reject:reject];
  if (!peripheral) {
    return;
  }
  
  resolve([EXBluetooth EXBluetoothPeripheralNativeToJSON:peripheral]);
}

EX_EXPORT_METHOD_AS(getServiceAsync,
                    getServiceAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothService *service = [self getServiceFromOptionsOrReject:options reject:reject];
  if (!service) {
    return;
  }
  
  resolve([EXBluetooth EXBluetoothServiceNativeToJSON:service]);
}

EX_EXPORT_METHOD_AS(getCharacteristicAsync,
                    getCharacteristicAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothCharacteristic *characteristic = [self getCharacteristicFromOptionsOrReject:options reject:reject];
  if (!characteristic) {
    return;
  }
  
  resolve([EXBluetooth EXBluetoothCharacteristicNativeToJSON:characteristic]);
}

EX_EXPORT_METHOD_AS(getDescriptorAsync,
                    getDescriptorAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXBluetoothDescriptor *descriptor = [self getDescriptorFromOptionsOrReject:options reject:reject];
  if (!descriptor) {
    return;
  }
  
  resolve([EXBluetooth EXBluetoothDescriptorNativeToJSON:descriptor]);
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
    reject(@"ERR_SCAN_REDUNDANT_INIT", @"Bluetooth is already scanning.", nil);
    return;
  }
  NSArray *serviceUUIDs = [EXBluetooth CBUUIDListJSONToNative:serviceUUIDStrings];
  NSDictionary *nativeOptions = [EXBluetooth ScanningOptionsJSONToNative:options];
  
  __weak EXBluetooth *weakSelf = self;
  [_manager scanForPeripheralsWithServices:serviceUUIDs options:nativeOptions withDidChangeScanningStateCallback:^(EXBluetoothCentralManager *centralManager, BOOL isScanning) {
    resolve(@(isScanning));
    if (weakSelf) {
      // TODO: Bacon: We emit on android when we start scanning. Figure out parity
      [weakSelf emitFullState];
    }
  } withDidDiscoverPeripheralCallback:^(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSDictionary *advertisementData, NSNumber *RSSI) {
    
    if (weakSelf) {
      NSDictionary *peripheralData = [peripheral getJSON];
      
      [weakSelf emit:EXBluetoothEvent_CENTRAL_DISCOVERED_PERIPHERAL data:@{
                                                                           EXBluetoothCentralKey: EXNullIfNil([EXBluetooth EXBluetoothCentralManagerNativeToJSON:centralManager]),
                                                                           EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
                                                                           EXBluetoothAdvertisementDataKey: EXNullIfNil([EXBluetooth advertisementDataNativeToJSON:advertisementData]),
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
  [_manager stopScanWithCallback:^(EXBluetoothCentralManager *centralManager, BOOL isScanning) {
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
  
  NSDictionary *nativeOptions = [EXBluetooth peripheralConnectionOptionsJSONToNative:options];
  [_manager connectPeripheral:peripheral options:nativeOptions withDidConnectPeripheralCallback:^(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error) {
    
    NSDictionary *peripheralData = [peripheral getJSON];
    [self emitFullState];
    
    if (error) {
      reject(EXBluetoothErrorKey, error.localizedDescription, error);
    } else {
      resolve(EXNullIfNil(peripheralData));
    }
    
  } withDidDisconnectPeripheralCallback:^(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error) {
    [self emitFullState];
    
    NSDictionary *peripheralData = [peripheral getJSON];
    
    // TODO: Bacon: Is this the best way to do this?
    [self
     emit:EXBluetoothEvent_PERIPHERAL_DISCONNECTED
     data:@{
            EXBluetoothCentralKey: EXNullIfNil([centralManager getJSON]),
            EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
            EXBluetoothErrorKey: EXNullIfNil([EXBluetooth NSErrorNativeToJSON:error])
            }];
  }];
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
  }];
  
}

-(EXBluetoothPeripheral *)getPeripheralFromOptionsOrReject:(NSDictionary *)options reject:(EXPromiseRejectBlock)reject
{
  if ([_manager guardEnabled:reject]) {
    return nil;
  }
  EXBluetoothPeripheral *peripheral = [_manager getPeripheralOrReject:options[EXBluetoothPeripheralUUID] reject:reject];
  if (!peripheral) {
    return nil;
  }
  return peripheral;
}

-(EXBluetoothService *)getServiceFromOptionsOrReject:(NSDictionary *)options reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothPeripheral *peripheral = [self getPeripheralFromOptionsOrReject:options reject:reject];
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
    // TODO: Bacon: CBCharacteristicPropertiesListJSONToNative
    CBCharacteristicProperties characteristicProperties = [EXBluetooth CBCharacteristicPropertiesJSONToNative:options[@"characteristicProperties"]];
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
  [descriptor readValueForWithReadValueForDescriptorsCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error) {
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
  
  [descriptor writeValue:data withWriteValueForDescriptorsCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothDescriptor *descriptor, NSError *error) {
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
  [characteristic writeValue:data type:CBCharacteristicWriteWithResponse withWriteValueForCharacteristicsCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
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
  
  [characteristic readValueWithReadValueForCharacteristicCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
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
  
  [characteristic setNotifyValue:shouldNotify withNotifyValueForCharacteristicsCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
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
  
  [characteristic discoverDescriptorsWithDiscoverDescriptorsForCharacteristicCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothCharacteristic *characteristic, NSError *error) {
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
  
  NSArray *characteristicUUIDs = [EXBluetooth CBUUIDListJSONToNative:options[@"characteristicUUIDs"]];
  __weak EXBluetooth *weakSelf = self;
  
  [service discoverCharacteristics:characteristicUUIDs withDiscoverCharacteristicsCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error) {
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
  
  NSArray *includedServicesUUIDs = [EXBluetooth CBUUIDListJSONToNative:options[@"includedServicesUUIDs"]];
  __weak EXBluetooth *weakSelf = self;
  
  [service discoverIncludedServices:includedServicesUUIDs withDiscoverIncludedServicesCallback:^(EXBluetoothPeripheral *peripheral, EXBluetoothService *service, NSError *error) {
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
  
  NSArray *serviceUUIDs = [EXBluetooth CBUUIDListJSONToNative:options[EXBluetoothServiceUUIDsKey]];
  __weak EXBluetooth *weakSelf = self;
  
  [peripheral discoverServices:serviceUUIDs withDiscoverServicesCallback:^(EXBluetoothPeripheral *peripheral, NSError *error) {
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
  
  [_manager cancelPeripheralConnection:peripheral withDidDisconnectPeripheralCallback:^(EXBluetoothCentralManager *centralManager, EXBluetoothPeripheral *peripheral, NSError *error) {
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
    NSString *state = [EXBluetooth CBManagerStateNativeToJSON:_manager.state];
    reject(EXBluetoothErrorState, [NSString stringWithFormat:@"Bluetooth is unavailable. Manager state: %@", state], nil);
    return true;
  }
  return false;
}

#pragma mark - Search

- (CBCharacteristic *)characteristicFromUUID:(NSString *)UUID service:(CBService *)service prop:(CBCharacteristicProperties)prop
{
  for (CBCharacteristic *characteristic in service.characteristics) {
    if ((characteristic.properties & prop) != 0x0 && [characteristic.UUID.UUIDString isEqualToString:UUID]) {
      return characteristic;
    }
  }
  return nil;
}

- (CBCharacteristic *)characteristicFromUUID:(NSString *)UUID service:(CBService *)service
{
  for (CBCharacteristic *characteristic in service.characteristics) {
    if ([characteristic.UUID.UUIDString isEqualToString:UUID]) {
      return characteristic;
    }
  }
  return nil;
}

- (CBDescriptor *)descriptorFromUUID:(NSString *)UUID characteristic:(CBCharacteristic *)characteristic
{
  for (CBDescriptor *descriptor in characteristic.descriptors) {
    if ([descriptor.UUID.UUIDString isEqualToString:UUID]) {
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
  //   emit:EXBluetoothEvent_PERIPHERAL_DISCOVERED_SERVICES
  //   data:@{
  //          EXBluetoothTransactionIdKey: [NSString stringWithFormat:@"%@|%@", @"scan", peripheralData[@"id"]],
  //          EXBluetoothPeripheralKey: EXNullIfNil(peripheralData),
  //          EXBluetoothErrorKey: EXNullIfNil([EXBluetooth NSErrorNativeToJSON:error])
  //          }];
}

- (void)peripheralIsReadyToSendWriteWithoutResponse:(CBPeripheral *)peripheral
{
  // This method is invoked after a failed call to @link writeValue:forCharacteristic:type: @/link, when <i>peripheral</i> is again ready to send characteristic value updates.
}

- (void)peripheral:(CBPeripheral *)peripheral didOpenL2CAPChannel:(nullable CBL2CAPChannel *)channel error:(nullable NSError *)error
API_AVAILABLE(ios(11.0)) {
  //  This method returns the result of a @link openL2CAPChannel: @link call.
  
  //  [EXBluetooth CBL2CAPChannelNativeToJSON:channel];
  //  [EXBluetooth NSErrorNativeToJSON:error];
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
