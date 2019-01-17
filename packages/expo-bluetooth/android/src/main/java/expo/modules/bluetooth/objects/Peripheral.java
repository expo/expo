package expo.modules.bluetooth.objects;

import android.app.Activity;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.ScanRecord;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.os.Parcelable;
import android.util.Base64;
import android.util.Log;

import org.json.JSONException;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.modules.bluetooth.BluetoothConstants;
import expo.modules.bluetooth.BluetoothError;
import expo.modules.bluetooth.BluetoothModule;
import expo.modules.bluetooth.Serialize;
import expo.modules.bluetooth.helpers.UUIDHelper;
import expo.modules.bluetooth.objects.EXBluetoothObject;


//BluetoothGattCallback

// Wrapper for GATT because GATT can access Device
public class Peripheral extends BluetoothGattCallback implements EXBluetoothObjectInterface {

  private static final String CHARACTERISTIC_NOTIFICATION_CONFIG = "00002902-0000-1000-8000-00805f9b34fb";

  public static ArrayList<Bundle> listToJSON(List<Peripheral> input) {
    if (input == null) return null;

    ArrayList<Bundle> output = new ArrayList();
    for (Peripheral value : input) {
      output.add(value.toJSON());
    }
    return output;
  }

  public final BluetoothDevice device;
  public BluetoothGatt mGatt;
  private ScanRecord advertisingData;

  private byte[] advertisingDataBytes;
  public int advertisingRSSI;
  private boolean connected = false;
  public int MTU;

  public Peripheral(BluetoothDevice device, int advertisingRSSI, byte[] scanRecord) {
    this.device = device;
    this.advertisingRSSI = advertisingRSSI;
    this.advertisingDataBytes = scanRecord;
  }

  public Peripheral(BluetoothDevice device, int advertisingRSSI, ScanRecord scanRecord) {
    this.device = device;
    this.advertisingRSSI = advertisingRSSI;
    this.advertisingData = scanRecord;
    this.advertisingDataBytes = scanRecord.getBytes();
  }

  public Peripheral(BluetoothDevice device, Activity activity) {
    this.device = device;
    assignGATT(activity);
  }

  public Peripheral(BluetoothGatt gatt) {
    this.device = gatt.getDevice();
    mGatt = gatt;
  }

  @Override
  public UUID getUUID() {
    return null;
  }

  @Override
  public Bundle toJSON() {

    Bundle output = new Bundle();

    ArrayList<Bundle> services = EXBluetoothObject.listToJSON((List)getServices());
    output.putParcelableArrayList(BluetoothConstants.JSON.SERVICES, services);
    output.putString(BluetoothConstants.JSON.NAME, device.getName());
    output.putString(BluetoothConstants.JSON.ID, getID());
    output.putString(BluetoothConstants.JSON.UUID, getID());
    output.putString(BluetoothConstants.JSON.STATE, isConnected() ? "connected" : "disconnected");

    if (mGatt != null) {
      output.putInt(BluetoothConstants.JSON.MTU, MTU);
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
        output.add(new Service(value, this));
      }
    }
    return output;
  }

  @Override
  public String getID() {
    return device.getAddress();
  }

  @Override
  public EXBluetoothObject getParent() {
    return null;
  }

  public void connect(Promise promise, Activity activity) {
    if (!connected) {
      assignGATT(activity);
      promise.resolve(null);
    } else {
      if (guardGATT(promise)) {
        return;
      }
      promise.resolve(null);
    }
  }


  private void assignGATT(Activity activity) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      mGatt = device.connectGatt(activity, false, this);
    } else {
      mGatt = device.connectGatt(activity, false, this, BluetoothDevice.TRANSPORT_LE);
    }
  }

  public void disconnect() {
    connected = false;
    if (mGatt != null) {
      try {
        mGatt.disconnect();
        mGatt.close();
        mGatt = null;
        Log.d(BluetoothConstants.ERRORS.GENERAL, "Disconnect");
        sendDisconnectedEvent(null);
      } catch (Exception e) {

        //TODO: Bacon: Add more of a standard around errors
        Bundle errorPayload = new Bundle();
        errorPayload.putString(BluetoothConstants.JSON.MESSAGE, e.getMessage());

        sendDisconnectedEvent(errorPayload);
      }
    } else {
      Log.d(BluetoothConstants.ERRORS.GENERAL, "GATT is null");
    }
  }

  // TODO: Bacon: [iOS] Are solicitedServiceUUIDs overflowServiceUUIDs possible
  public Bundle advertisementData() {
    Bundle advertising = new Bundle();
    String name = device.getName();
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
    }

    return advertising;
  }

  public boolean isConnected() {
    return connected;
  }

  public BluetoothDevice getDevice() {
    return device;
  }

  public Boolean hasService(UUID uuid) {
    if (mGatt == null) {
      return null;
    }
    return mGatt.getService(uuid) != null;
  }

  // didDiscoverServices
  @Override
  public void onServicesDiscovered(BluetoothGatt gatt, int status) {
    super.onServicesDiscovered(gatt, status);
    sendEvent(BluetoothConstants.OPERATIONS.SCAN, BluetoothConstants.EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL, BluetoothError.errorFromGattStatus(status));
  }

  private void sendConnectedEvent(Bundle error) {
    sendEvent(BluetoothConstants.OPERATIONS.CONNECT, BluetoothConstants.EVENTS.CENTRAL_DID_CONNECT_PERIPHERAL, error);
  }

  private void sendDisconnectedEvent(Bundle error) {
    sendEvent(BluetoothConstants.OPERATIONS.DISCONNECT, BluetoothConstants.EVENTS.CENTRAL_DID_DISCONNECT_PERIPHERAL, error);
  }

  protected void sendEvent(String transaction, String eventName, Bundle error) {
    Bundle output = new Bundle();
    output.putBundle(BluetoothConstants.JSON.PERIPHERAL, toJSON());
    output.putString(BluetoothConstants.JSON.TRANSACTION_ID, transactionIdForOperation(transaction));
    output.putBundle(BluetoothConstants.JSON.ERROR, error);
    BluetoothModule.sendEvent(eventName, output);
  }

    @Override
  public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
    mGatt = gatt;

    switch (newState) {
      case BluetoothProfile.STATE_CONNECTED:
        connected = true;
        device.createBond();
        sendConnectedEvent(null);
        break;
      case BluetoothProfile.STATE_DISCONNECTED:
        if (connected) {
          connected = false;
          if (gatt != null) {
            gatt.disconnect();
            gatt.close();
            mGatt = null;
          }
        }

        sendDisconnectedEvent(null);
        break;
      case BluetoothProfile.STATE_CONNECTING:
      case BluetoothProfile.STATE_DISCONNECTING:
      default:
        // TODO: Bacon: Unhandled
        break;
    }
  }

  public void updateRSSI(int RSSI) {
    advertisingRSSI = RSSI;
  }

  public void updateData(byte[] data) {
    advertisingDataBytes = data;
  }

  public void updateData(ScanRecord scanRecord) {
    advertisingData = scanRecord;
    advertisingDataBytes = scanRecord.getBytes();
  }

  @Override
  public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
    super.onCharacteristicChanged(gatt, characteristic);
    Characteristic characteristicInstance = new Characteristic(characteristic, gatt);
    characteristicInstance.sendEvent(BluetoothConstants.OPERATIONS.READ, BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC, BluetoothGatt.GATT_SUCCESS);
  }

  @Override
  public void onCharacteristicRead(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
    super.onCharacteristicRead(gatt, characteristic, status);
    Characteristic characteristicInstance = new Characteristic(characteristic, gatt);
    characteristicInstance.sendEvent(BluetoothConstants.OPERATIONS.READ, BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC, status);
  }

  @Override
  public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
    super.onCharacteristicWrite(gatt, characteristic, status);
    Characteristic input = new Characteristic(characteristic, gatt);
    input.sendEvent(BluetoothConstants.OPERATIONS.WRITE, BluetoothConstants.EVENTS.PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC, status);
  }

  @Override
  public void onDescriptorRead(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
    super.onDescriptorRead(gatt, descriptor, status);
    Descriptor input = new Descriptor(descriptor, gatt);
    input.sendEvent(BluetoothConstants.OPERATIONS.READ, BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR, status);
  }

  @Override
  public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
    super.onDescriptorWrite(gatt, descriptor, status);
    Descriptor input = new Descriptor(descriptor, gatt);
    input.sendEvent(BluetoothConstants.OPERATIONS.WRITE, BluetoothConstants.EVENTS.PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR, status);
  }

  @Override
  public void onReadRemoteRssi(BluetoothGatt gatt, int rssi, int status) {
    super.onReadRemoteRssi(gatt, rssi, status);
    if (status == BluetoothGatt.GATT_SUCCESS) {
      updateRSSI(rssi);
    }
    // TODO: Bacon: Send RSSI event here - not done on iOS either
  }

  public Service getService(UUID uuid) {
    BluetoothGattService child = mGatt.getService(uuid);
    if (child == null) {
      return null;
    }
    return new Service(child, this);
  }

  public Service getServiceOrReject(String serviceUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(serviceUUIDString);
    Service service = getService(uuid);
    if (service == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_SERVICE, BluetoothError.Messages.NO_SERVICE));
      return null;
    }
    return service;
  }

  public Characteristic getCharacteristicOrReject(Service service, String characteristicUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(characteristicUUIDString);
    Characteristic characteristic = service.getCharacteristic(uuid);
    if (characteristic == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_CHARACTERISTIC, BluetoothError.Messages.NO_CHARACTERISTIC));
      return null;
    }
    return characteristic;
  }

  public Descriptor getDescriptorOrReject(Characteristic characteristic, String descriptorUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(descriptorUUIDString);
    Descriptor descriptor = characteristic.getDescriptor(uuid);
    if (descriptor == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_DESCRIPTOR, BluetoothError.Messages.NO_DESCRIPTOR));
      return null;
    }
    return descriptor;
  }

  public void updateDescriptorAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }

    Service service = getServiceOrReject((String) options.get(BluetoothConstants.JSON.SERVICE_UUID), promise);
    if (service == null) {
      return;
    }

    Characteristic characteristic = getCharacteristicOrReject(service, (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUID), promise);
    if (characteristic == null) {
      return;
    }

    Descriptor descriptor = getDescriptorOrReject(characteristic, (String) options.get(BluetoothConstants.JSON.DESCRIPTOR_UUID), promise);
    if (descriptor == null) {
      return;
    }

    String characteristicPropertiesString = (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_PROPERTIES);
    int characteristicProperty = Serialize.CharacteristicProperties_JSONToNative(characteristicPropertiesString);

    switch (characteristicProperty) {
      case BluetoothGattCharacteristic.PROPERTY_READ:
        if (!mGatt.readDescriptor(descriptor.getDescriptor())) {
          //TODO: Bacon: Full breakout - match iOS
          BluetoothError.reject(promise, "Failed to read descriptor: " + UUIDHelper.fromUUID(descriptor.getUUID()));
          return;
        }
        promise.resolve(null);
        return;
      case BluetoothGattCharacteristic.PROPERTY_WRITE:
      case BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE:
//        // TODO: Bacon: This is different to iOS
        List data = (List) options.get(BluetoothConstants.JSON.DATA);
        byte[] decoded = Serialize.Base64_JSONToNative(data);
//        // TODO: Bacon: This should be in options?
        int writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT;
        if (characteristicProperty == BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) {
          writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE;
        }
        // TODO: Bacon: Write without notification?
        descriptor.setValue(decoded);

        if (!mGatt.writeDescriptor(descriptor.getDescriptor())) {
          BluetoothError.reject(promise, "Failed to write to descriptor: " + UUIDHelper.fromUUID(descriptor.getUUID()));
          return;
        }
        promise.resolve(null);
        return;
      default:
        //TODO: Bacon: Add characteristicProperty error
        BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.UNIMPLEMENTED, BluetoothError.Messages.UNIMPLEMENTED));
        return;
    }
  }

  public void updateCharacteristicAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }

    Service service = getServiceOrReject((String) options.get(BluetoothConstants.JSON.SERVICE_UUID), promise);
    if (service == null) {
      return;
    }
    Characteristic characteristic = getCharacteristicOrReject(service, (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUID), promise);
    if (characteristic == null) {
      return;
    }

    String characteristicPropertiesString = (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_PROPERTIES);
    int characteristicProperty = Serialize.CharacteristicProperties_JSONToNative(characteristicPropertiesString);

    switch (characteristicProperty) {
      case BluetoothGattCharacteristic.PROPERTY_READ:
        if (!mGatt.readCharacteristic(characteristic.getCharacteristic())) {
          //TODO: Bacon: Full breakout - match iOS
          BluetoothError.reject(promise, "Failed to read characteristic: " + characteristic.getID());
          return;
        }
        promise.resolve(null);
        return;
      case BluetoothGattCharacteristic.PROPERTY_WRITE:
      case BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE:
//        // TODO: Bacon: This is different to iOS
        List data = (List) options.get(BluetoothConstants.JSON.DATA);
        byte[] decoded = Serialize.Base64_JSONToNative(data);
//        // TODO: Bacon: This should be in options?
        int writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT;
        if (characteristicProperty == BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) {
          writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE;
        }
        // TODO: Bacon: Write without notification?
        characteristic.setValue(decoded);

        if (!mGatt.writeCharacteristic(characteristic.getCharacteristic())) {
          BluetoothError.reject(promise, "Failed to write to characteristic: " + characteristic.getID());
          return;
        }
        promise.resolve(null);
        return;
      default:
        //TODO: Bacon: Add characteristicProperty error
        BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.UNIMPLEMENTED, BluetoothError.Messages.UNIMPLEMENTED));
        return;
    }
  }

  private void setNotify(UUID serviceUUID, UUID characteristicUUID, Boolean notify, Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }

    Log.d(BluetoothConstants.ERRORS.GENERAL, "setNotify");

    BluetoothGattService service = mGatt.getService(serviceUUID);
    BluetoothGattCharacteristic characteristic = findNotifyCharacteristic(service, characteristicUUID);

    if (characteristic == null) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Characteristic " + characteristicUUID + " not found");
      return;
    }

    if (!mGatt.setCharacteristicNotification(characteristic, notify)) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Failed to register notification for " + characteristicUUID);
      return;
    }

    BluetoothGattDescriptor descriptor = characteristic.getDescriptor(UUIDHelper.toUUID(CHARACTERISTIC_NOTIFICATION_CONFIG));

    if (descriptor == null) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Set notification failed for " + characteristicUUID);
      return;
    }

    // Prefer notify over indicate
    if ((characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0) {
      Log.d(BluetoothConstants.ERRORS.GENERAL, "Characteristic " + characteristicUUID + " set NOTIFY");
      descriptor.setValue(notify ? BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE : BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
    } else if ((characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0) {
      Log.d(BluetoothConstants.ERRORS.GENERAL, "Characteristic " + characteristicUUID + " set INDICATE");
      descriptor.setValue(notify ? BluetoothGattDescriptor.ENABLE_INDICATION_VALUE : BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
    } else {
      Log.d(BluetoothConstants.ERRORS.GENERAL, "Characteristic " + characteristicUUID + " does not have NOTIFY or INDICATE property set");
    }

    try {
      if (mGatt.writeDescriptor(descriptor)) {
        Log.d(BluetoothConstants.ERRORS.GENERAL, "setNotify complete");
      } else {
        promise.reject(BluetoothConstants.ERRORS.GENERAL, "Failed to set client characteristic notification for " + characteristicUUID);
      }
    } catch (Exception e) {
      Log.d(BluetoothConstants.ERRORS.GENERAL, "Error on setNotify", e);
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Failed to set client characteristic notification for " + characteristicUUID + ", error: " + e.getMessage());
    }
  }

  public void registerNotify(UUID serviceUUID, UUID characteristicUUID, Promise promise) {
    Log.d(BluetoothConstants.ERRORS.GENERAL, "registerNotify");
    this.setNotify(serviceUUID, characteristicUUID, true, promise);
  }

  public void removeNotify(UUID serviceUUID, UUID characteristicUUID, Promise promise) {
    Log.d(BluetoothConstants.ERRORS.GENERAL, "removeNotify");
    this.setNotify(serviceUUID, characteristicUUID, false, promise);
  }

  // Some devices reuse UUIDs across characteristics, so we can't use service.getCharacteristic(characteristicUUID)
  // instead check the UUID and properties for each characteristic in the service until we find the best match
  // This function prefers Notify over Indicate
  private BluetoothGattCharacteristic findNotifyCharacteristic(BluetoothGattService service, UUID characteristicUUID) {

    try {
      // Check for Notify first
      List<BluetoothGattCharacteristic> characteristics = service.getCharacteristics();
      for (BluetoothGattCharacteristic characteristic : characteristics) {
        if ((characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0 && characteristicUUID.equals(characteristic.getUuid())) {
          return characteristic;
        }
      }

      // If there wasn't Notify Characteristic, check for Indicate
      for (BluetoothGattCharacteristic characteristic : characteristics) {
        if ((characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0 && characteristicUUID.equals(characteristic.getUuid())) {
          return characteristic;
        }
      }

      // As a last resort, try and find ANY characteristic with this UUID, even if it doesn't have the correct properties
      return service.getCharacteristic(characteristicUUID);
    } catch (Exception e) {
      Log.e(BluetoothConstants.ERRORS.GENERAL, "Error on characteristic: " + characteristicUUID, e);
      return null;
    }
  }

  public void readRSSI(Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }

    if (!mGatt.readRemoteRssi()) {
      BluetoothError.reject(promise, "Failed  to read RSSI from peripheral: " + getID());
      return;
    }
    promise.resolve(null);
  }

//  public void refreshCache(Promise promise) {
//    try {
//
//      Method localMethod = mGatt.getClass().getMethod("refresh", new Class[0]);
//      if (localMethod != null) {
//        boolean res = ((Boolean) localMethod.invoke(mGatt, new Object[0])).booleanValue();
//        promise.resolve(res);
//      } else {
//        promise.reject(BluetoothConstants.ERRORS.GENERAL, "Could not refresh cache for device.");
//      }
//    } catch (Exception localException) {
//      promise.reject(localException);
//    }
//  }

  public void retrieveServices(Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }
    mGatt.discoverServices();
    promise.resolve(null);
  }

  // Some peripherals re-use UUIDs for multiple characteristics so we need to check the properties
  // and UUID of all characteristics instead of using service.getCharacteristic(characteristicUUID)
  private BluetoothGattCharacteristic findReadableCharacteristic(BluetoothGattService service, UUID characteristicUUID) {

    if (service != null) {
      int read = BluetoothGattCharacteristic.PROPERTY_READ;

      List<BluetoothGattCharacteristic> characteristics = service.getCharacteristics();
      for (BluetoothGattCharacteristic characteristic : characteristics) {
        if ((characteristic.getProperties() & read) != 0 && characteristicUUID.equals(characteristic.getUuid())) {
          return characteristic;
        }
      }

      // As a last resort, try and find ANY characteristic with this UUID, even if it doesn't have the correct properties
      return service.getCharacteristic(characteristicUUID);
    }

    return null;
  }

  public void requestConnectionPriority(int connectionPriority, Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }
    if (mGatt.requestConnectionPriority(connectionPriority)) {
      BluetoothError.reject(promise, "Failed to request connection priority: " + connectionPriority);
      return;
    }
    promise.resolve(null);
  }

  public void requestMTU(int mtu, Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }
    if (mGatt.requestMtu(mtu)) {
      BluetoothError.reject(promise, "Failed to request MTU: " + mtu);
      return;
    }
    promise.resolve(null);
  }

  @Override
  public void onMtuChanged(BluetoothGatt gatt, int mtu, int status) {
    super.onMtuChanged(gatt, mtu, status);
    MTU = mtu;

    Bundle output = new Bundle();
    output.putInt(BluetoothConstants.JSON.MTU, mtu);
    output.putString(BluetoothConstants.JSON.TRANSACTION_ID, transactionIdForOperation(BluetoothConstants.OPERATIONS.MTU));
    output.putBundle(BluetoothConstants.JSON.ERROR, BluetoothError.errorFromGattStatus(status));
    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.CENTRAL_DID_CONNECT_PERIPHERAL, output);
  }

  // Some peripherals re-use UUIDs for multiple characteristics so we need to check the properties
  // and UUID of all characteristics instead of using service.getCharacteristic(characteristicUUID)
  private BluetoothGattCharacteristic findWritableCharacteristic(BluetoothGattService service, UUID characteristicUUID, int writeType) {
    try {
      // get write property
      int writeProperty = BluetoothGattCharacteristic.PROPERTY_WRITE;
      if (writeType == BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE) {
        writeProperty = BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE;
      }

      List<BluetoothGattCharacteristic> characteristics = service.getCharacteristics();
      for (BluetoothGattCharacteristic characteristic : characteristics) {
        if ((characteristic.getProperties() & writeProperty) != 0 && characteristicUUID.equals(characteristic.getUuid())) {
          return characteristic;
        }
      }
      // As a last resort, try and find ANY characteristic with this UUID, even if it doesn't have the correct properties
      return service.getCharacteristic(characteristicUUID);
    } catch (Exception e) {
      Log.e(BluetoothConstants.ERRORS.GENERAL, "Error on findWritableCharacteristic", e);
      return null;
    }
  }

  private boolean guardIsConnected(Promise promise) {
    if (!isConnected()) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Peripheral is not connected: " + getID());
      return true;
    }
    return false;
  }

  private boolean guardGATT(Promise promise) {
    if (mGatt == null) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "GATT is not defined");
      return true;
    }
    return false;
  }

  @Override
  public Peripheral getPeripheral() {
    return this;
  }

  @Override
  public String transactionIdForOperation(String operation) {
    return operation + "|" + getID();
  }


  public void tearDown() {
    // TODO: Bacon: Deallocate
  }

}
