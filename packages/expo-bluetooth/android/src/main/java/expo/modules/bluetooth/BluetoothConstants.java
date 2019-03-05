package expo.modules.bluetooth;

public class BluetoothConstants {

  public interface PRIORITY {
    String HIGH = "high";
    String LOW_POWER = "lowPower";
    String BALANCED = "balanced";
  }

  public interface EVENTS {
    String SYSTEM_ENABLED_STATE_CHANGED = "SYSTEM_ENABLED_STATE_CHANGED";
    String SYSTEM_AVAILABILITY_CHANGED = "SYSTEM_AVAILABILITY_CHANGED";
//    String CENTRAL_SCAN_STARTED = "CENTRAL_SCAN_STARTED";
//    String CENTRAL_SCAN_STOPPED = "CENTRAL_SCAN_STOPPED";
    String CENTRAL_STATE_CHANGED = "CENTRAL_STATE_CHANGED";
    String CENTRAL_DISCOVERED_PERIPHERAL = "CENTRAL_DISCOVERED_PERIPHERAL";
    String PERIPHERAL_DISCOVERED_SERVICES = "PERIPHERAL_DISCOVERED_SERVICES";
    String PERIPHERAL_CONNECTED = "PERIPHERAL_CONNECTED";
    String PERIPHERAL_DISCONNECTED = "PERIPHERAL_DISCONNECTED";
    String PERIPHERAL_BONDED = "PERIPHERAL_BONDED";
    String PERIPHERAL_UNBONDED = "PERIPHERAL_UNBONDED";
    String PERIPHERAL_UPDATED_RSSI = "PERIPHERAL_UPDATED_RSSI";
    String PERIPHERAL_UPDATED_MTU = "PERIPHERAL_UPDATED_MTU";
    String SERVICE_DISCOVERED_INCLUDED_SERVICES = "SERVICE_DISCOVERED_INCLUDED_SERVICES";
    String SERVICE_DISCOVERED_CHARACTERISTICS = "SERVICE_DISCOVERED_CHARACTERISTICS";
    String CHARACTERISTIC_DISCOVERED_DESCRIPTORS = "CHARACTERISTIC_DISCOVERED_DESCRIPTORS";
    String CHARACTERISTIC_DID_WRITE = "CHARACTERISTIC_DID_WRITE";
    String CHARACTERISTIC_DID_READ = "CHARACTERISTIC_DID_READ";
    String CHARACTERISTIC_DID_NOTIFY = "CHARACTERISTIC_DID_NOTIFY";
    String DESCRIPTOR_DID_WRITE = "DESCRIPTOR_DID_WRITE";
    String DESCRIPTOR_DID_READ = "DESCRIPTOR_DID_READ";
  }

  public interface JSON {

    String SYSTEM = "system";
//    String DEVICE_TYPE = "deviceType";
    String CENTRAL = "central";
    String PERIPHERAL = "peripheral";
    String PERIPHERALS = "peripherals";
    String ERROR = "error";
//    String TRANSACTION_ID = "transactionId";
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

  public interface ERRORS {
    String GENERAL = "ERR_BLUETOOTH";
  }
}
