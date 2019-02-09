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
  EXBluetoothCentralDidChangeScanningBlock _didChangeScanningBlock;
  EXBluetoothCentralDidDiscoverPeripheralBlock _didDiscoverPeripheralBlock;
  EXBluetoothCentralDidConnectPeripheralBlock _didConnectPeripheralBlock;
  NSMutableDictionary<NSString *, EXBluetoothCentralDidDisconnectPeripheralBlock>  *_didDisconnectPeripheralBlocks;
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
    _didDisconnectPeripheralBlocks = [NSMutableDictionary new];
    _centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:queue options:options];
    _discoveredPeripherals = [NSMutableDictionary dictionary];
    [_centralManager addObserver:self forKeyPath:@"isScanning"     options:NSKeyValueObservingOptionNew context:(__bridge void *)self];

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
    [self scanningDidChange:[_centralManager isScanning]];
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
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
  if (_didChangeScanningBlock) {
    _didChangeScanningBlock(self, isScanning);
    _didChangeScanningBlock = nil;
  }
  NSLog(@"Change isScanning %@", @(isScanning));
}

- (NSArray<EXBluetoothPeripheral *> *)retrievePeripheralsWithIdentifiers:(NSArray<NSUUID *> *)identifiers
{
  NSArray *peripherals = [_centralManager retrievePeripheralsWithIdentifiers:identifiers];
  NSMutableArray *array = [[NSMutableArray alloc] initWithCapacity:peripherals.count];
  for(CBPeripheral *peripheral in peripherals) {
    EXBluetoothPeripheral *p = [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral];
    [array addObject:p];
  }
  return array;
}

- (NSArray<EXBluetoothPeripheral *> *)retrieveConnectedPeripheralsWithServices:(NSArray<CBUUID *> *)serviceUUIDs
{
  NSArray *peripherals = [_centralManager retrieveConnectedPeripheralsWithServices:serviceUUIDs];
  NSMutableArray *array = [[NSMutableArray alloc] initWithCapacity:peripherals.count];
  for(CBPeripheral *peripheral in peripherals) {
    EXBluetoothPeripheral *p = [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral];
    [array addObject:p];
  }
  return array;
}

- (void)scanForPeripheralsWithServices:(NSArray<CBUUID *> *)serviceUUIDs
                               options:(NSDictionary<NSString *,id> *)options
                             withScanningStateBlock:(EXBluetoothCentralDidChangeScanningBlock)scanningStateBlock withBlock:(nullable EXBluetoothCentralDidDiscoverPeripheralBlock)block
{
  _didChangeScanningBlock = scanningStateBlock;
  _didDiscoverPeripheralBlock = block;
  [_centralManager scanForPeripheralsWithServices:serviceUUIDs options:options];
}

- (void)stopScanWithBlock:(EXBluetoothCentralDidChangeScanningBlock)block
{
  _didChangeScanningBlock = block;
  _didDiscoverPeripheralBlock = nil;
//  [_discoveredPeripherals removeAllObjects];
  [_centralManager stopScan];
}

- (void)connectPeripheral:(EXBluetoothPeripheral *)peripheral
                  options:(NSDictionary<NSString *,id> *)options
         withSuccessBlock:(EXBluetoothCentralDidConnectPeripheralBlock)successBlock
      withDisconnectBlock:(nullable EXBluetoothCentralDidDisconnectPeripheralBlock)disconnectBlock
{
  NSString *peripheralID = peripheral.identifier.UUIDString;
  _didConnectPeripheralBlock = successBlock;
  

  if ([_didDisconnectPeripheralBlocks objectForKey:peripheralID]) {
    NSLog(@"Invalid transaction: Disconnection block was replaced");
    [_didDisconnectPeripheralBlocks objectForKey:peripheralID](self, peripheral, nil);
  }
  [_didDisconnectPeripheralBlocks setObject:disconnectBlock forKey:peripheralID];
  [_centralManager connectPeripheral:peripheral.peripheral options:options];
}

- (void)cancelPeripheralConnection:(EXBluetoothPeripheral *)peripheral withBlock:(EXBluetoothCentralDidDisconnectPeripheralBlock)block
{
  peripheral.delegate = nil;
  NSString *peripheralID = peripheral.identifier.UUIDString;

  if ([_didDisconnectPeripheralBlocks objectForKey:peripheralID]) {
    NSLog(@"Invalid transaction: Disconnection block was replaced");
    [_didDisconnectPeripheralBlocks objectForKey:peripheralID](self, peripheral, nil);
  }
  [_didDisconnectPeripheralBlocks setObject:block forKey:peripheralID];
  
  if (peripheral.state == CBPeripheralStateDisconnected) {
    [self centralManager:_centralManager didDisconnectPeripheral:peripheral.peripheral error:nil];
    return;
  }
  
  if (peripheral.services != nil) {
    [peripheral.services enumerateObjectsUsingBlock:^(EXBluetoothService *service, NSUInteger idx, BOOL *stop) {
      [service.characteristics enumerateObjectsUsingBlock:^(EXBluetoothCharacteristic *characteristic, NSUInteger idx, BOOL *stop) {
        if (characteristic.isNotifying) {
          [peripheral setNotifyValue:NO forCharacteristic:characteristic withBlock:nil];
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
  if (_updateStateBlock) {
    _updateStateBlock(self);
  }
}

- (void)updateLocalPeripheralStore:(CBPeripheral *)peripheral
{
  NSString *UUIDString = peripheral.identifier.UUIDString;
  if ([_discoveredPeripherals objectForKey:UUIDString]) {
    EXBluetoothPeripheral *exPeripheral = [_discoveredPeripherals objectForKey:UUIDString];
//    [exPeripheral setPeripheral:peripheral];
  }
}

- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral
{
  [self updateLocalPeripheralStore:peripheral];
  if (_didConnectPeripheralBlock) {
    [self updateLocalPeripheralStore:peripheral];
    _connectedPeripheral = [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral];
    _didConnectPeripheralBlock(self, [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral], nil);
  }
}

- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error
{
  [self updateLocalPeripheralStore:peripheral];
  NSString *peripheralID = peripheral.identifier.UUIDString;

  if ([_didDisconnectPeripheralBlocks objectForKey:peripheralID]) {
    [self updateLocalPeripheralStore:peripheral];
    [_didDisconnectPeripheralBlocks objectForKey:peripheralID](self, [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral], error);
    [_didDisconnectPeripheralBlocks removeObjectForKey:peripheralID];
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
  
  BOOL allow = YES;
  if (_filter) {
    allow = [_filter centralManager:self shouldShowPeripheral:mPeripheral advertisementData:advertisementData];
  }
  
  if (allow) {
    [_discoveredPeripherals setValue:mPeripheral forKey:mPeripheral.identifier.UUIDString];
    if (_didDiscoverPeripheralBlock) {
      _didDiscoverPeripheralBlock(self, mPeripheral, advertisementData, RSSI);
    }
  }
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error
{
  if (_didConnectPeripheralBlock) {
    _didConnectPeripheralBlock(self, [[EXBluetoothPeripheral alloc] initWithPeripheral:peripheral], error);
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
    [peripheral.services enumerateObjectsUsingBlock:^(CBService *service, NSUInteger idx, BOOL *stop) {
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
  return [[EXBluetooth class] EXBluetoothCentralManager_NativeToJSON:self];
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
    NSString *state = [[EXBluetooth class] CBManagerState_NativeToJSON:self.state];
    reject(EXBluetoothErrorState, [NSString stringWithFormat:@"Bluetooth is unavailable. Manager state: %@", state], nil);
    return true;
  }
  return false;
}

@end
