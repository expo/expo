package expo.modules.bluetooth.objects;

import android.app.Activity;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.ScanRecord;
import android.os.Build;
import android.os.Bundle;
import android.os.ParcelUuid;
import android.util.Base64;
import android.util.Log;

import java.io.Serializable;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import expo.core.Promise;
import expo.modules.bluetooth.BluetoothConstants;
import expo.modules.bluetooth.BluetoothError;
import expo.modules.bluetooth.BluetoothModule;
import expo.modules.bluetooth.Serialize;
import expo.modules.bluetooth.helpers.PromiseListHashMap;
import expo.modules.bluetooth.helpers.UUIDHelper;

// Wrapper for GATT because GATT can access Device
public class Peripheral implements EXBluetoothObjectInterface, EXBluetoothParentObjectInterface {

  public BluetoothGatt mGatt;
  private int mRSSI;
  private int mMTU;
  private Promise mDidDisconnectPeripheralBlock;
  private HashMap<String, Promise> mDidConnectPeripheralBlock = new HashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mWriteCharacteristicPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mWriteDescriptorPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mReadCharacteristicPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mReadDescriptorPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mNotifyCharacteristicPromises = new PromiseListHashMap<>();
  private HashMap<String, Promise> mDidDiscoverServicesBlock = new HashMap<>();
  private Promise mMTUBlock;
  private Promise mRSSIBlock;
  private ScanRecord advertisingData;
  private byte[] advertisingDataBytes;
  private HashMap<String, Service> mServices;

  private String mDeviceID;
  public Peripheral(String deviceID, int RSSI, ScanRecord scanRecord) {
    mDeviceID = deviceID;
    mRSSI = RSSI;
    advertisingData = scanRecord;
    advertisingDataBytes = scanRecord.getBytes();
  }

  public Peripheral(String deviceID) {
//    connectToGATT(activity);
    mDeviceID = deviceID;
  }

  public Peripheral(BluetoothGatt gatt) {
    mGatt = gatt;
    mDeviceID = gatt.getDevice().getAddress();
  }

  public static ArrayList<Bundle> listToJSON(List<Peripheral> input) {
    if (input == null) {
      return null;
    }

    ArrayList<Bundle> output = new ArrayList();
    for (Peripheral value : input) {
      output.add(value.toJSON());
    }
    return output;
  }

  public BluetoothDevice getDevice() {
    if (mGatt != null) {
      return mGatt.getDevice();
    }
    /** Alternative to caching the immutable device instance */
    return BluetoothModule.bluetoothManager.getAdapter().getRemoteDevice(getID());
  }

  @Override
  public UUID getUUID() {
    return null;
  }

  @Override
  public Bundle toJSON() {

    Bundle output = new Bundle();

    ArrayList<Bundle> services = Service.listToJSON((List) getServices());
    output.putParcelableArrayList(BluetoothConstants.JSON.SERVICES, services);
    output.putString(BluetoothConstants.JSON.NAME, getDevice().getName());
    output.putString(BluetoothConstants.JSON.ID, getID());
    output.putString(BluetoothConstants.JSON.UUID, getID());
    output.putString(BluetoothConstants.JSON.STATE, isConnected() ? "connected" : "disconnected");
    output.putInt(BluetoothConstants.JSON.RSSI, mRSSI);
    output.putString(BluetoothConstants.JSON.BOND_STATE, Serialize.bondingState_NativeToJSON(getBondState()));
    output.putBundle(BluetoothConstants.JSON.ADVERTISEMENT_DATA, advertisementData());

    if (mGatt != null) {
      output.putInt(BluetoothConstants.JSON.MTU, mMTU);
    } else {
      output.putInt(BluetoothConstants.JSON.MTU, 576); // TODO: Bacon: annotate
    }

    return output;
  }

  public List<Service> getServices() {
    ArrayList output = new ArrayList<>();
    if (mGatt != null && mGatt.getServices() != null && mGatt.getServices().size() > 0) {
      List<BluetoothGattService> input = mGatt.getServices();
      for (BluetoothGattService value : input) {
        output.add(new Service(value, mGatt));
      }
    }
    return output;
  }

  @Override
  public String getID() {
    return mDeviceID;
//    return getDevice().getAddress();
  }

  @Override
  public EXBluetoothObject getParent() {
    return null;
  }

  public void connect(Promise promise, Activity activity) {
    if (!isConnected()) {
      if (mDidConnectPeripheralBlock.containsKey(getID())) {
        BluetoothError.reject(promise, BluetoothError.CONCURRENT_TASK());
        return;
      }
      connectToGATT(activity);
      mDidConnectPeripheralBlock.put(getID(), promise);
      return;
    } else if (guardGATT(promise)) {
      return;
    } else {
      promise.resolve(toJSON());
      return;
    }
  }

  public int getBondState() {
    return getDevice().getBondState();
  }

  private void connectToGATT(Activity activity) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      mGatt = getDevice().connectGatt(activity, false, bluetoothGattCallback);
    } else {
      mGatt = getDevice().connectGatt(activity, false, bluetoothGattCallback, BluetoothDevice.TRANSPORT_LE);
    }
  }

  public void setGatt(BluetoothGatt gatt) {
    mGatt = gatt;
    mDeviceID = gatt.getDevice().getAddress();
  }

  private final BluetoothGattCallback bluetoothGattCallback = new BluetoothGattCallback() {
    @Override
    public void onPhyUpdate(BluetoothGatt gatt, int txPhy, int rxPhy, int status) {
      super.onPhyUpdate(gatt, txPhy, rxPhy, status);
    }

    @Override
    public void onPhyRead(BluetoothGatt gatt, int txPhy, int rxPhy, int status) {
      super.onPhyRead(gatt, txPhy, rxPhy, status);
    }

    @Override
    public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
      super.onConnectionStateChange(gatt, status, newState);

      setGatt(gatt);
//      mGatt = gatt;

      if (newState == BluetoothProfile.STATE_CONNECTED) {
        if (status == BluetoothGatt.GATT_SUCCESS) {
          BluetoothModule.connectedDevices.put(gatt.getDevice().getAddress(), gatt);
        }
//      getDevice().createBond();
        // Send Connection event
        sendEvent(BluetoothConstants.OPERATIONS.CONNECT, BluetoothConstants.EVENTS.CENTRAL_DID_CONNECT_PERIPHERAL, null);
        String UUIDString = getID();
        if (mDidConnectPeripheralBlock.containsKey(UUIDString)) {
          Promise promise = mDidConnectPeripheralBlock.get(UUIDString);
          if (shouldResolvePromiseWithStatusAndData(promise, status)) {
            promise.resolve(toJSON());
            BluetoothModule.emitState();
          }
          mDidConnectPeripheralBlock.remove(UUIDString);
        }
      } else { /** BluetoothProfile.STATE_DISCONNECTED */
        BluetoothModule.connectedDevices.remove(gatt.getDevice().getAddress());
        Log.d("BLE_TEST", "DISCONNECT" + getID() + ", connected: " + isConnected() + ", has callback: " + mDidDisconnectPeripheralBlock);
        if (mDidDisconnectPeripheralBlock != null) {
          if (shouldResolvePromiseWithStatusAndData(mDidDisconnectPeripheralBlock, status)) {
            mDidDisconnectPeripheralBlock.resolve(toJSON());
          }
          mDidDisconnectPeripheralBlock = null;
        }
        sendEvent(BluetoothConstants.OPERATIONS.DISCONNECT, BluetoothConstants.EVENTS.CENTRAL_DID_DISCONNECT_PERIPHERAL, null);
        BluetoothModule.emitState();
      }
    }

    @Override
    public void onServicesDiscovered(BluetoothGatt gatt, int status) {
      super.onServicesDiscovered(gatt, status);
      //    sendEvent(BluetoothConstants.OPERATIONS.SCAN, BluetoothConstants.EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL, BluetoothError.errorFromGattStatus(status));

      String id = getID();
      if (mDidDiscoverServicesBlock.containsKey(id)) {
        Promise promise = mDidDiscoverServicesBlock.get(id);
        if (shouldResolvePromiseWithStatusAndData(promise, status)) {
          Bundle output = new Bundle();
          output.putBundle(BluetoothConstants.JSON.PERIPHERAL, toJSON());
          promise.resolve(output);
          BluetoothModule.emitState();
        }
        mDidDiscoverServicesBlock.remove(id);
      }
    }

    @Override
    public void onCharacteristicRead(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
      super.onCharacteristicRead(gatt, characteristic, status);
      Characteristic input = new Characteristic(characteristic, gatt);

      Bundle output = input.sendEvent(BluetoothConstants.OPERATIONS.READ, BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC, status);

      ArrayList<Promise> promises = mReadCharacteristicPromises.get(input.getID());
      for (Promise promise : promises) {
        if (shouldResolvePromiseWithStatusAndData(promise, status)) {
          promise.resolve(output);
//        Bundle output = new Bundle();
//        output.putBundle(BluetoothConstants.JSON.CHARACTERISTIC, characteristicInstance.toJSON());
//        output.putBundle(BluetoothConstants.JSON.PERIPHERAL, this.toJSON());
//        /* peripheral, characteristic */
//        promise.resolve(output);
//        BluetoothModule.emitState();
        }
      }
      mReadCharacteristicPromises.clearKey(input.getID());
    }

    @Override
    public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
      super.onCharacteristicWrite(gatt, characteristic, status);
      Characteristic input = new Characteristic(characteristic, gatt);
      Bundle output = input.sendEvent(BluetoothConstants.OPERATIONS.WRITE, BluetoothConstants.EVENTS.PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC, status);

      ArrayList<Promise> promises = mWriteCharacteristicPromises.get(input.getID());
      for (Promise promise : promises) {
        if (shouldResolvePromiseWithStatusAndData(promise, status)) {
          promise.resolve(output);
        }
      }
      mWriteCharacteristicPromises.clearKey(input.getID());
    }

    /** Enable or disable notifications/indications for a given characteristic. */
    @Override
    public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
      super.onCharacteristicChanged(gatt, characteristic);
      Characteristic input = new Characteristic(characteristic, gatt);
      Bundle output = input.sendEvent(BluetoothConstants.OPERATIONS.NOTIFY, BluetoothConstants.EVENTS.PERIPHERAL_DID_CHANGE_NOTIFICATIONS_VALUE_FOR_CHARACTERISTIC, BluetoothGatt.GATT_SUCCESS);

      ArrayList<Promise> promises = mNotifyCharacteristicPromises.get(input.getID());
      for (Promise promise : promises) {
        promise.resolve(output);
      }
      mNotifyCharacteristicPromises.clearKey(input.getID());
    }

    @Override
    public void onDescriptorRead(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
      super.onDescriptorRead(gatt, descriptor, status);
      Descriptor input = new Descriptor(descriptor, gatt);

      Bundle output = input.sendEvent(BluetoothConstants.OPERATIONS.READ, BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR, status);

      ArrayList<Promise> promises = mReadDescriptorPromises.get(input.getID());
      for (Promise promise : promises) {
        if (shouldResolvePromiseWithStatusAndData(promise, status)) {
          promise.resolve(output);
//        Bundle output = new Bundle();
//        output.putBundle(BluetoothConstants.JSON.DESCRIPTOR, input.toJSON());
//        output.putBundle(BluetoothConstants.JSON.PERIPHERAL, this.toJSON());
//        /* peripheral, descriptor */
//        promise.resolve(output);
//        BluetoothModule.emitState();
        }
      }
      mReadDescriptorPromises.clearKey(input.getID());
    }

    @Override
    public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
      super.onDescriptorWrite(gatt, descriptor, status);

      Descriptor input = new Descriptor(descriptor, gatt);
      Bundle output = input.sendEvent(BluetoothConstants.OPERATIONS.WRITE, BluetoothConstants.EVENTS.PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR, status);

      ArrayList<Promise> promises = mWriteDescriptorPromises.get(input.getID());
      for (Promise promise : promises) {
        if (shouldResolvePromiseWithStatusAndData(promise, status)) {
          promise.resolve(output);
//        Bundle output = new Bundle();
//        output.putBundle(BluetoothConstants.JSON.CHARACTERISTIC, characteristic.toJSON());
//        output.putBundle(BluetoothConstants.JSON.PERIPHERAL, this.toJSON());
//        /* peripheral, descriptor */
//        promise.resolve(output);
//        BluetoothModule.emitState();
        }
      }
      mWriteDescriptorPromises.clearKey(input.getID());
//
//    String characteristicUUIDString = UUIDHelper.fromUUID(descriptor.getCharacteristic().getUuid());
//    if (_writeValueBlocks.containsKey(characteristicUUIDString)) {
//      Promise promise = _writeValueBlocks.get(characteristicUUIDString);
//      if (autoResolvePromiseWithStatusAndData(promise, status)) {
//        Characteristic characteristic = new Characteristic(descriptor.getCharacteristic(), gatt);
//        Bundle output = new Bundle();
//        output.putBundle(BluetoothConstants.JSON.CHARACTERISTIC, characteristic.toJSON());
//        output.putBundle(BluetoothConstants.JSON.PERIPHERAL, this.toJSON());
//        /* peripheral, descriptor */
//        promise.resolve(output);
//        BluetoothModule.emitState();
//      }
//      _writeValueBlocks.remove(characteristicUUIDString);
//    }
//    Descriptor input = new Descriptor(descriptor, gatt);
//    input.sendEvent(BluetoothConstants.OPERATIONS.WRITE, BluetoothConstants.EVENTS.PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR, status);
    }

    @Override
    public void onReliableWriteCompleted(BluetoothGatt gatt, int status) {
      super.onReliableWriteCompleted(gatt, status);
    }

    @Override
    public void onReadRemoteRssi(BluetoothGatt gatt, int rssi, int status) {
      super.onReadRemoteRssi(gatt, rssi, status);
      if (status == BluetoothGatt.GATT_SUCCESS) {
        updateRSSI(rssi);
      }

      if (mRSSIBlock != null) {
        if (shouldResolvePromiseWithStatusAndData(mRSSIBlock, status)) {
          mRSSIBlock.resolve(toJSON());
          BluetoothModule.emitState();
        }
        mRSSIBlock = null;
      }
      // TODO: Bacon: Send RSSI event here - not done on iOS either
    }

    @Override
    public void onMtuChanged(BluetoothGatt gatt, int mtu, int status) {
      super.onMtuChanged(gatt, mtu, status);
      mMTU = mtu;

      if (mMTUBlock != null) {
        if (shouldResolvePromiseWithStatusAndData(mMTUBlock, status)) {
          mMTUBlock.resolve(mtu);
          BluetoothModule.emitState();
        }
        mMTUBlock = null;
      }
    }
  };

  /**
   * BluetoothGatt has a refresh() method in but it's private.
   * We can only invoke it using reflections.
   */
  private static boolean refreshGattCacheIgnoringErrors(BluetoothGatt gatt) {
    try {
      final Method refreshGatt = BluetoothGatt.class.getMethod("refresh");
      if (refreshGatt != null) {
        final boolean success = (Boolean) refreshGatt.invoke(gatt);
        return success;
      } else {
        // If the method doesn't exist, we have no recourse. Just return false.
      }
    } catch (SecurityException e) {
      // TODO: Bacon: Do something with the security exception
    } catch (NoSuchMethodException e) {

    } catch (IllegalAccessException e) {

    } catch (IllegalArgumentException e) {

    } catch (Exception e) {

    }
    return false;
  }

  public static void closeGatt(BluetoothGatt gatt) {
    if (gatt != null) {
      gatt.disconnect();
      refreshGattCacheIgnoringErrors(gatt);
      gatt.close();
    }
  }

  public void disconnect() {
    disconnectGATT();
  }

  private void disconnectGATT() {
    clearChildren();
    if (mGatt != null) {
      closeGatt(mGatt);
      mGatt = null;
    }
  }

  // TODO: Bacon: Is this overriding the StateChange method
  public void disconnect(Promise promise) {
    if (guardGATT(promise)) {
      return;
    } else if (mDidDisconnectPeripheralBlock != null) {
      BluetoothError.reject(promise, BluetoothError.CONCURRENT_TASK());
      return;
    }
    Log.d("BLE_TEST", "disconnectPeripheralAsync.disconnect: " + getID() + ", connected: " + isConnected());

    mDidDisconnectPeripheralBlock = promise;
    mGatt.disconnect();
    if (!refreshGattCacheIgnoringErrors(mGatt)) {
      Log.d("BLE_TEST", "Failed to refresh cache: " + getID() + ", connected: " + isConnected());
    }
    mGatt.close();
    mGatt = null;
  }

  // TODO: Bacon: [iOS] Are solicitedServiceUUIDs overflowServiceUUIDs possible
  public Bundle advertisementData() {
    if (advertisingData == null) {
      return null;
    }
    Bundle advertising = new Bundle();
    String name = getDevice().getName();
    advertising.putString(BluetoothConstants.JSON.LOCAL_NAME, name);
    advertising.putInt(BluetoothConstants.JSON.TX_POWER_LEVEL, advertisingData.getTxPowerLevel());
    advertising.putBoolean(BluetoothConstants.JSON.IS_CONNECTABLE, true);
    advertising.putString(BluetoothConstants.JSON.MANUFACTURER_DATA, Base64.encodeToString(advertisingDataBytes, Base64.NO_WRAP));
    if (advertisingData != null) {
      String deviceName = advertisingData.getDeviceName();
      if (deviceName != null) {
        advertising.putString(BluetoothConstants.JSON.LOCAL_NAME, deviceName.replace("\0", ""));
      }


      Bundle serviceData = new Bundle();
      if (advertisingData.getServiceData() != null) {
        for (Map.Entry<ParcelUuid, byte[]> entry : advertisingData.getServiceData().entrySet()) {
          if (entry.getValue() != null) {
            serviceData.putString(UUIDHelper.fromUUID((entry.getKey()).getUuid()), Base64.encodeToString(entry.getValue(), Base64.NO_WRAP));
          }
        }
      }
      advertising.putBundle(BluetoothConstants.JSON.SERVICE_DATA, serviceData);

      ArrayList serviceUUIDs = new ArrayList();
      if (advertisingData.getServiceUuids() != null && advertisingData.getServiceUuids().size() != 0) {
        for (ParcelUuid uuid : advertisingData.getServiceUuids()) {
          serviceUUIDs.add(UUIDHelper.fromUUID(uuid.getUuid()));
        }
      }
      advertising.putParcelableArrayList(BluetoothConstants.JSON.SERVICE_UUIDS, serviceUUIDs);


//      advertising.putStringArrayList(BluetoothConstants.JSON.SERVICE_UUIDS, Serialize.UUIDList_NativeToJSON(advertisementData.getServiceUUIDs()));
//      advertising.putStringArrayList("solicitedServiceUUIDs", Serialize.UUIDList_NativeToJSON(advertisementData.getSolicitedServiceUUIDs()));
    }
    return advertising;
  }

  public boolean isConnected() {
    return BluetoothModule.isDeviceConnected(getID());
  }

//  public BluetoothDevice getDevice() {
//    return device;
//  }

  protected void sendEvent(String transaction, String eventName, Bundle error) {
    Bundle output = new Bundle();
    output.putBundle(BluetoothConstants.JSON.PERIPHERAL, toJSON());
    output.putString(BluetoothConstants.JSON.TRANSACTION_ID, transactionIdForOperation(transaction));
    output.putBundle(BluetoothConstants.JSON.ERROR, error);
    BluetoothModule.sendEvent(eventName, output);
  }

  private boolean shouldResolvePromiseWithStatusAndData(Promise promise, int status) {
    if (status == BluetoothGatt.GATT_SUCCESS) {
      return true;
    }
    BluetoothError.rejectWithStatus(promise, status);
    return false;
  }

  public void updateRSSI(int RSSI) {
    mRSSI = RSSI;
  }

  public void updateData(ScanRecord scanRecord) {
    advertisingData = scanRecord;
    advertisingDataBytes = scanRecord.getBytes();
  }

  public Service getServiceOrReject(String serviceUUIDString, Promise promise) {
    EXBluetoothChildObject service = getChild(serviceUUIDString);
    if (service == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_SERVICE, BluetoothError.Messages.NO_SERVICE));
      return null;
    }
    return (Service) service;
  }

  public Characteristic getCharacteristicOrReject(Service service, String characteristicUUIDString, int characteristicProperties, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(characteristicUUIDString);
    try {
      List<Characteristic> characteristics = service.getCharacteristics();
      for (Characteristic characteristic : characteristics) {
        if ((characteristic.getCharacteristic().getProperties() & characteristicProperties) != 0 && uuid.equals(characteristic.getUUID())) {
          return characteristic;
        }
      }
      if (characteristicProperties == BluetoothGattCharacteristic.PROPERTY_NOTIFY) {
        return getCharacteristicOrReject(service, characteristicUUIDString, BluetoothGattCharacteristic.PROPERTY_INDICATE, promise);
      }
    } catch (Exception e) {
      Log.e(BluetoothConstants.ERRORS.GENERAL, "Error on characteristic: " + characteristicUUIDString, e);
    }
    BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_CHARACTERISTIC, BluetoothError.Messages.NO_CHARACTERISTIC));
    return null;
  }

  public static Characteristic getCharacteristicOrReject(Service service, String characteristicUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(characteristicUUIDString);
    Characteristic characteristic = service.getCharacteristic(uuid);
    if (characteristic == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_CHARACTERISTIC, BluetoothError.Messages.NO_CHARACTERISTIC));
      return null;
    }

    return characteristic;
  }

  public static Descriptor getDescriptorOrReject(Characteristic characteristic, String descriptorUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(descriptorUUIDString);
    Descriptor descriptor = characteristic.getDescriptor(uuid);
    if (descriptor == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_DESCRIPTOR, BluetoothError.Messages.NO_DESCRIPTOR));
      return null;
    }
    return descriptor;
  }

  public void writeDescriptor(byte[] data, final Descriptor descriptor, final Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    } else if (mGatt.writeDescriptor(descriptor.setValue(data).getDescriptor())) {
      mWriteDescriptorPromises.add(descriptor.getID(), promise);
      return;
    } else {
      BluetoothError.reject(promise, "Failed to write descriptor: " + descriptor.getID());
      return;
    }
  }

  public void writeCharacteristicAsync(byte[] data, final Characteristic characteristic, final Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    } else if (mGatt.writeCharacteristic(characteristic.setValue(data).getCharacteristic())) {
      mWriteCharacteristicPromises.add(characteristic.getID(), promise);
    } else {
      BluetoothError.reject(promise, "Failed to write characteristic: " + characteristic.getID());
    }
  }

  public void readDescriptor(final Descriptor descriptor, final Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    } else if (mGatt.readDescriptor(descriptor.getDescriptor())) {
      mReadDescriptorPromises.add(descriptor.getID(), promise);
      return;
    } else {
      BluetoothError.reject(promise, "Failed to read descriptor: " + descriptor.getID());
      return;
    }
  }

  public void readCharacteristicAsync(final Characteristic characteristic, final Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    } else if (mGatt.readCharacteristic(characteristic.getCharacteristic())) {
      mReadCharacteristicPromises.add(characteristic.getID(), promise);
    } else {
      BluetoothError.reject(promise, "Failed to read characteristic: " + characteristic.getID());
    }
  }

  public void setNotify(Service service, String characteristicUUID, Boolean notify, Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    }

    Characteristic characteristic = getCharacteristicOrReject(service, characteristicUUID, BluetoothGattCharacteristic.PROPERTY_NOTIFY, promise);
    if (characteristic == null) {
      return;
    } else if (mGatt.setCharacteristicNotification(characteristic.getCharacteristic(), notify)) {
      mNotifyCharacteristicPromises.add(characteristic.getID(), promise);
      return;
    } else {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Failed to register notification for " + characteristicUUID);
      return;
    }

//    Descriptor descriptor = characteristic.getDescriptor(UUIDHelper.toUUID(CHARACTERISTIC_NOTIFICATION_CONFIG));
//
//    if (descriptor == null) {
//      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Set notification failed for " + characteristicUUID);
//      return;
//    }
//
//    // try notify before indicate
//    if ((characteristic.getCharacteristic().getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0) {
//      descriptor.setValue(notify ? BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE : BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
//    } else if ((characteristic.getCharacteristic().getProperties() & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0) {
//      descriptor.setValue(notify ? BluetoothGattDescriptor.ENABLE_INDICATION_VALUE : BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
//    } else {
//      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Characteristic " + characteristicUUID + " does not have NOTIFY or INDICATE property set");
//      return;
//    }
//    try {
//      if (mGatt.writeDescriptor(descriptor.getDescriptor())) {
//        mWriteDescriptorPromises.add(descriptor.getID(), promise);
//        return;
//      } else {
//        promise.reject(BluetoothConstants.ERRORS.GENERAL, "Failed to set client characteristic notification for " + characteristicUUID);
//        return;
//      }
//    } catch (Exception e) {
//      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Failed to set client characteristic notification for " + characteristicUUID + ", error: " + e.getMessage());
//      return;
//    }
  }

  public void readRSSIAsync(Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise) || guardConcurrency(promise, mRSSIBlock)) {
      return;
    } else if (mGatt.readRemoteRssi()) {
      mRSSIBlock = promise;
      return;
    } else {
      BluetoothError.reject(promise, "Failed to read RSSI from peripheral: " + getID());
      return;
    }
  }

  public void discoverServicesForPeripheralAsync(Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise) || guardConcurrency(promise, mDidDisconnectPeripheralBlock)) {
      return;
    } else if (mGatt.discoverServices()) {
      mDidDiscoverServicesBlock.put(getID(), promise);
      return;
    } else {
      BluetoothError.reject(promise, "Failed to discover services for peripheral: " + getID());
      return;
    }
  }

  public void requestConnectionPriority(int connectionPriority, Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    } else if (mGatt.requestConnectionPriority(connectionPriority)) {
      promise.resolve(null);
      return;
    } else {
      BluetoothError.reject(promise, "Failed to request connection priority: " + connectionPriority);
      return;
    }
  }

  public void requestMTU(int MTU, Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise) || guardConcurrency(promise, mMTUBlock)) {
      return;
    } else if (mGatt.requestMtu(MTU)) {
      mMTUBlock = promise;
      return;
    } else {
      BluetoothError.reject(promise, "Failed to request MTU: " + MTU);
      return;
    }
  }

  /** Parent Interface */

  @Override
  public void clearChildren() {
    for (EXBluetoothChildObject child : mServices.values()) {
      child.clearChildren();
    }
    mServices = new HashMap<>();
  }

  @Override
  public EXBluetoothChildObject getChild(String uuid) {
    if (mServices.containsKey(uuid)) {
      return mServices.get(uuid);
    }
    BluetoothGattService child = mGatt.getService(UUIDHelper.toUUID(uuid));
    Service service = new Service(child, mGatt);
    mServices.put(uuid, service);
    return service;
  }

  @Override
  public HashMap<String, EXBluetoothChildObject> getChildren() {
    HashMap<String, EXBluetoothChildObject> children = new HashMap<>();
    for (String key : mServices.keySet()) {
      children.put(key, mServices.get(key));
    }
    return children;
  }

  /** Object Interface */

  @Override
  public Peripheral getPeripheral() {
    return this;
  }

  @Override
  public String transactionIdForOperation(String operation) {
    return operation + "|" + getID();
  }


  /** Guards */

  public boolean guardIsConnected(Promise promise) {
    /** A connected device will have a valid GATT */
    if (!isConnected()) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Peripheral is not connected: " + getID());
      return true;
    }
    return false;
  }

  private boolean guardGATT(Promise promise) {
    if (mGatt == null) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "GATT is not defined. Connect to the peripheral " + getID() + " to create one.");
      return true;
    }
    return false;
  }

  private boolean guardConcurrency(Promise promise, Promise possiblyDefinedPromise) {
    if (possiblyDefinedPromise != null) {
      BluetoothError.reject(promise, BluetoothError.CONCURRENT_TASK());
      return true;
    }
    return false;
  }


}
