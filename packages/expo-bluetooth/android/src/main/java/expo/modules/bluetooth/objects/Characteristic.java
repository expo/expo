package expo.modules.bluetooth.objects;

import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.UUID;

import expo.core.Promise;
import expo.modules.bluetooth.BluetoothConstants;
import expo.modules.bluetooth.BluetoothError;
import expo.modules.bluetooth.BluetoothModule;
import expo.modules.bluetooth.Serialize;
import expo.modules.bluetooth.helpers.Base64Helper;
import expo.modules.bluetooth.helpers.UUIDHelper;

public class Characteristic extends EXBluetoothChildObject {
  public static final UUID CLIENT_CHARACTERISTIC_CONFIG_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

  public Characteristic(BluetoothGattCharacteristic nativeData, Object parent) {
    super(nativeData, (parent instanceof EXBluetoothObject) ? parent : new Service(nativeData.getService(), parent));
  }

  public Descriptor getDescriptor(UUID uuid) {
    BluetoothGattDescriptor child = getCharacteristic().getDescriptor(uuid);
    if (child == null) return null;
    return new Descriptor(child, this);
  }

  @Override
  protected Bundle sendEvent(String transaction, String eventName, int status) {
    Bundle output = super.sendEvent(transaction, eventName, status);
    output.putBundle(BluetoothConstants.JSON.CHARACTERISTIC, toJSON());
    BluetoothModule.sendEvent(eventName, output);
    return output;
  }

  public BluetoothGattCharacteristic getCharacteristic() {
    return (BluetoothGattCharacteristic) getNativeData();
  }

  @Override
  public UUID getUUID() {
    return getCharacteristic().getUuid();
  }

  @Override
  public Bundle toJSON() {

    BluetoothGattCharacteristic characteristic = getCharacteristic();
    String peripheralUUIDString = getPeripheral().getID();

    Bundle output = super.toJSON();

    String serviceUUIDString = UUIDHelper.fromUUID(characteristic.getService().getUuid());

    output.putString(BluetoothConstants.JSON.SERVICE_UUID, serviceUUIDString);
    output.putString(BluetoothConstants.JSON.PERIPHERAL_UUID, peripheralUUIDString);
    output.putStringArrayList(BluetoothConstants.JSON.PROPERTIES, Serialize.CharacteristicProperties_NativeToJSON(characteristic.getProperties()));
    output.putString(BluetoothConstants.JSON.VALUE, Base64Helper.fromBase64(characteristic.getValue()));
    if (characteristic.getPermissions() > 0) {
      output.putStringArrayList(BluetoothConstants.JSON.PERMISSIONS, Serialize.CharacteristicPermissions_NativeToJSON(characteristic.getPermissions()));
    }
    output.putParcelableArrayList(BluetoothConstants.JSON.DESCRIPTORS, Serialize.DescriptorList_NativeToJSON(characteristic.getDescriptors(), peripheralUUIDString));

    BluetoothGattDescriptor descriptor = characteristic.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG_UUID);
    boolean isNotifying = false;
    if (descriptor != null) {
      byte[] descriptorValue = descriptor.getValue();
      if (descriptorValue != null) {
        isNotifying = (descriptorValue[0] & 0x01) != 0;
      }
    }
    output.putBoolean(BluetoothConstants.JSON.IS_NOTIFYING, isNotifying);
    return output;
  }

  public boolean setValue(byte[] data) {
    return getCharacteristic().setValue(data);
  }

  public void discoverDescriptors(Promise promise) {
    //TODO: Bacon: Are these gotten automatically?
    Bundle output = new Bundle();
    output.putString(BluetoothConstants.JSON.TRANSACTION_ID, transactionIdForOperation(BluetoothConstants.OPERATIONS.SCAN));
    output.putBundle(BluetoothConstants.JSON.PERIPHERAL, getPeripheral().toJSON());
    output.putBundle(BluetoothConstants.JSON.SERVICE, getParent().toJSON());
//    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE, output);
    promise.resolve(output);
  }
}
