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
import android.os.Handler;
import android.os.Looper;
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


/** Wrapper for GATT because GATT can access Device */
public class Peripheral implements EXBluetoothObjectInterface, EXBluetoothParentObjectInterface {

  public BluetoothGatt mGatt;
  private int mRSSI;
  private int mMTU;
//  private Promise mDidDisconnectPeripheralBlock;
  private ConnectingPromise mDidConnectStateChangePeripheralBlock;
  private PromiseListHashMap<String, ArrayList<Promise>> mWriteCharacteristicPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mWriteDescriptorPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mReadCharacteristicPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mReadDescriptorPromises = new PromiseListHashMap<>();
  private PromiseListHashMap<String, ArrayList<Promise>> mNotifyCharacteristicPromises = new PromiseListHashMap<>();
  private Promise mDidDiscoverServicesBlock;
  private Promise mMTUBlock;
  private Promise mRSSIBlock;
  private ScanRecord advertisingData;
  private byte[] advertisingDataBytes;
  private HashMap<String, Service> mServices = new HashMap<>();
  private boolean mShouldAutoConnect = false;

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
    return BluetoothModule.getDeviceFromAddress(getID());
  }

  @Override
  public UUID getUUID() {
    return null;
  }

  @Override
  public Bundle toJSON() {

    BluetoothDevice device = getDevice();

    if (device == null) {
      return null;
    }

    Bundle output = new Bundle();

    ArrayList<Bundle> services = Service.listToJSON((List) getServices());
    output.putParcelableArrayList(BluetoothConstants.JSON.SERVICES, services);
    output.putString("type", "peripheral");

    output.putString(BluetoothConstants.JSON.NAME, device.getName());
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
  }

  @Override
  public EXBluetoothObjectInterface getParent() {
    return null;
  }

  public void connect(Promise promise, Activity activity) {
    if (!isConnected()) {
      if (guardConcurrency(promise, mDidConnectStateChangePeripheralBlock)) {
        return;
      }
      mDidConnectStateChangePeripheralBlock = new ConnectingPromise(promise, BluetoothConstants.EVENTS.PERIPHERAL_CONNECTED);
      connectToGATT(activity);
      return;
    } else if (guardGATT(promise)) {
      return;
    } else {
      promise.resolve(toJSON());
      return;
    }
  }

  public int getBondState() {
    BluetoothDevice device = getDevice();

    if (device == null) {
      return BluetoothDevice.BOND_NONE;
    }

    return device.getBondState();
  }

  private void connectToGATT(Activity activity) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      mGatt = getDevice().connectGatt(activity, mShouldAutoConnect, BluetoothModule.bluetoothGattCallback);
    } else {
      mGatt = getDevice().connectGatt(activity, mShouldAutoConnect, BluetoothModule.bluetoothGattCallback, BluetoothDevice.TRANSPORT_LE);
    }
  }

  public void setGatt(BluetoothGatt gatt) {
    mGatt = gatt;
    mDeviceID = gatt.getDevice().getAddress();
  }

    public void onPhyUpdate(int txPhy, int rxPhy, int status) {

    }


    public void onPhyRead(int txPhy, int rxPhy, int status) {

    }

    public void onConnectionStateChange(int status, int newState) {
      tryRejectingAllPendingConnectPromises();

      if (mDidConnectStateChangePeripheralBlock != null) {
          BluetoothModule.emitState();
        if (shouldResolvePromiseWithStatusAndData(mDidConnectStateChangePeripheralBlock.getPromise(), status)) {
          mDidConnectStateChangePeripheralBlock.getPromise().resolve(toJSON());
        }
        /**
         * If you attempt to connect and the process fails, the "newState" will be disconnected event though it was never connected.
         * Send the pseudo event for proper resolution.
         */
        sendGattEvent(mDidConnectStateChangePeripheralBlock.getEvent(), status);
        mDidConnectStateChangePeripheralBlock = null;
      } else {
        /** newState can only be one of STATE_CONNECTED, STATE_DISCONNECTED. */
        if (newState == BluetoothProfile.STATE_CONNECTED) {
          //      getDevice().createBond();
          // Send Connection event
        } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
          Log.d("BLE_TEST", "Did disconnect: " + getID() + ", connected: " + isConnected());
          sendGattEvent(BluetoothConstants.EVENTS.PERIPHERAL_DISCONNECTED, status);
        }
      }
    }

    public void onServicesDiscovered(int status) {
      BluetoothModule.emitState();
      Bundle output = sendGattEvent(BluetoothConstants.EVENTS.PERIPHERAL_DISCOVERED_SERVICES, status);
      if (mDidDiscoverServicesBlock != null) {
        if (shouldResolvePromiseWithStatusAndData(mDidDiscoverServicesBlock, status)) {
          mDidDiscoverServicesBlock.resolve(output);
        }
        mDidDiscoverServicesBlock = null;
      }
    }

    private Characteristic getCharacteristic(BluetoothGattCharacteristic characteristic) {
      UUID serviceUUID = characteristic.getService().getUuid();
      Service service = (Service) getChild(UUIDHelper.toString(serviceUUID));
      if (service != null) {
        UUID characteristicUUID = characteristic.getUuid();
        return service.getCharacteristic(characteristicUUID);
      }
      return null;
    }

  private Descriptor getDescriptor(BluetoothGattDescriptor descriptor) {
    Characteristic characteristic = getCharacteristic(descriptor.getCharacteristic());
    if (characteristic != null) {
      UUID descriptorUUID = descriptor.getUuid();
      return characteristic.getDescriptor(descriptorUUID);
    }
    return null;
  }

    public void onCharacteristicRead(BluetoothGattCharacteristic characteristic, int status) {
      Characteristic input = getCharacteristic(characteristic);
      if (input != null) {
        BluetoothModule.emitState();
        Bundle output = input.sendEvent(BluetoothConstants.EVENTS.CHARACTERISTIC_DID_READ, status);

        ArrayList<Promise> promises = mReadCharacteristicPromises.get(input.getID());
        for (Promise promise : promises) {
          if (shouldResolvePromiseWithStatusAndData(promise, status)) {
            promise.resolve(output);
//        Bundle output = new Bundle();
//        output.putBundle(BluetoothConstants.JSON.CHARACTERISTIC, characteristicInstance.toJSON());
//        output.putBundle(BluetoothConstants.JSON.PERIPHERAL, this.toJSON());
//        /* peripheral, characteristic */
//        promise.resolve(output);
          }
        }
        mReadCharacteristicPromises.clearKey(input.getID());
      }

    }

    public void onCharacteristicWrite(BluetoothGattCharacteristic characteristic, int status) {
      Characteristic input = getCharacteristic(characteristic);
      if (input != null) {
        BluetoothModule.emitState();
        Bundle output = input.sendEvent(BluetoothConstants.EVENTS.CHARACTERISTIC_DID_WRITE, status);

        ArrayList<Promise> promises = mWriteCharacteristicPromises.get(input.getID());
        for (Promise promise : promises) {
          if (shouldResolvePromiseWithStatusAndData(promise, status)) {
            promise.resolve(output);
          }
        }
        mWriteCharacteristicPromises.clearKey(input.getID());
      }
    }

    /** Enable or disable notifications/indications for a given characteristic. */
    public void onCharacteristicChanged(BluetoothGattCharacteristic characteristic) {
      Characteristic input = getCharacteristic(characteristic);
      if (input != null) {
        BluetoothModule.emitState();
        Bundle output = input.sendEvent(BluetoothConstants.EVENTS.CHARACTERISTIC_DID_NOTIFY, BluetoothGatt.GATT_SUCCESS);

        ArrayList<Promise> promises = mNotifyCharacteristicPromises.get(input.getID());
        for (Promise promise : promises) {
          promise.resolve(output);
        }
        mNotifyCharacteristicPromises.clearKey(input.getID());
      }
    }

    public void onDescriptorRead(BluetoothGattDescriptor descriptor, int status) {
      Descriptor input = getDescriptor(descriptor);
      if (input != null) {

        BluetoothModule.emitState();
        Bundle output = input.sendEvent(BluetoothConstants.EVENTS.DESCRIPTOR_DID_READ, status);

        ArrayList<Promise> promises = mReadDescriptorPromises.get(input.getID());
        for (Promise promise : promises) {
          if (shouldResolvePromiseWithStatusAndData(promise, status)) {
            promise.resolve(output);
          }
        }
        mReadDescriptorPromises.clearKey(input.getID());

      }
    }

    public void onDescriptorWrite(BluetoothGattDescriptor descriptor, int status) {
      Descriptor input = getDescriptor(descriptor);
      if (input != null) {
        BluetoothModule.emitState();

        Bundle output = input.sendEvent(BluetoothConstants.EVENTS.DESCRIPTOR_DID_WRITE, status);

        ArrayList<Promise> promises = mWriteDescriptorPromises.get(input.getID());
        for (Promise promise : promises) {
          if (shouldResolvePromiseWithStatusAndData(promise, status)) {
            promise.resolve(output);
          }
        }
        mWriteDescriptorPromises.clearKey(input.getID());

//    String characteristicUUIDString = UUIDHelper.toString(descriptor.getCharacteristic().getUuid());
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
    }

    public void onReliableWriteCompleted(int status) {

    }


    public void onReadRemoteRssi(int rssi, int status) {

      BluetoothModule.emitState();
      sendGattEvent(BluetoothConstants.EVENTS.PERIPHERAL_UPDATED_RSSI, status);
      if (status == BluetoothGatt.GATT_SUCCESS) {
        updateRSSI(rssi);
      }

      if (mRSSIBlock != null) {
        if (shouldResolvePromiseWithStatusAndData(mRSSIBlock, status)) {
          mRSSIBlock.resolve(rssi);
        }
        mRSSIBlock = null;
      }
      // TODO: Bacon: Send RSSI event here - not done on iOS either
    }

    public void onMtuChanged(int mtu, int status) {
      mMTU = mtu;

      BluetoothModule.emitState();
      sendGattEvent(BluetoothConstants.EVENTS.PERIPHERAL_UPDATED_MTU, status);
      if (mMTUBlock != null) {
        if (shouldResolvePromiseWithStatusAndData(mMTUBlock, status)) {
          mMTUBlock.resolve(mtu);
        }
        mMTUBlock = null;
      }
    }

  /**
   * BluetoothGatt has a refresh() method in but it's private.
   * We can only invoke it using reflections.
   */
  private static boolean refreshGattCacheIgnoringErrors(BluetoothGatt gatt) {
    try {
      final Method refreshGatt = BluetoothGatt.class.getMethod("refresh");
      if (refreshGatt != null) {
        final boolean success = (Boolean) refreshGatt.invoke(gatt);
        Log.d("BLE_TEST", "refreshGattCacheIgnoringErrors(): Was invoked: " + success);
        return success;
      } else {
        Log.d("BLE_TEST", "refreshGattCacheIgnoringErrors(): Reflection doesn't exist");
        // If the method doesn't exist, we have no recourse. Just return false.
      }
    } catch (Exception e) {
      Log.d("BLE_TEST", "refreshGattCacheIgnoringErrors(): Error " + e.getLocalizedMessage());
    }
    return false;
  }

  public void disconnect() {
    clearChildren();
    if (mGatt != null) {
      Log.d("BLE_TEST", "disconnect(): " + mGatt.getDevice().getAddress());
      mGatt.disconnect();
      if (!refreshGattCacheIgnoringErrors(mGatt)) {
        Log.d("BLE_TEST", "disconnect(): Failed to refresh cache: " + getID() + ", isConnected: " + isConnected());
      }
      mGatt.close();
      mGatt = null;
    }
  }

  /** If any action that requires a connection is running, try to reject it. */
  private void tryRejectingAllPendingConnectPromises() {
    if (isConnected()) {
      return;
    }

    if (mDidDiscoverServicesBlock != null) {
      mDidDiscoverServicesBlock.reject("ERR_BLE_CANCELLED", "This operation was cancelled because the device disconnected.");
      mDidDiscoverServicesBlock = null;
    }
    if (mRSSIBlock != null) {
      mRSSIBlock.reject("ERR_BLE_CANCELLED", "This operation was cancelled because the device disconnected.");
      mRSSIBlock = null;
    }
    if (mMTUBlock != null) {
      mMTUBlock.reject("ERR_BLE_CANCELLED", "This operation was cancelled because the device disconnected.");
      mMTUBlock = null;
    }

    rejectAllPromises(mWriteCharacteristicPromises);
    rejectAllPromises(mWriteDescriptorPromises);
    rejectAllPromises(mReadCharacteristicPromises);
    rejectAllPromises(mReadDescriptorPromises);
    rejectAllPromises(mNotifyCharacteristicPromises);
  }

  private void rejectAllPromises(PromiseListHashMap<String, ArrayList<Promise>> promiseSet) {
    for (String id : promiseSet.keySet()) {
      List<Promise> promises = promiseSet.get(id);
      for (Promise promise : promises) {
        promise.reject("ERR_BLE_CANCELLED", "This operation was cancelled because the device disconnected.");
      }
    }
  }

  // TODO: Bacon: Is this overriding the StateChange method
  public void disconnect(Promise promise) {
    if (guardGATT(promise)) {
      return;
    } else if (mDidConnectStateChangePeripheralBlock != null) {
      // TODO: Bacon: seems like this could be hard to work around given how long it takes a peripheral to disconnect.
      BluetoothError.reject(promise, BluetoothError.CONCURRENT_TASK());
      return;
    }

    Log.d("BLE_TEST", "disconnectPeripheralAsync.disconnect: " + getID() + ", connected: " + isConnected());

    mDidConnectStateChangePeripheralBlock = new ConnectingPromise(promise, BluetoothConstants.EVENTS.PERIPHERAL_DISCONNECTED) ;

    disconnect();
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
            serviceData.putString(UUIDHelper.toString((entry.getKey()).getUuid()), Base64.encodeToString(entry.getValue(), Base64.NO_WRAP));
          }
        }
      }
      advertising.putBundle(BluetoothConstants.JSON.SERVICE_DATA, serviceData);

      ArrayList serviceUUIDs = new ArrayList();
      if (advertisingData.getServiceUuids() != null && advertisingData.getServiceUuids().size() != 0) {
        for (ParcelUuid uuid : advertisingData.getServiceUuids()) {
          serviceUUIDs.add(UUIDHelper.toString(uuid.getUuid()));
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

  protected Bundle sendEvent(String eventName, Bundle error) {
    Bundle output = new Bundle();
    output.putBundle(BluetoothConstants.JSON.PERIPHERAL, toJSON());
    output.putBundle(BluetoothConstants.JSON.ERROR, error);
    BluetoothModule.sendEvent(eventName, output);
    return output;
  }

  protected Bundle sendGattEvent(String eventName, int gattStatusCode) {
    return sendEvent(eventName, BluetoothError.fromGattStatusCodeAsJSON(gattStatusCode));
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
    }

    mWriteCharacteristicPromises.add(characteristic.getID(), promise);
    if (!mGatt.writeCharacteristic(characteristic.setValue(data).getCharacteristic())) {
      mWriteCharacteristicPromises.remove(characteristic.getID());
      BluetoothError.reject(promise, "Failed to write characteristic: " + characteristic.getID());
      return;
    }
  }

  public void readDescriptor(final Descriptor descriptor, final Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    }

    mReadDescriptorPromises.add(descriptor.getID(), promise);
    if (!mGatt.readDescriptor(descriptor.getDescriptor())) {
      mReadDescriptorPromises.remove(descriptor.getID());
      BluetoothError.reject(promise, "Failed to read descriptor: " + descriptor.getID());
      return;
    }
  }

  public void readCharacteristicAsync(final Characteristic characteristic, final Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    }

    mReadCharacteristicPromises.add(characteristic.getID(), promise);
    if (!mGatt.readCharacteristic(characteristic.getCharacteristic())) {
      mReadCharacteristicPromises.remove(characteristic.getID());
      BluetoothError.reject(promise, "Failed to read characteristic: " + characteristic.getID());
      return;
    }
  }

  public void setNotify(Service service, String characteristicUUID, Boolean notify, Promise promise) {
    if (guardGATT(promise) || guardIsConnected(promise)) {
      return;
    }

    Characteristic characteristic = getCharacteristicOrReject(service, characteristicUUID, BluetoothGattCharacteristic.PROPERTY_NOTIFY, promise);
    if (characteristic == null) {
      return;
    }

    mNotifyCharacteristicPromises.add(characteristic.getID(), promise);
    if (!mGatt.setCharacteristicNotification(characteristic.getCharacteristic(), notify)) {
      mNotifyCharacteristicPromises.remove(characteristic.getID());
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

  public void readRSSIAsync(final Promise promise) {
    runInMainLoop(new Runnable() {
      @Override
      public void run() {
        if (guardGATT(promise) || guardIsConnected(promise) || guardConcurrency(promise, mRSSIBlock)) {
          return;
        }

        mRSSIBlock = promise;
        if (!mGatt.readRemoteRssi()) {
          mRSSIBlock = null;
          BluetoothError.reject(promise, "Failed to read RSSI from peripheral: " + getID());
          return;
        }
      }
    });
  }

  public void discoverServicesForPeripheralAsync(final Promise promise) {
    runInMainLoop(new Runnable() {
      @Override
      public void run() {
        if (guardGATT(promise) || guardIsConnected(promise) || guardConcurrency(promise, mDidDiscoverServicesBlock)) {
          return;
        }

        mDidDiscoverServicesBlock = promise;
        if (!mGatt.discoverServices()) {
          mDidDiscoverServicesBlock = null;
          BluetoothError.reject(promise, "Failed to discover services for peripheral: " + getID());
          return;
        }
      }
    });
  }

  private void runInMainLoop(Runnable runnable) {
    new Handler(Looper.getMainLooper()).post(runnable);
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
    }
    mMTUBlock = promise;
    if (!mGatt.requestMtu(MTU)) {
      mMTUBlock = null;
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
    if (child != null) {
      Service service = new Service(child, mGatt);
      mServices.put(uuid, service);
      return service;
    }
    return null;
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
      Activity activity = BluetoothModule.getActivity();
      if (activity != null) {
        connectToGATT(activity);
      } else {
        promise.reject(BluetoothConstants.ERRORS.GENERAL, "GATT is not defined. Connect to the peripheral " + getID() + " to create one.");
        return true;
      }
    }
    return false;
  }

  private boolean guardConcurrency(Promise promise, Object possiblyDefinedPromise) {
    if (possiblyDefinedPromise != null) {
      BluetoothError.reject(promise, BluetoothError.CONCURRENT_TASK());
      return true;
    }
    return false;
  }
}
