package expo.modules.bluetooth;

public class BluetoothConstants {

  public interface PRIORITY {
    String HIGH = "high";
    String LOW_POWER = "lowPower";
    String BALANCED = "balanced";
  }

  public interface EVENTS {
    String CENTRAL_DID_UPDATE_STATE = "bluetoothCentralDidUpdateState";
    String CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS = "central.didRetrieveConnectedPeripherals";
    String CENTRAL_DID_RETRIEVE_PERIPHERALS = "central.didRetrievePeripherals";
    String CENTRAL_DID_DISCOVER_PERIPHERAL = "central.didDiscoverPeripheral";
    String CENTRAL_DID_CONNECT_PERIPHERAL = "central.didConnectPeripheral";
    String CENTRAL_DID_DISCONNECT_PERIPHERAL = "central.didDisconnectPeripheral";
    String CENTRAL_DID_STOP_SCANNING = "central.didStopScanning";
    String PERIPHERAL_DID_DISCOVER_SERVICES = "peripheral.didDiscoverServices";
    String PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE = "peripheral.didDiscoverCharacteristicsForService";
    String PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC = "peripheral.didDiscoverDescriptorsForCharacteristic";
    String PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC = "peripheral.didUpdateValueForCharacteristic";
    String PERIPHERAL_DID_CHANGE_NOTIFICATIONS_VALUE_FOR_CHARACTERISTIC = "peripheral.didChangeNotificationValueForCharacteristic";

    String PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC = "peripheral.didWriteValueForCharacteristic";
    String PERIPHERAL_DID_UPDATE_NOTIFICATION_STATE_FOR_CHARACTERISTIC = "peripheral.didUpdateNotificationStateForCharacteristic";
    String PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR = "peripheral.didUpdateValueForDescriptor";
    String PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR = "peripheral.didWriteValueForDescriptor";
    String ENABLE_BLUETOOTH = "ENABLE_BLUETOOTH";
  }

  public interface JSON {
    String SYSTEM = "system";
    String DEVICE_TYPE = "deviceType";
    String CENTRAL = "central";
    String PERIPHERAL = "peripheral";
    String PERIPHERALS = "peripherals";
    String ERROR = "error";
    String TRANSACTION_ID = "transactionId";
    String CHARACTERISTIC = "characteristic";
    String SERVICE = "service";
    String BLUETOOTH_EVENT = "bluetoothEvent";
    String EVENT = "event";
    String DATA = "data";
    String CODE = "code";
    String STATE = "state";
    String SERVICES = "services";
    String NAME = "name";
    String ID = "id";
    String UUID = "uuid";
    String PERIPHERAL_UUID = "peripheralUUID";
    String IS_PRIMARY = "isPrimary";
    String INCLUDED_SERVICES = "includedServices";
    String CHARACTERISTICS = "characteristics";
    String CHARACTERISTIC_UUID = "characteristicUUID";
    String DESCRIPTOR_UUID = "descriptorUUID";
    String PROPERTIES = "properties";
    String VALUE = "value";
    String PERMISSIONS = "permissions";
    String DESCRIPTORS = "descriptors";
    String DESCRIPTOR = "descriptor";
    String SERVICE_UUID = "serviceUUID";
    String IS_NOTIFYING = "isNotifying";
    String MTU = "mtu";
    String MESSAGE = "message";

    String LOCAL_NAME = "localName";
    String TX_POWER_LEVEL = "txPowerLevel";
    String IS_CONNECTABLE = "isConnectable";
    String MANUFACTURER_DATA = "manufacturerData";
    String SERVICE_DATA = "serviceData";
    String SERVICE_UUIDS = "serviceUUIDs";
    String CHARACTERISTIC_UUIDS = "characteristicUUIDs";
    String CHARACTERISTIC_PROPERTIES = "characteristicProperties";
    String INCLUDED_SERVICES_UUIDS = "includedServicesUUIDs";

    String BOND_STATE = "bondState";
    String RSSI = "RSSI";
    String ADVERTISEMENT_DATA = "advertisementData";
  }

  public interface BONDING {
    String BONDED = "bonded";
    String BONDING = "bonding";
    String UNKNOWN = "unknown";
    String NONE = "none";
  }

  public interface OPERATIONS {
    String NOTIFY = "notify";
    String READ = "read";
    String WRITE = "write";
    String DISCONNECT = "disconnect";
    String CONNECT = "connect";
    String SCAN = "scan";
    String MTU = "mtu";
  }

  public interface ERRORS {
    String GENERAL = "ERR_BLUETOOTH";
  }
}
