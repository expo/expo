package expo.modules.bluetooth.objects;

import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattService;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import expo.modules.bluetooth.BluetoothConstants;


// Device -> Service -> Characteristic -> Descriptor
public class Service extends EXBluetoothChildObject {

  public Service(BluetoothGattService nativeData, Object parent) {
    super(nativeData, (parent instanceof EXBluetoothObject) ? parent : new Peripheral((BluetoothGatt) parent));
  }

  public Characteristic getCharacteristic(UUID uuid) {
    BluetoothGattCharacteristic characteristic = getService().getCharacteristic(uuid);
    if (characteristic == null) return null;
    return new Characteristic(characteristic, this);
  }

  public List<Characteristic> getCharacteristics() {
    List<BluetoothGattCharacteristic> input = getService().getCharacteristics();

    ArrayList output = new ArrayList<>(input.size());
    for (BluetoothGattCharacteristic value : input) {
      output.add(new Characteristic(value, this));
    }
    return output;
  }

  public List<Service> getIncludedServices() {
    List<BluetoothGattService> input = getService().getIncludedServices();

    ArrayList output = new ArrayList<>(input.size());
    for (BluetoothGattService value : input) {
      output.add(new Service(value, mParent));
    }
    return output;
  }

  @Override
  public Bundle toJSON() {
    Bundle output = super.toJSON();
    output.putString(BluetoothConstants.JSON.PERIPHERAL_UUID, getPeripheral().getID());
    output.putBoolean(BluetoothConstants.JSON.IS_PRIMARY, getService().getType() == BluetoothGattService.SERVICE_TYPE_PRIMARY);
    output.putParcelableArrayList(BluetoothConstants.JSON.INCLUDED_SERVICES, EXBluetoothObject.listToJSON((List)getIncludedServices()));
    output.putParcelableArrayList(BluetoothConstants.JSON.CHARACTERISTICS, EXBluetoothObject.listToJSON((List)getCharacteristics()));
    return output;
  }

  private BluetoothGattService getService() {
    return (BluetoothGattService) getNativeData();
  }

}
