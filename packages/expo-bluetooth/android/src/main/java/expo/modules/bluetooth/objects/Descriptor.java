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
    super(nativeData, (parent instanceof EXBluetoothObject) ? parent : new Characteristic(nativeData.getCharacteristic(), parent));
  }

  @Override
  public UUID getUUID() {
    return getDescriptor().getUuid();
  }

  @Override
  public Bundle toJSON() {
    Bundle output = super.toJSON();

    BluetoothGattDescriptor input = getDescriptor();

    output.putString(BluetoothConstants.JSON.CHARACTERISTIC_UUID, UUIDHelper.fromUUID(input.getCharacteristic().getUuid()));
    output.putString(BluetoothConstants.JSON.VALUE, Base64Helper.fromBase64(input.getValue()));
    if (input.getPermissions() > 0) {
      output.putStringArrayList(BluetoothConstants.JSON.PERMISSIONS, Serialize.DescriptorPermissions_NativeToJSON(input.getPermissions()));
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

  public boolean setValue(byte[] data) {
    return getDescriptor().setValue(data);
  }

  @Override
  protected Bundle sendEvent(String transaction, String eventName, int status) {
    Bundle output = super.sendEvent(transaction, eventName, status);
    output.putBundle(BluetoothConstants.JSON.DESCRIPTOR, toJSON());
    BluetoothModule.sendEvent(eventName, output);
    return output;
  }
}
