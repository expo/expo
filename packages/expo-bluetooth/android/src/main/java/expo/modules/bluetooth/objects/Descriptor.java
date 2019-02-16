package expo.modules.bluetooth.objects;

import android.bluetooth.BluetoothGattDescriptor;
import android.os.Bundle;

import java.util.UUID;

import expo.core.Promise;
import expo.modules.bluetooth.BluetoothConstants;
import expo.modules.bluetooth.BluetoothModule;
import expo.modules.bluetooth.Serialize;
import expo.modules.bluetooth.helpers.Base64Helper;
import expo.modules.bluetooth.helpers.UUIDHelper;

public class Descriptor extends EXBluetoothChildObject {

  public Descriptor(BluetoothGattDescriptor nativeData, Object parent) {
    super(nativeData, (parent instanceof EXBluetoothObjectInterface) ? parent : new Characteristic(nativeData.getCharacteristic(), parent));
  }

  @Override
  public UUID getUUID() {
    BluetoothGattDescriptor descriptor = getDescriptor();
    if (descriptor == null) {
      return null;
    }
    return descriptor.getUuid();
  }

  @Override
  public Bundle toJSON() {
    Bundle output = super.toJSON();

    BluetoothGattDescriptor descriptor = getDescriptor();
    if (descriptor == null) {
      return output;
    }

    String uuidString = (String) output.get(BluetoothConstants.JSON.UUID);
    // TODO: Bacon: Maybe add parsed value.
    output.putString("type", "descriptor");
    output.putString(BluetoothConstants.JSON.CHARACTERISTIC_UUID, UUIDHelper.toString(descriptor.getCharacteristic().getUuid()));
    output.putString(BluetoothConstants.JSON.VALUE, Base64Helper.fromBase64(descriptor.getValue()));
    if (descriptor.getPermissions() > 0) {
      output.putStringArrayList(BluetoothConstants.JSON.PERMISSIONS, Serialize.DescriptorPermissions_NativeToJSON(descriptor.getPermissions()));
    }
    // TODO: Bacon: What do we do with the permissions?
    return output;
  }

  protected BluetoothGattDescriptor getDescriptor() {
    return (BluetoothGattDescriptor) getNativeData();
  }

  public boolean setShouldNotifiy(boolean enable, final Promise promise) {
    if (getPeripheral().mGatt != null) {
      if (enable) {
        getDescriptor().setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
      } else {
        getDescriptor().setValue(BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
      }
      return getPeripheral().mGatt.writeDescriptor(getDescriptor());
    }
    return false;
  }

  public Descriptor setValue(byte[] data) {
    BluetoothGattDescriptor descriptor = getDescriptor();
    if (descriptor == null) {
      return this;
    }
    descriptor.setValue(data);
    return this;
  }

  @Override
  protected Bundle sendEvent(String eventName, int status) {
    Bundle output = super.sendEvent(eventName, status);
    output.putBundle(BluetoothConstants.JSON.DESCRIPTOR, toJSON());
    BluetoothModule.sendEvent(eventName, output);
    return output;
  }
}
