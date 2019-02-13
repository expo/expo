package expo.modules.bluetooth;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.le.ScanSettings;
import android.os.Build;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import expo.modules.bluetooth.helpers.Base64Helper;
import expo.modules.bluetooth.helpers.UUIDHelper;

public class Serialize {

  private final static char[] hexArray = "0123456789ABCDEF".toCharArray();
  private static final UUID CLIENT_CHARACTERISTIC_CONFIG_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

  public static ArrayList<UUID> UUIDList_JSONToNative(ArrayList<String> input) {
    ArrayList<UUID> output = new ArrayList<>();

    for (String uuidString : input) {
      output.add(UUIDHelper.toUUID(uuidString));
    }
    return output;
  }

  public static ArrayList<String> UUIDList_NativeToJSON(ArrayList<UUID> input) {
    ArrayList<String> output = new ArrayList<>();
    for (UUID uuid : input) {
      output.add(UUIDHelper.fromUUID(uuid));
    }
    return output;
  }


  public static byte[] Base64_JSONToNative(List input) {
    byte[] decoded = new byte[input.size()];
    for (int i = 0; i < input.size(); i++) {
      decoded[i] = new Integer((Integer) input.get(i)).byteValue();
    }
    return decoded;
  }

  public static ArrayList<String> decodePermissions(BluetoothGattCharacteristic characteristic) {
    return Serialize.CharacteristicPermissions_NativeToJSON(characteristic.getPermissions());
  }

  public static ArrayList<String> CharacteristicPermissions_NativeToJSON(int permissions) {
    ArrayList<String> props = new ArrayList<>();

    if ((permissions & BluetoothGattCharacteristic.PERMISSION_READ) != 0x0) {
      props.add("read");
    }
    if ((permissions & BluetoothGattCharacteristic.PERMISSION_WRITE) != 0x0) {
      props.add("write");
    }
    if ((permissions & BluetoothGattCharacteristic.PERMISSION_READ_ENCRYPTED) != 0x0) {
      props.add("readEncrypted");
    }
    if ((permissions & BluetoothGattCharacteristic.PERMISSION_WRITE_ENCRYPTED) != 0x0) {
      props.add("writeEncrypted");
    }
    if ((permissions & BluetoothGattCharacteristic.PERMISSION_READ_ENCRYPTED_MITM) != 0x0) {
      props.add("readEncryptedMITM");
    }
    if ((permissions & BluetoothGattCharacteristic.PERMISSION_WRITE_ENCRYPTED_MITM) != 0x0) {
      props.add("writeEncryptedMITM");
    }
    if ((permissions & BluetoothGattCharacteristic.PERMISSION_WRITE_SIGNED) != 0x0) {
      props.add("writeSigned");
    }
    if ((permissions & BluetoothGattCharacteristic.PERMISSION_WRITE_SIGNED_MITM) != 0x0) {
      props.add("writeSignedMITM");
    }
    return props;
  }

  public static ArrayList<String> DescriptorPermissions_NativeToJSON(int permissions) {
    ArrayList<String> props = new ArrayList<>();

    if ((permissions & BluetoothGattDescriptor.PERMISSION_READ) != 0x0) {
      props.add("read");
    }
    if ((permissions & BluetoothGattDescriptor.PERMISSION_WRITE) != 0x0) {
      props.add("write");
    }
    if ((permissions & BluetoothGattDescriptor.PERMISSION_READ_ENCRYPTED) != 0x0) {
      props.add("readEncrypted");
    }
    if ((permissions & BluetoothGattDescriptor.PERMISSION_WRITE_ENCRYPTED) != 0x0) {
      props.add("writeEncrypted");
    }
    if ((permissions & BluetoothGattDescriptor.PERMISSION_READ_ENCRYPTED_MITM) != 0x0) {
      props.add("readEncryptedMITM");
    }
    if ((permissions & BluetoothGattDescriptor.PERMISSION_WRITE_ENCRYPTED_MITM) != 0x0) {
      props.add("writeEncryptedMITM");
    }
    if ((permissions & BluetoothGattDescriptor.PERMISSION_WRITE_SIGNED) != 0x0) {
      props.add("writeSigned");
    }
    if ((permissions & BluetoothGattDescriptor.PERMISSION_WRITE_SIGNED_MITM) != 0x0) {
      props.add("writeSignedMITM");
    }
    return props;
  }

  public static ArrayList<String> CharacteristicProperties_NativeToJSON(int properties) {

    ArrayList<String> props = new ArrayList();

    if ((properties & BluetoothGattCharacteristic.PROPERTY_BROADCAST) != 0x0) {
      props.add("broadcast");
    }
    if ((properties & BluetoothGattCharacteristic.PROPERTY_READ) != 0x0) {
      props.add("read");
    }
    if ((properties & BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) != 0x0) {
      props.add("writeWithoutResponse");
    }
    if ((properties & BluetoothGattCharacteristic.PROPERTY_WRITE) != 0x0) {
      props.add("write");
    }
    if ((properties & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0x0) {
      props.add("notify");
    }
    if ((properties & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0x0) {
      props.add("indicate");
    }
    if ((properties & BluetoothGattCharacteristic.PROPERTY_SIGNED_WRITE) != 0x0) {
      props.add("authenticateSignedWrites");
    }
    if ((properties & BluetoothGattCharacteristic.PROPERTY_EXTENDED_PROPS) != 0x0) {
      props.add("extendedProperties");
    }

    return props;
  }

  // TODO: Bacon: Add List
  public static int CharacteristicProperties_JSONToNative(String properties) {
    if (properties.equals("broadcast")) {
      return BluetoothGattCharacteristic.PROPERTY_BROADCAST;
    } else if (properties.equals("writeWithoutResponse")) {
      return BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE;
    } else if (properties.equals("write")) {
      return BluetoothGattCharacteristic.PROPERTY_WRITE;
    } else if (properties.equals("notify")) {
      return BluetoothGattCharacteristic.PROPERTY_NOTIFY;
    } else if (properties.equals("indicate")) {
      return BluetoothGattCharacteristic.PROPERTY_INDICATE;
    } else if (properties.equals("authenticateSignedWrites")) {
      return BluetoothGattCharacteristic.PROPERTY_SIGNED_WRITE;
    } else if (properties.equals("extendedProperties")) {
      return BluetoothGattCharacteristic.PROPERTY_EXTENDED_PROPS;
    } else if (properties.equals("read")) {
      return BluetoothGattCharacteristic.PROPERTY_READ;
    }
    return -1;
  }

  public static Bundle Descriptor_NativeToJSON(BluetoothGattDescriptor input, String peripheralUUIDString) {
    Bundle output = new Bundle();

    if (input == null) {
      return null;
    }

    String descriptorUUIDString = UUIDHelper.fromUUID(input.getUuid());
    String characteristicUUIDString = UUIDHelper.fromUUID(input.getCharacteristic().getUuid());
    String serviceUUIDString = UUIDHelper.fromUUID(input.getCharacteristic().getService().getUuid());

    output.putString("id", peripheralUUIDString + "|" + serviceUUIDString + "|" + characteristicUUIDString + "|" + descriptorUUIDString);
    output.putString("uuid", descriptorUUIDString);
    output.putString("characteristicUUID", characteristicUUIDString);

    output.putString("value", Base64Helper.fromBase64(input.getValue()));


    if (input.getPermissions() > 0) {
      output.putStringArrayList("permissions", Serialize.DescriptorPermissions_NativeToJSON(input.getPermissions()));
    }

    // TODO: Bacon: What do we do with the permissions?

    return output;
  }

  // Characteristic

  public static ArrayList<Bundle> DescriptorList_NativeToJSON(List<BluetoothGattDescriptor> input, String peripheralUUIDString) {
    if (input == null) return null;

    ArrayList<Bundle> output = new ArrayList();
    for (BluetoothGattDescriptor value : input) {
      output.add(Serialize.Descriptor_NativeToJSON(value, peripheralUUIDString));
    }
    return output;
  }

  public static ArrayList<Bundle> CharacteristicList_NativeToJSON(List<BluetoothGattCharacteristic> input, String peripheralUUIDString) {
    if (input == null) return null;

    ArrayList<Bundle> output = new ArrayList();
    for (BluetoothGattCharacteristic value : input) {
      output.add(Serialize.Characteristic_NativeToJSON(value, peripheralUUIDString));
    }
    return output;
  }

  public static Bundle Characteristic_NativeToJSON(BluetoothGattCharacteristic characteristic, String peripheralUUIDString) {
    if (characteristic == null) return null;

    Bundle output = new Bundle();

    String characteristicUUIDString = UUIDHelper.fromUUID(characteristic.getUuid());
    String serviceUUIDString = UUIDHelper.fromUUID(characteristic.getService().getUuid());

    output.putString("id", peripheralUUIDString + "|" + serviceUUIDString + "|" + characteristicUUIDString);
    output.putString("uuid", characteristicUUIDString);
    output.putString("serviceUUID", serviceUUIDString);
    output.putString("peripheralUUID", peripheralUUIDString);
    output.putStringArrayList("properties", Serialize.CharacteristicProperties_NativeToJSON(characteristic.getProperties()));
    output.putString("value", Base64Helper.fromBase64(characteristic.getValue()));
    if (characteristic.getPermissions() > 0) {
      output.putStringArrayList("permissions", Serialize.CharacteristicPermissions_NativeToJSON(characteristic.getPermissions()));
    }
    output.putParcelableArrayList("descriptors", Serialize.DescriptorList_NativeToJSON(characteristic.getDescriptors(), peripheralUUIDString));

    BluetoothGattDescriptor descriptor = characteristic.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG_UUID);
    boolean isNotifying = false;
    if (descriptor != null) {
      byte[] descriptorValue = descriptor.getValue();
      if (descriptorValue != null) {
        isNotifying = (descriptorValue[0] & 0x01) != 0;
      }
    }
    output.putBoolean("isNotifying", isNotifying);

    return output;
  }

  // Central

  public static Bundle BluetoothAdapter_NativeToJSON(BluetoothAdapter input, boolean isDiscovering) {
    if (input == null) return null;


    Bundle map = new Bundle();


    // Parity
    map.putString("state", Serialize.AdapterState_NativeToJSON(input.getState()));
    map.putBoolean("isDiscovering", input.isDiscovering());
    map.putBoolean("isDiscoverable", input.getScanMode() == BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE);

    // Android only
    map.putBoolean("isOffloadedScanBatchingSupported", input.isOffloadedScanBatchingSupported());
    map.putBoolean("isEnabled", input.isEnabled());
    map.putString("name", input.getName());
    map.putString("address", input.getAddress());
    map.putBoolean("isMultipleAdvertisementSupported", input.isMultipleAdvertisementSupported());
    map.putBoolean("isOffloadedFilteringSupported", input.isOffloadedFilteringSupported());
    map.putBoolean("isOffloadedScanBatchingSupported", input.isOffloadedScanBatchingSupported());
    map.putString("scanMode", Serialize.BluetoothAdapterScanMode_NativeToJSON(input.getScanMode()));

    map.putBoolean("isScanning", isDiscovering);
    // Oreo
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      map.putBoolean("isLe2MPhySupported", input.isLe2MPhySupported());
      map.putBoolean("isLeCodedPhySupported", input.isLeCodedPhySupported());
      map.putBoolean("isLeExtendedAdvertisingSupported", input.isLeExtendedAdvertisingSupported());
      map.putBoolean("isLePeriodicAdvertisingSupported", input.isLePeriodicAdvertisingSupported());
      map.putInt("leMaximumAdvertisingDataLength", input.getLeMaximumAdvertisingDataLength());
    }

    return map;

  }

  public static String BluetoothAdapterScanMode_NativeToJSON(int input) {
    switch (input) {
      case BluetoothAdapter.SCAN_MODE_NONE:
        return "none";
      case BluetoothAdapter.SCAN_MODE_CONNECTABLE:
        return "connectable";
      case BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE:
        return "discoverable";
      default:
        return null;
    }
  }

  public static String Priority_NativeToJSON(int input) {
    switch (input) {
      case BluetoothGatt.CONNECTION_PRIORITY_BALANCED:
        /**
         * Connection paramter update - Use the connection paramters recommended by the
         * Bluetooth SIG. This is the default value if no connection parameter update
         * is requested.
         */
        return BluetoothConstants.PRIORITY.BALANCED;
      case BluetoothGatt.CONNECTION_PRIORITY_HIGH:
        /**
         * Connection paramter update - Request a high priority, low latency connection.
         * An application should only request high priority connection paramters to transfer
         * large amounts of data over LE quickly. Once the transfer is complete, the application
         * should request {@link BluetoothGatt#CONNECTION_PRIORITY_BALANCED} connectoin parameters
         * to reduce energy use.
         */
        return BluetoothConstants.PRIORITY.HIGH;
      case BluetoothGatt.CONNECTION_PRIORITY_LOW_POWER:
        /** Connection paramter update - Request low power, reduced data rate connection parameters. */
        return BluetoothConstants.PRIORITY.LOW_POWER;
      default:
        return "unknown";
    }
  }

  public static int Priority_JSONToNative(String input) {
    if (input.equals(BluetoothConstants.PRIORITY.BALANCED)) {
      return BluetoothGatt.CONNECTION_PRIORITY_BALANCED;
    } else if (input.equals(BluetoothConstants.PRIORITY.HIGH)) {
      return BluetoothGatt.CONNECTION_PRIORITY_HIGH;
    } else if (input.equals(BluetoothConstants.PRIORITY.LOW_POWER)) {
      return BluetoothGatt.CONNECTION_PRIORITY_LOW_POWER;
    }
    return -1;
  }

  public static String Bonding_NativeToJSON(int input) {
    switch (input) {
      case BluetoothDevice.BOND_BONDED:
        return BluetoothConstants.BONDING.BONDED;
      case BluetoothDevice.BOND_BONDING:
        return BluetoothConstants.BONDING.BONDING;
      case BluetoothDevice.BOND_NONE:
        return BluetoothConstants.BONDING.NONE;
      default:
        return BluetoothConstants.BONDING.UNKNOWN;
    }
  }

  public static String AdapterState_NativeToJSON(int input) {
    switch (input) {
      case BluetoothAdapter.STATE_TURNING_OFF:
        return "poweringOff";
      case BluetoothAdapter.STATE_OFF:
        return "poweredOff";
      case BluetoothAdapter.STATE_TURNING_ON:
        return "poweringOn";
      case BluetoothAdapter.STATE_ON:
        return "poweredOn";
      default:
        return "unknown";
    }
  }

  // Service

  public static ArrayList<Bundle> ServiceList_NativeToJSON(List<BluetoothGattService> input, String peripheralUUIDString) {
    if (input == null) return null;

    ArrayList<Bundle> output = new ArrayList();
    for (BluetoothGattService value : input) {
      output.add(Serialize.Service_NativeToJSON(value, peripheralUUIDString));
    }
    return output;
  }

  public static Bundle Service_NativeToJSON(BluetoothGattService input, String peripheralUUIDString) {
    if (input == null) return null;

    String serviceUUIDString = UUIDHelper.fromUUID(input.getUuid());

    Bundle output = new Bundle();
    output.putString("id", peripheralUUIDString + "|" + serviceUUIDString);
    output.putString("uuid", serviceUUIDString);
    output.putString("peripheralUUID", peripheralUUIDString);
    output.putBoolean("isPrimary", input.getType() == BluetoothGattService.SERVICE_TYPE_PRIMARY);
    output.putParcelableArrayList("includedServices", Serialize.ServiceList_NativeToJSON(input.getIncludedServices(), peripheralUUIDString));
    output.putParcelableArrayList("characteristics", Serialize.CharacteristicList_NativeToJSON(input.getCharacteristics(), peripheralUUIDString));
    return output;
  }

  // Else

  public static String messageForGATTStatus(int input) {
    switch (input) {
      case BluetoothGatt.GATT_SUCCESS:
        return "GATT operation completed successfully";
      case BluetoothGatt.GATT_READ_NOT_PERMITTED:
        return "GATT read operation is not permitted";
      case BluetoothGatt.GATT_WRITE_NOT_PERMITTED:
        return "GATT write operation is not permitted";
      case BluetoothGatt.GATT_INSUFFICIENT_AUTHENTICATION:
        return "Insufficient authentication for a given operation";
      case BluetoothGatt.GATT_REQUEST_NOT_SUPPORTED:
        return "The given request is not supported";
      case BluetoothGatt.GATT_INSUFFICIENT_ENCRYPTION:
        return "Insufficient encryption for a given operation";
      case BluetoothGatt.GATT_INVALID_OFFSET:
        return "Read or write operation was requested with an invalid offset";
      case BluetoothGatt.GATT_INVALID_ATTRIBUTE_LENGTH:
        return "Write operation exceeds the maximum length of the attribute";
      case BluetoothGatt.GATT_CONNECTION_CONGESTED:
        return "Remote device connection is congested";
      case BluetoothGatt.GATT_FAILURE:
        return "GATT operation failed";
      default:
        return "An unknown GATT error occurred " + input;
    }
  }

  public static int ScanMode_JSONToNative(String input) {
    if (input.equals("lowLatency")) {
      return ScanSettings.SCAN_MODE_LOW_LATENCY;
    } else if (input.equals("lowPower")) {
      return ScanSettings.SCAN_MODE_LOW_POWER;
    } else if (input.equals("balanced")) {
      return ScanSettings.SCAN_MODE_BALANCED;
    } else {
      return ScanSettings.SCAN_MODE_OPPORTUNISTIC;
    }
  }

  public static String bondingState_NativeToJSON(int bondState) {
    if (bondState == BluetoothDevice.BOND_BONDED) {
      return "connected";
    } else if (bondState == BluetoothDevice.BOND_BONDING) {
      return "connecting";
    } else {
      return "disconnected";
    }
  }
}
