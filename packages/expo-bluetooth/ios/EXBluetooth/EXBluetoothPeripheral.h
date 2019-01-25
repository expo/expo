// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <CoreBluetooth/CoreBluetooth.h>
#import <EXBluetooth/EXBluetoothBlocks.h>
#import <EXCore/EXExportedModule.h>

@class EXBluetoothPeripheral;
@class EXBluetoothCharacteristic;
@class EXBluetoothDescriptor;
@class EXBluetoothService;

/*!
 *  @class EXBluetoothPeripheral
 *
 *  @discussion Represents a peripheral.
 */
NS_CLASS_AVAILABLE(NA, 7_0)
@interface EXBluetoothPeripheral : NSObject

@property(weak, nonatomic, nullable) id<CBPeripheralDelegate> delegate;

/*!
 *  @property identifier
 *
 *  @discussion The unique, persistent identifier associated with the peripheral.
 */
@property(readonly, nonatomic, nullable) NSUUID *identifier NS_AVAILABLE(NA, 7_0);

/*!
 *  @property name
 *
 *  @discussion The name of the peripheral.
 */
@property(retain, readonly, nullable) NSString *name;

@property (nonatomic, readwrite, strong) CBPeripheral *peripheral;


@property(readonly) BOOL canSendWriteWithoutResponse;

/*!
 *  @property state
 *
 *  @discussion The current connection state of the peripheral.
 */
@property(readonly) CBPeripheralState state;

/*!
 *  @property services
 *
 *  @discussion A list of <code>CBService</code> objects that have been discovered on the peripheral.
 */
@property(retain, readonly, nullable) NSArray<EXBluetoothService *> *services;

/*!
 *  @property RSSI
 *
 *  @discussion The most recently read RSSI, in decibels.
 */
@property(retain, readwrite, nullable) NSNumber *RSSI;

@property(retain, readwrite, nullable) NSDictionary<NSString *,id> *advertisementData;

- (nullable instancetype)init NS_UNAVAILABLE;

/*!
 *  @method initWithPeripheral:
 *
 *  @discussion Create a perpheral with CBPeripheral. and this is the only way to initial a perpheral.
 */
- (nullable instancetype)initWithPeripheral:(nullable CBPeripheral *)peripheral;

/*!
 *  @method readRSSI:
 *
 *	@discussion While connected, retrieves the current RSSI of the link.
 *
 *  @see		EXBluetoothPeripheralRedRSSIBlock
 */
- (void)readRSSI:(nullable EXBluetoothPeripheralRedRSSIBlock)block;

/*!
 *  @method discoverServices:withBlock:
 *
 *  @param serviceUUIDs A list of <code>CBUUID</code> objects representing the service types to be discovered. If <i>nil</i>,
 *						all services will be discovered, which is considerably slower and not recommended.
 *  @param block        callback with this block,(EXBluetoothPeripheral *peripheral, NSError *error)
 *
 *  @discussion			Discovers available service(s) on the peripheral.
 *
 *  @see						EXBluetoothPeripheralDiscoverServicesBlock
 */
- (void)discoverServices:(nullable NSArray<CBUUID *> *)serviceUUIDs withBlock:(nullable EXBluetoothPeripheralDiscoverServicesBlock)block;

/*!
 *  @method discoverIncludedServices:forService:withBlock:
 *
 *  @param includedServiceUUIDs A list of <code>CBUUID</code> objects representing the included service types to be discovered. If <i>nil</i>,
 *								all of <i>service</i>s included services will be discovered, which is considerably slower and not recommended.
 *  @param service				A GATT service.
 *  @param block                callback with this block,(EXBluetoothPeripheral *peripheral,CBService *service, NSError *error)
 *
 *  @discussion					Discovers the specified included service(s) of <i>service</i>.
 *
 *  @see						EXBluetoothPeripheralDiscoverIncludedServicesBlock
 */
- (void)discoverIncludedServices:(nullable NSArray<CBUUID *> *)includedServiceUUIDs
                      forService:(nullable EXBluetoothService *)service
                       withBlock:(nullable EXBluetoothPeripheralDiscoverIncludedServicesBlock)block;

/*!
 *  @method discoverCharacteristics:forService:withBlock:
 *
 *  @param characteristicUUIDs	A list of <code>CBUUID</code> objects representing the characteristic types to be discovered. If <i>nil</i>,
 *								all characteristics of <i>service</i> will be discovered, which is considerably slower and not recommended.
 *  @param service				A GATT service.
 *  @param block                callback with this block,(EXBluetoothPeripheral *peripheral,CBService *service,NSError *error)
 *
 *  @discussion					Discovers the specified characteristic(s) of <i>service</i>.
 *
 *  @see						EXBluetoothPeripheralDiscoverCharacteristicsBlock
 */
- (void)discoverCharacteristics:(nullable NSArray<CBUUID *> *)characteristicUUIDs
                     forService:(nullable EXBluetoothService *)service
                      withBlock:(nullable EXBluetoothPeripheralDiscoverCharacteristicsBlock)block;

/*!
 *  @method readValueForCharacteristic:withBlock:
 *
 *  @param characteristic	A GATT characteristic.
 *  @param block            callback with this block,(EXBluetoothPeripheral *peripheral,EXBluetoothharacteristic *characteristic,NSError *error)
 *
 *  @discussion				Reads the characteristic value for <i>characteristic</i>.
 *
 *  @see					EXBluetoothPeripheralReadValueForCharacteristicBlock
 */
- (void)readValueForCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic withBlock:(nullable EXBluetoothPeripheralReadValueForCharacteristicBlock)block;

/*!
 *  @method writeValue:forCharacteristic:type:withBlock:
 *
 *  @param data				The value to write.
 *  @param characteristic	The characteristic whose characteristic value will be written.
 *  @param type				The type of write to be executed.
 *  @param block            callback with this block;
 *
 *  @discussion				Writes <i>value</i> to <i>characteristic</i>'s characteristic value.
 *							If the <code>CBCharacteristicWriteWithResponse</code> type is specified, {@link peripheral:didWriteValueForCharacteristic:error:}
 *							is called with the result of the write request.
 *							If the <code>CBCharacteristicWriteWithoutResponse</code> type is specified, the delivery of the data is best-effort and not
 *							guaranteed.
 *
 *	@see					CBCharacteristicWriteType
 */
- (void)writeValue:(nullable NSData *)data
 forCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic
              type:(CBCharacteristicWriteType)type
         withBlock:(nullable EXBluetoothPeripheralWriteValueForCharacteristicsBlock)block;

/*!
 *  @method setNotifyValue:forCharacteristic:withBlock:
 *
 *  @param enabled			Whether or not notifications/indications should be enabled.
 *  @param characteristic	The characteristic containing the client characteristic configuration descriptor.
 *  @param block            callback with this block
 *
 *  @discussion				Enables or disables notifications/indications for the characteristic value of <i>characteristic</i>. If <i>characteristic</i>
 *							allows both, notifications will be used.
 *                          When notifications/indications are enabled, updates to the characteristic value will be received via block.
 *                          Since it is the peripheral that chooses when to send an update,
 *                          the application should be prepared to handle them as long as notifications/indications remain enabled.
 *
 *  @see					EXBluetoothPeripheralNotifyValueForCharacteristicsBlock
 *  @seealso                CBConnectPeripheralOptionNotifyOnNotificationKey
 */
- (void)setNotifyValue:(BOOL)enabled
     forCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic
             withBlock:(nullable EXBluetoothPeripheralNotifyValueForCharacteristicsBlock)block;

/*!
 *  @method discoverDescriptorsForCharacteristic:withBlcok:
 *
 *  @param characteristic	A GATT characteristic.
 *  @param block            callback with this block;
 *
 *  @discussion				Discovers the characteristic descriptor(s) of <i>characteristic</i>.
 *
 *  @see                    EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock
 */
- (void)discoverDescriptorsForCharacteristic:(nullable EXBluetoothCharacteristic *)characteristic
                                   withBlock:(nullable EXBluetoothPeripheralDiscoverDescriptorsForCharacteristicBlock)block;

/*!
 *  @method readValueForDescriptor:withBlock:
 *
 *  @param descriptor	A GATT characteristic descriptor.
 *  @param block        callback with this block.
 *
 *  @discussion			Reads the value of <i>descriptor</i>.
 *
 *  @see                EXBluetoothPeripheralReadValueForDescriptorsBlock
 */
- (void)readValueForDescriptor:(nullable EXBluetoothDescriptor *)descriptor withBlock:(nullable EXBluetoothPeripheralReadValueForDescriptorsBlock)block;

/*
 *  Writes <i>data</i> to <i>descriptor</i>'s value. Client characteristic configuration descriptors cannot be written using
 *						this method, and should instead use @link setNotifyValue:forCharacteristic: @/link.
 *
 *  @see                EXBluetoothPeripheralReadValueForDescriptorsBlock
 */
- (void)writeValue:(nullable NSData *)data
     forDescriptor:(nullable EXBluetoothDescriptor *)descriptor
         withBlock:(nullable EXBluetoothPeripheralWriteValueForDescriptorsBlock)block;


- (NSDictionary *)getJSON;

- (BOOL)guardIsConnected:(EXPromiseRejectBlock)reject;

- (EXBluetoothService *)getServiceOrReject:(NSString *)UUIDString reject:(EXPromiseRejectBlock)reject;

- (EXBluetoothService *)serviceFromUUID:(CBUUID *)UUID;

@end
