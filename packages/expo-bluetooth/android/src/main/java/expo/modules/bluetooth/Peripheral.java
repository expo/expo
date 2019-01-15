package expo.modules.bluetooth;

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

public class Peripheral extends BluetoothGattCallback {

  private static final String CHARACTERISTIC_NOTIFICATION_CONFIG = "00002902-0000-1000-8000-00805f9b34fb";

  protected final BluetoothDevice device;
  private ScanRecord advertisingData;
  private byte[] advertisingDataBytes;
  protected int advertisingRSSI;
  private boolean connected = false;
  private ModuleRegistry moduleRegistry;
  protected BluetoothGatt gatt;
  protected int MTU;

  public Peripheral(BluetoothDevice device, int advertisingRSSI, byte[] scanRecord, ModuleRegistry moduleRegistry) {
    this.device = device;
    this.advertisingRSSI = advertisingRSSI;
    this.advertisingDataBytes = scanRecord;
    this.moduleRegistry = moduleRegistry;
  }

  public Peripheral(BluetoothDevice device, int advertisingRSSI, ScanRecord scanRecord, ModuleRegistry moduleRegistry) {
    this.device = device;
    this.advertisingRSSI = advertisingRSSI;
    this.advertisingData = scanRecord;
    this.advertisingDataBytes = scanRecord.getBytes();
    this.moduleRegistry = moduleRegistry;
  }

  public Peripheral(BluetoothDevice device, ModuleRegistry moduleRegistry) {
    this.device = device;
    this.moduleRegistry = moduleRegistry;
  }

  public void connect(Promise promise, Activity activity) {
    if (!connected) {
      BluetoothDevice device = getDevice();
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        gatt = device.connectGatt(activity, false, this);
      } else {
        gatt = device.connectGatt(activity, false, this, BluetoothDevice.TRANSPORT_LE);
      }
      promise.resolve(null);
    } else {
      if (guardGATT(promise)) {
        return;
      }
      promise.resolve(null);
    }
  }

  public void disconnect() {
    connected = false;
    if (gatt != null) {
      try {
        gatt.disconnect();
        gatt.close();
        gatt = null;
        Log.d(BluetoothModule.TAG, "Disconnect");
        sendDisconnectedEvent(null);
      } catch (Exception e) {

        //TODO: Bacon: Add more of a standard around errors
        Bundle errorPayload = new Bundle();
        errorPayload.putString("message", e.getMessage());

        sendDisconnectedEvent(errorPayload);
      }
    } else {
      Log.d(BluetoothModule.TAG, "GATT is null");
    }
  }

  // TODO: Bacon: [iOS] Are solicitedServiceUUIDs overflowServiceUUIDs possible
  public Bundle advertisementData() {
    Bundle advertising = new Bundle();
    String name = device.getName();
    advertising.putString("localName", name);
    advertising.putInt("txPowerLevel", advertisingData.getTxPowerLevel());
    advertising.putBoolean("isConnectable", true);
    advertising.putString("manufacturerData", Base64.encodeToString(advertisingDataBytes, Base64.NO_WRAP));

    if (advertisingData != null) {
      String deviceName = advertisingData.getDeviceName();
      if (deviceName != null) {
        advertising.putString("localName", deviceName.replace("\0", ""));
      }

      Bundle serviceData = new Bundle();
      if (advertisingData.getServiceData() != null) {
        for (Map.Entry<ParcelUuid, byte[]> entry : advertisingData.getServiceData().entrySet()) {
          if (entry.getValue() != null) {
            serviceData.putString(UUIDHelper.fromUUID((entry.getKey()).getUuid()), Base64.encodeToString(entry.getValue(), Base64.NO_WRAP));
          }
        }
      }
      advertising.putBundle("serviceData", serviceData);

      ArrayList serviceUuids = new ArrayList();
      if (advertisingData.getServiceUuids() != null && advertisingData.getServiceUuids().size() != 0) {
        for (ParcelUuid uuid : advertisingData.getServiceUuids()) {
          serviceUuids.add(UUIDHelper.fromUUID(uuid.getUuid()));
        }
      }
      advertising.putParcelableArrayList("serviceUUIDs", serviceUuids);
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
    if (gatt == null) {
      return null;
    }
    return gatt.getService(uuid) != null;
  }

  // didDiscoverServices
  @Override
  public void onServicesDiscovered(BluetoothGatt gatt, int status) {
    super.onServicesDiscovered(gatt, status);

    Bundle output = new Bundle();

    Bundle peripheralData = Serialize.Peripheral_NativeToJSON(this);
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, peripheralData);

    String transactionId = "scan|" + device.getAddress();
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, transactionId);

    if (status != BluetoothGatt.GATT_SUCCESS) {
      output.putBundle(BluetoothModule.EXBluetoothErrorKey, errorFromGattStatus(status));
    }

    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothPeripheralDidDiscoverServicesEvent, output);
  }

  private void sendConnectedEvent(Bundle error) {
    Bundle output = new Bundle();
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(this));
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "connect|" + this.getUUIDString());
    output.putBundle(BluetoothModule.EXBluetoothErrorKey, error);
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothCentralDidConnectPeripheralEvent, output);
  }

  private void sendDisconnectedEvent(Bundle error) {
    Bundle output = new Bundle();
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(this));
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "disconnect|" + this.getUUIDString());
    output.putBundle(BluetoothModule.EXBluetoothErrorKey, error);
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothCentralDidDisconnectPeripheralEvent, output);
  }

  @Override
  public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
    this.gatt = gatt;

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
            this.gatt = null;
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

  public void updateRssi(int rssi) {
    advertisingRSSI = rssi;
  }

  public void updateData(byte[] data) {
    advertisingDataBytes = data;
  }

  public void updateData(ScanRecord scanRecord) {
    advertisingData = scanRecord;
    advertisingDataBytes = scanRecord.getBytes();
  }

  String getUUIDString() {
    return device.getAddress();
  }

  @Override
  public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
    super.onCharacteristicChanged(gatt, characteristic);
    Bundle characteristicData = Serialize.Characteristic_NativeToJSON(characteristic, this.getUUIDString());

    Bundle output = new Bundle();
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "read|" + characteristicData.getString("id"));
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(this));
    output.putBundle(BluetoothModule.EXBluetoothCharacteristicKey, characteristicData);
    // TODO: Bacon: Can we get an Error ??
//    output.putBundle(BluetoothModule.EXBluetoothErrorKey, error);
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent, output);
  }

  @Override
  public void onCharacteristicRead(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
    super.onCharacteristicRead(gatt, characteristic, status);

    Bundle characteristicData = Serialize.Characteristic_NativeToJSON(characteristic, this.getUUIDString());
    Bundle output = new Bundle();
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "read|" + characteristicData.getString("id"));
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(this));
    output.putBundle(BluetoothModule.EXBluetoothCharacteristicKey, characteristicData);
    output.putBundle(BluetoothModule.EXBluetoothErrorKey, errorFromGattStatus(status));
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent, output);
  }

  @Override
  public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
    super.onCharacteristicWrite(gatt, characteristic, status);

    Bundle characteristicData = Serialize.Characteristic_NativeToJSON(characteristic, this.getUUIDString());
    Bundle output = new Bundle();
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "write|" + characteristicData.getString("id"));
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(this));
    output.putBundle(BluetoothModule.EXBluetoothCharacteristicKey, characteristicData);
    output.putBundle(BluetoothModule.EXBluetoothErrorKey, errorFromGattStatus(status));
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothPeripheralDidWriteValueForCharacteristicEvent, output);
  }

  private Bundle errorFromGattStatus(int status) {
    if (status != BluetoothGatt.GATT_SUCCESS) {
      Bundle output = new Bundle();
      output.putString("message", Serialize.messageForGATTStatus(status));
      return output;
    }
    return null;
  }

  @Override
  public void onDescriptorRead(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
    super.onDescriptorRead(gatt, descriptor, status);
    Bundle descriptorData = Serialize.Descriptor_NativeToJSON(descriptor, this.getUUIDString());
    Bundle output = new Bundle();
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "read|" + descriptorData.getString("id"));
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(this));
    output.putBundle("descriptor'", descriptorData);
    output.putBundle(BluetoothModule.EXBluetoothErrorKey, errorFromGattStatus(status));
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothPeripheralDidUpdateValueForDescriptorEvent, output);
  }

  @Override
  public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
    super.onDescriptorWrite(gatt, descriptor, status);
    Bundle descriptorData = Serialize.Descriptor_NativeToJSON(descriptor, this.getUUIDString());
    Bundle output = new Bundle();
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "write|" + descriptorData.getString("id"));
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(this));
    output.putBundle("descriptor'", descriptorData);
    output.putBundle(BluetoothModule.EXBluetoothErrorKey, errorFromGattStatus(status));
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothPeripheralDidWriteValueForDescriptorEvent, output);
  }

  @Override
  public void onReadRemoteRssi(BluetoothGatt gatt, int rssi, int status) {
    super.onReadRemoteRssi(gatt, rssi, status);
    if (status == BluetoothGatt.GATT_SUCCESS) {
      updateRssi(rssi);
    }
    // TODO: Bacon: Send RSSI event here - not done on iOS either
  }

  public BluetoothGattService getServiceOrReject(BluetoothGatt peripheral, String serviceUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(serviceUUIDString);
    BluetoothGattService service = peripheral.getService(uuid);
    if (service == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_SERVICE, BluetoothError.Messages.NO_SERVICE));
      return null;
    }
    return service;
  }

  public BluetoothGattCharacteristic getCharacteristicOrReject(BluetoothGattService service, String characteristicUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(characteristicUUIDString);
    BluetoothGattCharacteristic characteristic = service.getCharacteristic(uuid);
    if (characteristic == null) {
      BluetoothError.reject(promise, new BluetoothError(BluetoothError.Codes.NO_CHARACTERISTIC, BluetoothError.Messages.NO_CHARACTERISTIC));
      return null;
    }
    return characteristic;
  }

  public BluetoothGattDescriptor getDescriptorOrReject(BluetoothGattCharacteristic characteristic, String descriptorUUIDString, Promise promise) {
    UUID uuid = UUIDHelper.toUUID(descriptorUUIDString);
    BluetoothGattDescriptor descriptor = characteristic.getDescriptor(uuid);
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

    BluetoothGattService service = getServiceOrReject(gatt, (String) options.get("serviceUUID"), promise);
    if (service == null) {
      return;
    }
    BluetoothGattCharacteristic characteristic = getCharacteristicOrReject(service, (String) options.get("characteristicUUID"), promise);
    if (characteristic == null) {
      return;
    }
    BluetoothGattDescriptor descriptor = getDescriptorOrReject(characteristic, (String) options.get("descriptorUUID"), promise);
    if (descriptor == null) {
      return;
    }

    String characteristicPropertiesString = (String) options.get("characteristicProperties");
    int characteristicProperty = Serialize.CharacteristicProperties_JSONToNative(characteristicPropertiesString);

    switch (characteristicProperty) {
      case BluetoothGattCharacteristic.PROPERTY_READ:
        if (!gatt.readDescriptor(descriptor)) {
          //TODO: Bacon: Full breakout - match iOS
          BluetoothError.reject(promise, "Failed to read descriptor: " + descriptor.getUuid().toString());
          return;
        }
        promise.resolve(null);
        return;
      case BluetoothGattCharacteristic.PROPERTY_WRITE:
      case BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE:
//        // TODO: Bacon: This is different to iOS
        List data = (List) options.get("data");
        byte[] decoded = Serialize.Base64_JSONToNative(data);
//        // TODO: Bacon: This should be in options?
        int writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT;
        if (characteristicProperty == BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) {
          writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE;
        }
        // TODO: Bacon: Write without notification?
        descriptor.setValue(decoded);

        if (!gatt.writeDescriptor(descriptor)) {
          BluetoothError.reject(promise, "Failed to write to descriptor: " + descriptor.getUuid().toString());
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

    BluetoothGattService service = getServiceOrReject(gatt, (String) options.get("serviceUUID"), promise);
    if (service == null) {
      return;
    }
    BluetoothGattCharacteristic characteristic = getCharacteristicOrReject(service, (String) options.get("characteristicUUID"), promise);
    if (characteristic == null) {
      return;
    }

    String characteristicPropertiesString = (String) options.get("characteristicProperties");
    int characteristicProperty = Serialize.CharacteristicProperties_JSONToNative(characteristicPropertiesString);

    switch (characteristicProperty) {
      case BluetoothGattCharacteristic.PROPERTY_READ:
        if (!gatt.readCharacteristic(characteristic)) {
          //TODO: Bacon: Full breakout - match iOS
          BluetoothError.reject(promise, "Failed to read characteristic: " + characteristic.getUuid().toString());
          return;
        }
        promise.resolve(null);
        return;
      case BluetoothGattCharacteristic.PROPERTY_WRITE:
      case BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE:
//        // TODO: Bacon: This is different to iOS
        List data = (List) options.get("data");
        byte[] decoded = Serialize.Base64_JSONToNative(data);
//        // TODO: Bacon: This should be in options?
        int writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT;
        if (characteristicProperty == BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) {
          writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE;
        }
        // TODO: Bacon: Write without notification?
        characteristic.setValue(decoded);

        if (!gatt.writeCharacteristic(characteristic)) {
          BluetoothError.reject(promise, "Failed to write to characteristic: " + characteristic.getUuid().toString());
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

    Log.d(BluetoothModule.TAG, "setNotify");

    BluetoothGattService service = gatt.getService(serviceUUID);
    BluetoothGattCharacteristic characteristic = findNotifyCharacteristic(service, characteristicUUID);

    if (characteristic == null) {
      promise.reject(BluetoothModule.ERROR_TAG, "Characteristic " + characteristicUUID + " not found");
      return;
    }

    if (!gatt.setCharacteristicNotification(characteristic, notify)) {
      promise.reject(BluetoothModule.ERROR_TAG, "Failed to register notification for " + characteristicUUID);
      return;
    }

    BluetoothGattDescriptor descriptor = characteristic.getDescriptor(UUIDHelper.toUUID(CHARACTERISTIC_NOTIFICATION_CONFIG));

    if (descriptor == null) {
      promise.reject(BluetoothModule.ERROR_TAG, "Set notification failed for " + characteristicUUID);
      return;
    }

    // Prefer notify over indicate
    if ((characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0) {
      Log.d(BluetoothModule.TAG, "Characteristic " + characteristicUUID + " set NOTIFY");
      descriptor.setValue(notify ? BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE : BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
    } else if ((characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0) {
      Log.d(BluetoothModule.TAG, "Characteristic " + characteristicUUID + " set INDICATE");
      descriptor.setValue(notify ? BluetoothGattDescriptor.ENABLE_INDICATION_VALUE : BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
    } else {
      Log.d(BluetoothModule.TAG, "Characteristic " + characteristicUUID + " does not have NOTIFY or INDICATE property set");
    }

    try {
      if (gatt.writeDescriptor(descriptor)) {
        Log.d(BluetoothModule.TAG, "setNotify complete");
      } else {
        promise.reject(BluetoothModule.ERROR_TAG, "Failed to set client characteristic notification for " + characteristicUUID);
      }
    } catch (Exception e) {
      Log.d(BluetoothModule.TAG, "Error on setNotify", e);
      promise.reject(BluetoothModule.ERROR_TAG, "Failed to set client characteristic notification for " + characteristicUUID + ", error: " + e.getMessage());
    }
  }

  public void registerNotify(UUID serviceUUID, UUID characteristicUUID, Promise promise) {
    Log.d(BluetoothModule.TAG, "registerNotify");
    this.setNotify(serviceUUID, characteristicUUID, true, promise);
  }

  public void removeNotify(UUID serviceUUID, UUID characteristicUUID, Promise promise) {
    Log.d(BluetoothModule.TAG, "removeNotify");
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
      Log.e(BluetoothModule.TAG, "Error on characteristic: " + characteristicUUID, e);
      return null;
    }
  }

  public void readRSSI(Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }

    if (!gatt.readRemoteRssi()) {
      BluetoothError.reject(promise, "Failed  to read RSSI from peripheral: " + getUUIDString());
      return;
    }
    promise.resolve(null);
  }

//  public void refreshCache(Promise promise) {
//    try {
//
//      Method localMethod = gatt.getClass().getMethod("refresh", new Class[0]);
//      if (localMethod != null) {
//        boolean res = ((Boolean) localMethod.invoke(gatt, new Object[0])).booleanValue();
//        promise.resolve(res);
//      } else {
//        promise.reject(BluetoothModule.ERROR_TAG, "Could not refresh cache for device.");
//      }
//    } catch (Exception localException) {
//      promise.reject(localException);
//    }
//  }

  public void retrieveServices(Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }
    gatt.discoverServices();
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
    if (gatt.requestConnectionPriority(connectionPriority)) {
      BluetoothError.reject(promise, "Failed to request connection priority: " + connectionPriority);
      return;
    }
    promise.resolve(null);
  }

  public void requestMTU(int mtu, Promise promise) {
    if (guardIsConnected(promise) || guardGATT(promise)) {
      return;
    }
    if (gatt.requestMtu(mtu)) {
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
//      output.putBundle(BluetoothModule.EXBluetoothCentral, null);
    output.putInt("mtu", mtu);
    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "mtu|" + this.device.getAddress());
    output.putBundle(BluetoothModule.EXBluetoothErrorKey, errorFromGattStatus(status));
    BluetoothModule.sendEvent(moduleRegistry, BluetoothModule.EXBluetoothCentralDidConnectPeripheralEvent, output);
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
      Log.e(BluetoothModule.TAG, "Error on findWritableCharacteristic", e);
      return null;
    }
  }

  private boolean guardIsConnected(Promise promise) {
    if (!isConnected()) {
      promise.reject(BluetoothModule.ERROR_TAG, "Peripheral is not connected: " + this.getUUIDString());
      return true;
    }
    return false;
  }

  private boolean guardGATT(Promise promise) {
    if (gatt == null) {
      promise.reject(BluetoothModule.ERROR_TAG, "GATT is not defined");
      return true;
    }
    return false;
  }
}
