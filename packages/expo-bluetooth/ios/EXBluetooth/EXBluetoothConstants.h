// Copyright 2019-present 650 Industries. All rights reserved.

#ifndef EXBluetoothConstants_h
#define EXBluetoothConstants_h

static NSString *const EXBluetoothEvent_SYSTEM_AVAILABILITY_CHANGED = @"SYSTEM_AVAILABILITY_CHANGED";
static NSString *const EXBluetoothEvent_CENTRAL_SCAN_STARTED = @"CENTRAL_SCAN_STARTED";
static NSString *const EXBluetoothEvent_CENTRAL_SCAN_STOPPED = @"CENTRAL_SCAN_STOPPED";
static NSString *const EXBluetoothEvent_CENTRAL_STATE_CHANGED = @"CENTRAL_STATE_CHANGED";
static NSString *const EXBluetoothEvent_CENTRAL_DISCOVERED_PERIPHERAL = @"CENTRAL_DISCOVERED_PERIPHERAL";
static NSString *const EXBluetoothEvent_PERIPHERAL_DISCOVERED_SERVICES = @"PERIPHERAL_DISCOVERED_SERVICES";
static NSString *const EXBluetoothEvent_PERIPHERAL_CONNECTED = @"PERIPHERAL_CONNECTED";
static NSString *const EXBluetoothEvent_PERIPHERAL_DISCONNECTED = @"PERIPHERAL_DISCONNECTED";
static NSString *const EXBluetoothEvent_PERIPHERAL_UPDATED_RSSI = @"PERIPHERAL_UPDATED_RSSI";
static NSString *const EXBluetoothEvent_SERVICE_DISCOVERED_INCLUDED_SERVICES = @"SERVICE_DISCOVERED_INCLUDED_SERVICES";
static NSString *const EXBluetoothEvent_SERVICE_DISCOVERED_CHARACTERISTICS = @"SERVICE_DISCOVERED_CHARACTERISTICS";
static NSString *const EXBluetoothEvent_CHARACTERISTIC_DISCOVERED_DESCRIPTORS = @"CHARACTERISTIC_DISCOVERED_DESCRIPTORS";
static NSString *const EXBluetoothEvent_CHARACTERISTIC_DID_WRITE = @"CHARACTERISTIC_DID_WRITE";
static NSString *const EXBluetoothEvent_CHARACTERISTIC_DID_READ = @"CHARACTERISTIC_DID_READ";
static NSString *const EXBluetoothEvent_CHARACTERISTIC_DID_NOTIFY = @"CHARACTERISTIC_DID_NOTIFY";
static NSString *const EXBluetoothEvent_DESCRIPTOR_DID_WRITE = @"DESCRIPTOR_DID_WRITE";
static NSString *const EXBluetoothEvent_DESCRIPTOR_DID_READ = @"DESCRIPTOR_DID_READ";


static NSString *const EXBluetoothErrorUnimplemented = @"ERR_BLE_UNIMPLEMENTED";
static NSString *const EXBluetoothErrorNoPeripheral = @"ERR_BLE_NO_PERIPHERAL";
static NSString *const EXBluetoothErrorNoService = @"ERR_BLE_NO_SERVICE";
static NSString *const EXBluetoothErrorNoCharacteristic = @"ERR_BLE_NO_CHARACTERISTIC";
static NSString *const EXBluetoothErrorNoDescriptor = @"ERR_BLE_NO_DESCRIPTOR";
static NSString *const EXBluetoothErrorWrite = @"ERR_BLE_WRITE";
static NSString *const EXBluetoothErrorRead = @"ERR_BLE_READ";
static NSString *const EXBluetoothErrorInvalidBase64 = @"ERR_BLE_INVALID_BASE64";
static NSString *const EXBluetoothErrorState = @"ERR_BLE_STATE";
static NSString *const EXBluetoothErrorScanning = @"ERR_BLE_SCANNING";

static NSString *const EXBluetoothEvent = @"bluetoothEvent";

static NSString *const EXBluetoothCentralKey = @"central";
static NSString *const EXBluetoothPeripheralKey = @"peripheral";
static NSString *const EXBluetoothDescriptorKey = @"descriptor";
static NSString *const EXBluetoothServiceKey = @"service";
static NSString *const EXBluetoothCharacteristicKey = @"characteristic";
static NSString *const EXBluetoothRSSIKey = @"RSSI";
static NSString *const EXBluetoothAdvertisementDataKey = @"advertisementData";
static NSString *const EXBluetoothServiceUUIDsKey = @"serviceUUIDs";
static NSString *const EXBluetoothPeripheralsKey = @"peripherals";

static NSString *const EXBluetoothPeripheralUUID = @"peripheralUUID";
static NSString *const EXBluetoothServiceUUID = @"serviceUUID";
static NSString *const EXBluetoothCharacteristicUUID = @"characteristicUUID";

static NSString *const EXBluetoothDescriptorUUID = @"descriptorUUID";

static NSString *const EXBluetoothEventKey = @"event";
static NSString *const EXBluetoothDataKey = @"data";
static NSString *const EXBluetoothErrorKey = @"error";
static NSString *const EXBluetoothTransactionIdKey = @"transactionId";

#endif /* EXBluetoothConstants_h */
