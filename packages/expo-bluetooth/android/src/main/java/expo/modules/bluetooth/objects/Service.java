package expo.modules.bluetooth.objects;

import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattService;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import expo.core.Promise;
import expo.modules.bluetooth.BluetoothConstants;
import expo.modules.bluetooth.helpers.UUIDHelper;


// Device -> Service -> Characteristic -> Descriptor
public class Service extends EXBluetoothChildObject {

  public Service(BluetoothGattService nativeData, Object parent) {
    super(nativeData, (parent instanceof EXBluetoothObjectInterface) ? parent : new Peripheral((BluetoothGatt) parent));
  }

  @Override
  public UUID getUUID() {
    BluetoothGattService service = getService();
    if (service == null) {
      return null;
    }
    return service.getUuid();
  }
  
  // TODO: Bacon: Test characteristicProperties query works / is standard
  public Characteristic getCharacteristic(UUID uuid, int characteristicProperties) {
    BluetoothGattService service = getService();
    if (service == null) {
      return null;
    }
    BluetoothGattCharacteristic characteristic = service.getCharacteristic(uuid);
    if (characteristic == null) return null;
    if ((characteristic.getProperties() & characteristicProperties) != 0) {
      return new Characteristic(characteristic, this);
    }
    return null;
  }

  public Characteristic getCharacteristic(UUID uuid) {
    return getCharacteristic(UUIDHelper.toString(uuid));
//    BluetoothGattCharacteristic characteristic = getService().getCharacteristic(uuid);
//    if (characteristic == null) return null;
//    return new Characteristic(characteristic, this);
  }

  public List<Characteristic> getCharacteristics() {
    BluetoothGattService service = getService();
    if (service == null) {
      return null;
    }
    List<BluetoothGattCharacteristic> input = service.getCharacteristics();

    ArrayList output = new ArrayList<>(input.size());
    for (BluetoothGattCharacteristic value : input) {
      output.add(new Characteristic(value, this));
    }
    return output;
  }

  public List<Service> getIncludedServices() {
    BluetoothGattService service = getService();
    if (service == null) {
      return null;
    }
    List<BluetoothGattService> input = service.getIncludedServices();

    ArrayList output = new ArrayList<>(input.size());
    for (BluetoothGattService value : input) {
      output.add(new Service(value, mParent));
    }
    return output;
  }

  @Override
  public Bundle toJSON() {
    Bundle output = super.toJSON();
    if (getPeripheral() != null) {
      output.putString(BluetoothConstants.JSON.PERIPHERAL_UUID, getPeripheral().getID());
    }

    output.putBoolean(BluetoothConstants.JSON.IS_PRIMARY, getType() == BluetoothGattService.SERVICE_TYPE_PRIMARY);
    output.putParcelableArrayList(BluetoothConstants.JSON.INCLUDED_SERVICES, EXBluetoothObject.listToJSON((List)getIncludedServices()));
    output.putParcelableArrayList(BluetoothConstants.JSON.CHARACTERISTICS, EXBluetoothObject.listToJSON((List)getCharacteristics()));
    return output;
  }

  protected int getType() {
    BluetoothGattService service = getService();
    if (service != null) {
      return service.getType();
    }
    return BluetoothGattService.SERVICE_TYPE_SECONDARY;
  }

  private BluetoothGattService getService() {
    return (BluetoothGattService) getNativeData();
  }


  // TODO: Bacon: Integrated
  public Bundle discoverIncludedServices(ArrayList<UUID> includedServicesUUIDs, Promise promise) {
    // TODO: Emit full state
    // TODO: Bacon: How do we refresh these?
    Bundle output = new Bundle();
    output.putBundle(BluetoothConstants.JSON.SERVICE, toJSON());
    promise.resolve(output);
    return output;
  }

  public Bundle discoverCharacteristics(ArrayList<UUID> characteristicUUIDs, Promise promise) {
    //TODO: Bacon: Are these gotten automatically?
    Bundle output = new Bundle();
//    Bundle peripheralData = getPeripheral().toJSON();
//    output.putBundle(BluetoothConstants.JSON.PERIPHERAL, peripheralData);
    output.putBundle(BluetoothConstants.JSON.SERVICE, toJSON());
    promise.resolve(output);
    return output;
  }

  @Override
  public EXBluetoothChildObject getChild(String uuid) {
    EXBluetoothChildObject child = super.getChild(uuid);
    if (child != null) {
      return child;
    }

    BluetoothGattService service = getService();
    if (service == null) {
      return null;
    }

    BluetoothGattCharacteristic nativeCharacteristic = service.getCharacteristic(UUIDHelper.toUUID(uuid));
    if (nativeCharacteristic != null) {
      Characteristic characteristic = new Characteristic(nativeCharacteristic, getPeripheral().mGatt);
      mChildren.put(uuid, characteristic);
      return characteristic;
    }
    return null;
  }

  public Characteristic getCharacteristic(String uuid) {
    EXBluetoothChildObject child = getChild(uuid);
    if (child != null) {
      return (Characteristic) child;
    }
    return null;
  }

  public Descriptor getDescriptor(String uuid) {
    Characteristic child = getCharacteristic(uuid);
    if (child != null) {
      return child.getDescriptor(uuid);
    }
    return null;
  }
}
