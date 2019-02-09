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

//The current state of the central, initially set to <code>CBCentralManagerStateUnknown</code>. Updates are provided by required delegate method {@link centralManagerDidUpdateState:}.
@property(readonly) CBManagerState state;
@property(readonly) BOOL isScanning;

@property (nonatomic, copy, nullable) EXBluetoothCentralDidUpdateStateBlock updateStateBlock;

@property (nonatomic, strong, readonly, nullable) EXBluetoothPeripheral *connectedPeripheral;
@property (nonatomic, strong, readonly, nullable) NSMutableDictionary<NSString *, EXBluetoothPeripheral *> *discoveredPeripherals;
@property (nonatomic, weak, nullable) id<EXBluetoothCentralManagerPeripheralFilter> filter;

- (nullable instancetype)init NS_UNAVAILABLE;

/*!
 *  @method initWithQueue:
 *
 *  @param queue    The dispatch queue on which the events will be dispatched.
 *
 *  @discussion     The initialization call. The events of the central role will be dispatched on the provided queue.
 *                  If <i>nil</i>, the main queue will be used.
 *
 */

// The initialization call. The events of the central role will be dispatched on the provided queue. If <i>nil</i>, the main queue will be used.
- (nullable instancetype)initWithQueue:(nullable dispatch_queue_t)queue;

// The initialization call. The events of the central role will be dispatched on the provided queue. If <i>nil</i>, the main queue will be used.
- (nullable instancetype)initWithQueue:(nullable dispatch_queue_t)queue
                               options:(nullable NSDictionary<NSString *, id> *)options NS_AVAILABLE(NA, 7_0) NS_DESIGNATED_INITIALIZER;

// Attempts to retrieve the <code>CBPeripheral</code> object(s) with the corresponding <i>identifiers</i>.
- (nullable NSArray<EXBluetoothPeripheral *> *)retrievePeripheralsWithIdentifiers:(nullable NSArray<NSUUID *> *)identifiers NS_AVAILABLE(NA, 7_0);

/*
 * Retrieves all peripherals that are connected to the system and implement any of the services listed in <i>serviceUUIDs</i>.
 *				Note that this set can include peripherals which were connected by other applications, which will need to be connected locally
 *				via {@link connectPeripheral:options:} before they can be used.
 */
- (nullable NSArray<EXBluetoothPeripheral *> *)retrieveConnectedPeripheralsWithServices:(nullable NSArray<CBUUID *> *)serviceUUIDs NS_AVAILABLE(NA, 7_0);

/*!
 *  Starts scanning for peripherals that are advertising any of the services listed in <i>serviceUUIDs</i>. Although strongly discouraged,
 *                      if <i>serviceUUIDs</i> is <i>nil</i> all discovered peripherals will be returned. If the central is already scanning with different
 *                      <i>serviceUUIDs</i> or <i>options</i>, the provided parameters will replace them.
 *                      Applications that have specified the <code>bluetooth-central</code> background mode are allowed to scan while backgrounded, with two
 *                      caveats: the scan must specify one or more service types in <i>serviceUUIDs</i>, and the <code>CBCentralManagerScanOptionAllowDuplicatesKey</code>
 *                      scan option will be ignored.
 */
- (void)scanForPeripheralsWithServices:(nullable NSArray<CBUUID *> *)serviceUUIDs
                               options:(nullable NSDictionary<NSString *, id> *)options
                withScanningStateBlock:(EXBluetoothCentralDidChangeScanningBlock)scanningStateBlock
                             withBlock:(nullable EXBluetoothCentralDidDiscoverPeripheralBlock)block;

// Stops scanning for peripherals.
- (void)stopScanWithBlock:(EXBluetoothCentralDidChangeScanningBlock)block;

/*
 * Initiates a connection to <i>peripheral</i>. Connection attempts never time out and, depending on the outcome, will result
 *                      in a call to either {@link centralManager:didConnectPeripheral:} or {@link centralManager:didFailToConnectPeripheral:error:}.
 *                      Pending attempts are cancelled automatically upon deallocation of <i>peripheral</i>, and explicitly via {@link cancelPeripheralConnection}.
 *
 */
- (void)connectPeripheral:(nullable EXBluetoothPeripheral *)peripheral
                  options:(nullable NSDictionary<NSString *, id> *)options
         withSuccessBlock:(nullable EXBluetoothCentralDidConnectPeripheralBlock)successBlock
      withDisconnectBlock:(nullable EXBluetoothCentralDidDisconnectPeripheralBlock)disconnectBlock;

/* Cancels an active or pending connection to _peripheral_. Note that this is non-blocking, and any `CBPeripheral` commands that are still pending to _peripheral_ may or may not complete. */
- (void)cancelPeripheralConnection:(nullable EXBluetoothPeripheral *)peripheral withBlock:(nullable EXBluetoothCentralDidDisconnectPeripheralBlock)block;


- (NSDictionary *)getJSON;

- (EXBluetoothPeripheral *)getPeripheralOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject;

- (BOOL)guardEnabled:(EXPromiseRejectBlock)reject;

- (void)updateLocalPeripheralStore:(CBPeripheral *)peripheral;

@end

