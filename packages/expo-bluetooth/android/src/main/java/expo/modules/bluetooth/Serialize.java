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
import android.os.ParcelUuid;
import android.util.Base64;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class Serialize {

  private final static char[] hexArray = "0123456789ABCDEF".toCharArray();

  public static ArrayList<UUID> UUIDList_JSONToNative(ArrayList<String> input) {
    ArrayList<UUID> output = new ArrayList<>();

    for (String uuidString : input) {
      output.add(UUIDHelper.uuidFromString(uuidString));
    }
    return output;
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
      // Android calls this "write with signature", using iOS name for now
      props.add("authenticateSignedWrites");
    }

    if ((properties & BluetoothGattCharacteristic.PROPERTY_EXTENDED_PROPS) != 0x0) {
      props.add("extendedProperties");
    }

    return props;
  }

  public static Bundle Descriptor_NativeToJSON(BluetoothGattDescriptor input, String peripheralUUIDString) {
    Bundle output = new Bundle();

    if (input == null) {
      return null;
    }

    String descriptorUUIDString = UUIDHelper.uuidToString(input.getUuid());
    String characteristicUUIDString = UUIDHelper.uuidToString(input.getCharacteristic().getUuid());
    String serviceUUIDString = UUIDHelper.uuidToString(input.getCharacteristic().getService().getUuid());

    output.putString("id", peripheralUUIDString + "|" + serviceUUIDString + "|" + characteristicUUIDString + "|" + descriptorUUIDString);
    output.putString("uuid", descriptorUUIDString);
    output.putString("characteristicUUID", characteristicUUIDString);
//    output.putParcelableArrayList("value", Serialize.bytesToWritableArray(input.getValue()));
    output.putString("value", Base64.encodeToString(input.getValue(), Base64.NO_WRAP));

    if (input.getPermissions() > 0) {
      output.putStringArrayList("permissions", Serialize.DescriptorPermissions_NativeToJSON(input.getPermissions()));
    }

    // TODO: Bacon: What do we do with the permissions?

    return output;
  }

  public static ArrayList<Bundle> DescriptorList_NativeToJSON(List<BluetoothGattDescriptor> input, String peripheralUUIDString) {
    ArrayList<Bundle> output = new ArrayList();
    for (BluetoothGattDescriptor value : input) {
      output.add(Serialize.Descriptor_NativeToJSON(value, peripheralUUIDString));
    }
    return output;
  }

  // Characteristic

  public static ArrayList<Bundle> CharacteristicList_NativeToJSON(List<BluetoothGattCharacteristic> input, String peripheralUUIDString) {
    ArrayList<Bundle> output = new ArrayList();
    for (BluetoothGattCharacteristic value : input) {
      output.add(Serialize.Characteristic_NativeToJSON(value, peripheralUUIDString));
    }
    return output;
  }

  public static Bundle Characteristic_NativeToJSON(BluetoothGattCharacteristic characteristic, String peripheralUUIDString) {
    Bundle output = new Bundle();


    String characteristicUUIDString = UUIDHelper.uuidToString(characteristic.getUuid());
    String serviceUUIDString = UUIDHelper.uuidToString(characteristic.getService().getUuid());


    output.putString("id", peripheralUUIDString + "|" + serviceUUIDString + "|" + characteristicUUIDString);
    output.putString("uuid", characteristicUUIDString);
    output.putString("serviceUUID", serviceUUIDString);
    output.putString("peripheralUUID", peripheralUUIDString);
    output.putStringArrayList("properties", Serialize.CharacteristicProperties_NativeToJSON(characteristic.getProperties()));
//    output.putParcelableArrayList("value", Serialize.bytesToWritableArray(characteristic.getValue()));
    output.putString("value", Base64.encodeToString(characteristic.getValue(), Base64.NO_WRAP));
    if (characteristic.getPermissions() > 0) {
      output.putStringArrayList("permissions", Serialize.decodePermissions(characteristic));
    }

    output.putParcelableArrayList("descriptors", Serialize.DescriptorList_NativeToJSON(characteristic.getDescriptors(), peripheralUUIDString));

    // TODO: Bacon: [iOS] isNotifying ??

    return output;
  }

  // Central

  public static Bundle BluetoothAdapter_NativeToJSON(BluetoothAdapter input) {

    if (input != null) {

      Bundle map = new Bundle();

      // Parity
      map.putString("state", Serialize.AdapterState_NativeToJSON(input.getState()));
      map.putBoolean("isScanning", input.isDiscovering());

      // Android only
      map.putBoolean("isOffloadedScanBatchingSupported", input.isOffloadedScanBatchingSupported());
      map.putBoolean("isEnabled", input.isEnabled());
      map.putString("name", input.getName());
      map.putString("address", input.getAddress());
      map.putBoolean("isMultipleAdvertisementSupported", input.isMultipleAdvertisementSupported());
      map.putBoolean("isOffloadedFilteringSupported", input.isOffloadedFilteringSupported());
      map.putBoolean("isOffloadedScanBatchingSupported", input.isOffloadedScanBatchingSupported());
      map.putString("scanMode", Serialize.BluetoothAdapterScanMode_NativeToJSON(input.getScanMode()));

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
    return null;
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
    ArrayList<Bundle> output = new ArrayList();
    for (BluetoothGattService value : input) {
      output.add(Serialize.Service_NativeToJSON(value, peripheralUUIDString));
    }
    return output;
  }

  public static Bundle Service_NativeToJSON(BluetoothGattService input, String peripheralUUIDString) {
    if (input == null) return null;

    String serviceUUIDString = UUIDHelper.uuidToString(input.getUuid());

    Bundle output = new Bundle();
    output.putString("id", peripheralUUIDString + "|" + serviceUUIDString);
    output.putString("uuid", serviceUUIDString);
    output.putString("peripheralUUID", peripheralUUIDString);

//    output.putBoolean("isPrimary", input.);
    output.putParcelableArrayList("includedServices", Serialize.ServiceList_NativeToJSON(input.getIncludedServices(), peripheralUUIDString));
    output.putParcelableArrayList("characteristics", Serialize.CharacteristicList_NativeToJSON(input.getCharacteristics(), peripheralUUIDString));
    return output;
  }

  // Else

  public static String messageForGATTStatus(int input) {
    switch (input) {
      case BluetoothGatt.GATT_SUCCESS:
        return "A GATT operation completed successfully";
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
        return "A read or write operation was requested with an invalid offset";
      case BluetoothGatt.GATT_INVALID_ATTRIBUTE_LENGTH:
        return "A write operation exceeds the maximum length of the attribute";
      case BluetoothGatt.GATT_CONNECTION_CONGESTED:
        return "A remote device connection is congested";
      case BluetoothGatt.GATT_FAILURE:
        return "A GATT operation failed, errors other than the above";
      default:
        return "An uknown error occured";
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

  public static String bytesToHex(byte[] bytes) {
    char[] hexChars = new char[bytes.length * 2];
    for (int j = 0; j < bytes.length; j++) {
      int v = bytes[j] & 0xFF;
      hexChars[j * 2] = hexArray[v >>> 4];
      hexChars[j * 2 + 1] = hexArray[v & 0x0F];
    }
    return new String(hexChars);
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

  // Peripheral

  public static ArrayList PeripheralList_NativeToJSON(List<Peripheral> input) {
    ArrayList output = new ArrayList();
    for (Peripheral peripheral : input) {
      output.add(Serialize.Peripheral_NativeToJSON(peripheral));
    }
    return output;
  }

  public static Bundle Peripheral_NativeToJSON(Peripheral input) {
      Bundle map = new Bundle();

      try {
        String name = input.device.getName();
        map.putString("name", name);
        map.putString("id", input.getUUIDString()); // mac address
        map.putString("uuid", input.getUUIDString()); // mac address
//        map.putInt("rssi", input.advertisingRSSI);
        map.putString("state", Serialize.bondingState_NativeToJSON(input.device.getBondState()));

        ArrayList services = new ArrayList();
        if (input.gatt != null) {
          services = Serialize.ServiceList_NativeToJSON(input.gatt.getServices(), input.getUUIDString());
        }
        map.putParcelableArrayList("services", services);

//        map.putBundle("advertisementData", input.advertisementData());
      } catch (Exception e) { // this shouldn't happen
        e.printStackTrace();
      }

      return map;
  }

}
