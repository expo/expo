// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetoothCentralManager.h>
#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXBluetooth/EXBluetoothCharacteristic.h>
#import <EXBluetooth/EXBluetoothService.h>
#import <EXBluetooth/EXBluetoothDescriptor.h>
#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXBluetooth/EXBluetoothConstants.h>

@interface EXBluetoothPeripheral()

@end

@interface EXBluetoothCentralManager()<CBCentralManagerDelegate>
{
  EXBluetoothCentralDidChangeScanning _onDidChangeScanning;
  EXBluetoothCentralDidDiscoverPeripheral _onDidDiscoverPeripheral;
  EXBluetoothCentralDidConnectPeripheral _onDidConnectPeripheral;
  NSMutableDictionary<NSString *, EXBluetoothCentralDidDisconnectPeripheral>  *onDidDisconnectPeripheralCallbacks;
}

@property (nonatomic, strong) CBCentralManager *centralManager;
@property (nonatomic, strong, readwrite) NSMutableDictionary<NSString *, EXBluetoothPeripheral *> *discoveredPeripherals;
@property (nonatomic, strong, readwrite) EXBluetoothPeripheral *connectedPeripheral;

@end

@implementation EXBluetoothCentralManager

- (instancetype)initWithQueue:(dispatch_queue_t)queue
{
  return [self initWithQueue:queue options:nil];
}

- (instancetype)initWithQueue:(dispatch_queue_t)queue options:(NSDictionary<NSString *,id> *)options
{
  self = [super init];
  if (self) {
    onDidDisconnectPeripheralCallbacks = [NSMutableDictionary new];
    _centralManager = [[CBCentralManager alloc] initWithDelegate:self
                                                           queue:queue
                                                         options:options];
    _discoveredPeripherals = [NSMutableDictionary dictionary];
    [_centralManager addObserver:self forKeyPath:@"isScanning"
                         options:NSKeyValueObservingOptionNew
                         context:(__bridge void *)self];
    
  }
  return self;
}

- (void)dealloc
{
  [_centralManager removeObserver:self forKeyPath:@"isScanning"];
}

#pragma mark - Observer

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if (context == (__bridge void *)self && _centralManager) {
    [self scanningDidChange:_centralManager.isScanning];
  } else {
    [super observeValueForKeyPath:keyPath
                         ofObject:object
                           change:change
                          context:context];
  }
}

- (BOOL)isScanning
{
  return _centralManager.isScanning;
}

- (CBManagerState)state
{
  return _centralManager.state;
}

- (void)scanningDidChange:(BOOL)isScanning
{
  if (_onDidChangeScanning) {
    _onDidChangeScanning(self, isScanning);
    _onDidChangeScanning = nil;
  }
}

- (NSArray<EXBluetoothPeripheral *> *)retrievePeripheralsWithIdentifiers:(NSArray<NSUUID *> *)identifiers
{
  NSArray *peripherals = [_centralManager retrievePeripheralsWithIdentifiers:identifiers];
  NSMutableArray *array = [[NSMutableArray alloc] initWithCapacity:peripherals.count];
  for (CBPeripheral *peripheral in peripherals) {
    [array addObject:[[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral]];
  }
  return array;
}

- (NSArray<EXBluetoothPeripheral *> *)retrieveConnectedPeripheralsWithServices:(NSArray<CBUUID *> *)serviceUUIDs
{
  NSArray *peripherals = [_centralManager retrieveConnectedPeripheralsWithServices:serviceUUIDs];
  NSMutableArray *array = [[NSMutableArray alloc] initWithCapacity:peripherals.count];
  for (CBPeripheral *peripheral in peripherals) {
    [array addObject:[[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral]];
  }
  return array;
}

- (void)scanForPeripheralsWithServices:(nullable NSArray<CBUUID *> *)serviceUUIDs options:(nullable NSDictionary<NSString *, id> *)options withDidChangeScanningStateCallback:(EXBluetoothCentralDidChangeScanning)onDidChangeScanningState withDidDiscoverPeripheralCallback:(nullable EXBluetoothCentralDidDiscoverPeripheral)onDidDiscoverPeripheral
{
  _onDidChangeScanning = onDidChangeScanningState;
  _onDidDiscoverPeripheral = onDidDiscoverPeripheral;
  [_centralManager scanForPeripheralsWithServices:serviceUUIDs options:options];
}

- (void)stopScanWithCallback:(EXBluetoothCentralDidChangeScanning)onDidChangeScanning
{
  _onDidChangeScanning = onDidChangeScanning;
  _onDidDiscoverPeripheral = nil;
  //  [_discoveredPeripherals removeAllObjects];
  [_centralManager stopScan];
}

- (void)connectPeripheral:(EXBluetoothPeripheral *)peripheral
                  options:(NSDictionary<NSString *, id> *)options
         withDidConnectPeripheralCallback:(EXBluetoothCentralDidConnectPeripheral)onDidConnectPeripheral
      withDidDisconnectPeripheralCallback:(nullable EXBluetoothCentralDidDisconnectPeripheral)onDidDisconnectPeripheral
{
  NSString *peripheralID = peripheral.identifier.UUIDString;
  _onDidConnectPeripheral = onDidConnectPeripheral;
  
  if ([onDidDisconnectPeripheralCallbacks objectForKey:peripheralID]) {
    NSLog(@"Invalid transaction: Disconnection block was replaced");
    [onDidDisconnectPeripheralCallbacks objectForKey:peripheralID](self, peripheral, nil);
  }
  [onDidDisconnectPeripheralCallbacks setObject:onDidDisconnectPeripheral forKey:peripheralID];
  [_centralManager connectPeripheral:peripheral.peripheral options:options];
}

- (void)cancelPeripheralConnection:(EXBluetoothPeripheral *)peripheral
                         withDidDisconnectPeripheralCallback:(EXBluetoothCentralDidDisconnectPeripheral)onDidDisconnectPeripheral
{
  peripheral.delegate = nil;
  NSString *peripheralID = peripheral.identifier.UUIDString;
  
  if ([onDidDisconnectPeripheralCallbacks objectForKey:peripheralID]) {
    NSLog(@"Invalid transaction: Disconnection block was replaced");
    [onDidDisconnectPeripheralCallbacks objectForKey:peripheralID](self, peripheral, nil);
  }
  
  [onDidDisconnectPeripheralCallbacks setObject:onDidDisconnectPeripheral forKey:peripheralID];
  
  if (peripheral.state == CBPeripheralStateDisconnected) {
    [self centralManager:_centralManager didDisconnectPeripheral:peripheral.peripheral error:nil];
    return;
  }
  
  if (peripheral.services != nil) {
    [peripheral.services enumerateObjectsUsingBlock:^(EXBluetoothService *service, NSUInteger idx, BOOL *stop) {
      [service.characteristics enumerateObjectsUsingBlock:^(EXBluetoothCharacteristic *characteristic, NSUInteger idx, BOOL *stop) {
        if (characteristic.isNotifying) {
          [peripheral setNotifyValue:NO forCharacteristic:characteristic withNotifyValueForCharacteristicsCallback:nil];
        }
      }];
    }];
  }
  
  [_centralManager cancelPeripheralConnection:peripheral.peripheral];
}

#pragma mark - CBCentralManagerDelegate

- (void)centralManagerDidUpdateState:(CBCentralManager *)central
{
  _centralManager = central;
  [_discoveredPeripherals removeAllObjects];
  if (_onDidUpdateState) {
    _onDidUpdateState(self);
  }
}

- (void)updateLocalPeripheralStore:(CBPeripheral *)peripheral
{
  //  NSString *UUIDString = peripheral.identifier.UUIDString;
  //  if ([_discoveredPeripherals objectForKey:UUIDString]) {
  //    [[_discoveredPeripherals objectForKey:UUIDString] setPeripheral:peripheral];
  //  }
}

- (void)centralManager:(CBCentralManager *)central
  didConnectPeripheral:(CBPeripheral *)peripheral
{
  [self updateLocalPeripheralStore:peripheral];
  if (_onDidConnectPeripheral) {
    [self updateLocalPeripheralStore:peripheral];
    _connectedPeripheral = [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral];
    _onDidConnectPeripheral(self, [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral], nil);
    _onDidConnectPeripheral = nil;
  }
}

- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error
{
  [self updateLocalPeripheralStore:peripheral];
  NSString *peripheralID = peripheral.identifier.UUIDString;
  
  if ([onDidDisconnectPeripheralCallbacks objectForKey:peripheralID]) {
    [self updateLocalPeripheralStore:peripheral];
    [onDidDisconnectPeripheralCallbacks objectForKey:peripheralID](self, [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral], error);
    [onDidDisconnectPeripheralCallbacks removeObjectForKey:peripheralID];
  }
}

- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary<NSString *, id> *)advertisementData
                  RSSI:(NSNumber *)RSSI
{
  EXBluetoothPeripheral *mPeripheral = [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral];
  [mPeripheral setRSSI:RSSI];
  [mPeripheral setAdvertisementData:advertisementData];
  
  BOOL shouldShowPeripheral = YES;
  if (_filter) {
    shouldShowPeripheral = [_filter centralManager:self shouldShowPeripheral:mPeripheral advertisementData:advertisementData];
  }
  
  if (shouldShowPeripheral) {
    [_discoveredPeripherals setValue:mPeripheral forKey:mPeripheral.identifier.UUIDString];
    if (_onDidDiscoverPeripheral) {
      _onDidDiscoverPeripheral(self, mPeripheral, advertisementData, RSSI);
    }
  }
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral
                 error:(NSError *)error
{
  if (_onDidConnectPeripheral) {
    _onDidConnectPeripheral(self, [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral], error);
    _onDidConnectPeripheral = nil;
  }
}

# pragma - extra

// TODO: Possibly extend CBCentralManager with these features.
- (void)disconnectPeripheral:(CBPeripheral *)peripheral
{
  peripheral.delegate = nil;
  
  if (peripheral.state == CBPeripheralStateDisconnected) {
    return;
  }
  
  if (peripheral.services != nil) {
    [peripheral.services enumerateObjectsUsingBlock:^(CBService *service,
                                                      NSUInteger idx,
                                                      BOOL *stop) {
      [service.characteristics enumerateObjectsUsingBlock:^(CBCharacteristic *characteristic, NSUInteger idx, BOOL *stop) {
        if (characteristic.isNotifying) {
          [peripheral setNotifyValue:NO forCharacteristic:characteristic];
        }
      }];
    }];
  }
  
  [_centralManager cancelPeripheralConnection:peripheral];
}

- (NSDictionary *)getJSON
{
  return [EXBluetooth.class EXBluetoothCentralManagerNativeToJSON:self];
}

- (EXBluetoothPeripheral *)getPeripheralOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject
{
  EXBluetoothPeripheral *exPeripheral = [_discoveredPeripherals objectForKey:UUIDString];
  if (!exPeripheral) {
    reject(EXBluetoothErrorNoPeripheral, [NSString stringWithFormat:@"No valid peripheral with UUID %@", UUIDString], nil);
    return nil;
  }
  return exPeripheral;
}

- (BOOL)guardEnabled:(EXPromiseRejectBlock)reject
{
  if (self.state < CBManagerStatePoweredOff) {
    NSString *state = [EXBluetooth.class CBManagerStateNativeToJSON:self.state];
    reject(EXBluetoothErrorState, [NSString stringWithFormat:@"Bluetooth is unavailable. Manager state: %@", state], nil);
    return YES;
  }
  return NO;
}

@end
