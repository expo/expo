// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetoothBlocks.h>
#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXCore/EXExportedModule.h>

@protocol EXBluetoothCentralManagerPeripheralFilter <NSObject>

- (BOOL)centralManager:(nullable EXBluetoothCentralManager *)centralManager
  shouldShowPeripheral:(nullable EXBluetoothPeripheral *)peripheral
     advertisementData:(nullable NSDictionary<NSString *, id> *)advertisementData;

@end

@interface EXBluetoothCentralManager : NSObject

// Defaults to CBCentralManagerStateUnknown
@property (readonly) CBManagerState state;

@property (readonly) BOOL isScanning;

@property (nonatomic, copy, nullable) EXBluetoothCentralDidUpdateState onDidUpdateState;

@property (nonatomic, strong, nullable) EXBluetoothPeripheral *connectedPeripheral;

@property (nonatomic, weak, nullable) id<EXBluetoothCentralManagerPeripheralFilter> filter;

- (nullable instancetype)initWithQueue:(nullable dispatch_queue_t)queue;

- (nullable instancetype)initWithQueue:(nullable dispatch_queue_t)queue
                                options:(nullable NSDictionary<NSString *, id> *)options;

- (nullable NSArray<EXBluetoothPeripheral *> *)retrievePeripheralsWithIdentifiers:(nullable NSArray<NSUUID *> *)identifiers;

- (nullable NSArray<EXBluetoothPeripheral *> *)retrieveConnectedPeripheralsWithServices:(nullable NSArray<CBUUID *> *)serviceUUIDs;

- (void)scanForPeripheralsWithServices:(nullable NSArray<CBUUID *> *)serviceUUIDs options:(nullable NSDictionary<NSString *, id> *)options withDidChangeScanningStateCallback:(EXBluetoothCentralDidChangeScanning)onDidChangeScanningState withDidDiscoverPeripheralCallback:(nullable EXBluetoothCentralDidDiscoverPeripheral)onDidDiscoverPeripheral;

- (void)stopScanWithCallback:(EXBluetoothCentralDidChangeScanning)onDidChangeScanning;

- (void)connectPeripheral:(nullable EXBluetoothPeripheral *)peripheral
                  options:(nullable NSDictionary<NSString *, id> *)options
         withDidConnectPeripheralCallback:(nullable EXBluetoothCentralDidConnectPeripheral)onDidConnectPeripheral
      withDidDisconnectPeripheralCallback:(nullable EXBluetoothCentralDidDisconnectPeripheral)onDidDisconnectPeripheral;

- (void)cancelPeripheralConnection:(nullable EXBluetoothPeripheral *)peripheral
                         withDidDisconnectPeripheralCallback:(nullable EXBluetoothCentralDidDisconnectPeripheral)onDidDisconnectPeripheral;

- (NSDictionary *)getJSON;

- (EXBluetoothPeripheral *)getPeripheralOrReject:(NSString *)UUIDString
                                          reject:(EXPromiseRejectBlock)reject;

- (BOOL)guardEnabled:(EXPromiseRejectBlock)reject;

- (void)updateLocalPeripheralStore:(CBPeripheral *)peripheral;

- (NSArray<EXBluetoothPeripheral *> *)getDiscoveredPeripherals;

@end

