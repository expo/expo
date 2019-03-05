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
@property(readonly) CBManagerState state;
@property(readonly) BOOL isScanning;

@property (nonatomic, copy, nullable) EXBluetoothCentralDidUpdateStateBlock updateStateBlock;

@property (nonatomic, strong, readonly, nullable) EXBluetoothPeripheral *connectedPeripheral;
@property (nonatomic, strong, readonly, nullable) NSMutableDictionary<NSString *, EXBluetoothPeripheral *> *discoveredPeripherals;
@property (nonatomic, weak, nullable) id<EXBluetoothCentralManagerPeripheralFilter> filter;

- (nullable instancetype)init NS_UNAVAILABLE;

- (nullable instancetype)initWithQueue:(nullable dispatch_queue_t)queue;

- (nullable instancetype)initWithQueue:(nullable dispatch_queue_t)queue
                               options:(nullable NSDictionary<NSString *, id> *)options NS_AVAILABLE(NA, 7_0) NS_DESIGNATED_INITIALIZER;

- (nullable NSArray<EXBluetoothPeripheral *> *)retrievePeripheralsWithIdentifiers:(nullable NSArray<NSUUID *> *)identifiers NS_AVAILABLE(NA, 7_0);

- (nullable NSArray<EXBluetoothPeripheral *> *)retrieveConnectedPeripheralsWithServices:(nullable NSArray<CBUUID *> *)serviceUUIDs NS_AVAILABLE(NA, 7_0);

- (void)scanForPeripheralsWithServices:(nullable NSArray<CBUUID *> *)serviceUUIDs
                               options:(nullable NSDictionary<NSString *, id> *)options
                withScanningStateBlock:(EXBluetoothCentralDidChangeScanningBlock)scanningStateBlock
                             withBlock:(nullable EXBluetoothCentralDidDiscoverPeripheralBlock)block;

- (void)stopScanWithBlock:(EXBluetoothCentralDidChangeScanningBlock)block;

- (void)connectPeripheral:(nullable EXBluetoothPeripheral *)peripheral
                  options:(nullable NSDictionary<NSString *, id> *)options
         withSuccessBlock:(nullable EXBluetoothCentralDidConnectPeripheralBlock)successBlock
      withDisconnectBlock:(nullable EXBluetoothCentralDidDisconnectPeripheralBlock)disconnectBlock;

- (void)cancelPeripheralConnection:(nullable EXBluetoothPeripheral *)peripheral withBlock:(nullable EXBluetoothCentralDidDisconnectPeripheralBlock)block;

- (NSDictionary *)getJSON;

- (EXBluetoothPeripheral *)getPeripheralOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject;

- (BOOL)guardEnabled:(EXPromiseRejectBlock)reject;

- (void)updateLocalPeripheralStore:(CBPeripheral *)peripheral;

@end

