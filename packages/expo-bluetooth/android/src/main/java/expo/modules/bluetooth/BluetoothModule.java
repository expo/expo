package expo.modules.bluetooth;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothClass.Service;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityEventListener;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.EventEmitter;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.permissions.Permissions;

import static android.app.Activity.RESULT_OK;
import static android.bluetooth.BluetoothDevice.DEVICE_TYPE_DUAL;
import static android.bluetooth.BluetoothDevice.DEVICE_TYPE_LE;


public class BluetoothModule extends ExportedModule implements ModuleRegistryConsumer, ActivityEventListener {


  // base UUID used to build 128 bit Bluetooth UUIDs
  public static final String UUID_BASE = "0000XXXX-0000-1000-8000-00805f9b34fb";
  protected static final String TAG = "ExpoBluetooth";
  protected static final String ERROR_TAG = "ERR_BLUETOOTH";
  private static final String EXBluetoothEvent = "bluetoothEvent";
  private static final String EXBluetoothEnableEvent = "bluetoothEnable";
//  private static final String EXBluetoothDisconnectEvent = "bluetoothDisconnect";
//  private static final String EXBluetoothDidFailToConnectEvent = "bluetoothDidFailToConnect";
  protected static final String EXBluetoothCentralDidUpdateStateEvent = "bluetoothCentralDidUpdateState";
  protected static final String EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent = "central.didRetrieveConnectedPeripherals";
  protected static final String EXBluetoothCentralDidRetrievePeripheralsEvent = "central.didRetrievePeripherals";
  protected static final String EXBluetoothCentralDidDiscoverPeripheralEvent = "central.didDiscoverPeripheral";
  protected static final String EXBluetoothCentralDidConnectPeripheralEvent = "central.didConnectPeripheral";
  protected static final String EXBluetoothCentralDidDisconnectPeripheralEvent = "central.didDisconnectPeripheral";
  protected static final String EXBluetoothCentralDidStopScanningEvent = "central.didStopScanning";

  protected static final String EXBluetoothPeripheralDidDiscoverServicesEvent = "peripheral.didDiscoverServices";
  protected static final String EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent = "peripheral.didDiscoverCharacteristicsForService";
  protected static final String EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent = "peripheral.didDiscoverDescriptorsForCharacteristic";
  protected static final String EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent = "peripheral.didUpdateValueForCharacteristic";
  protected static final String EXBluetoothPeripheralDidWriteValueForCharacteristicEvent = "peripheral.didWriteValueForCharacteristic";
  protected static final String EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent = "peripheral.didUpdateNotificationStateForCharacteristic";
  protected static final String EXBluetoothPeripheralDidUpdateValueForDescriptorEvent = "peripheral.didUpdateValueForDescriptor";
  protected static final String EXBluetoothPeripheralDidWriteValueForDescriptorEvent = "peripheral.didWriteValueForDescriptor";
  protected static final String EXBluetoothCentral = "central";
  protected static final String EXBluetoothPeripheral = "peripheral";
  private static final String EXBluetoothEventKey = "event";
  private static final String EXBluetoothDataKey = "data";
  protected static final String EXBluetoothErrorKey = "error";
  protected static final String EXBluetoothTransactionIdKey = "transactionId";
  protected static final String EXBluetoothCharacteristicKey = "characteristic";
  protected static final String EXBluetoothServiceKey = "service";
  private static final int ENABLE_REQUEST = 65072;
  private Map<String, Peripheral> peripherals = new LinkedHashMap<>();
  BluetoothScanManager scanManager;
  private ModuleRegistry mModuleRegistry;
  private BluetoothManager bluetoothManager;
  private BondRequest bondRequest;
  private BondRequest removeBondRequest;
  private BroadcastReceiver mReceiver;

  public BluetoothModule(Context context) {
    super(context);
  }

  protected static void sendEvent(ModuleRegistry moduleRegistry, final String eventName, Bundle data) {
    if (moduleRegistry != null) {
      EventEmitter eventEmitter = moduleRegistry.getModule(EventEmitter.class);
      if (eventEmitter != null) {
        Bundle message = new Bundle();
        message.putString(EXBluetoothEventKey, eventName);
        message.putBundle(EXBluetoothDataKey, data);
        eventEmitter.emit(EXBluetoothEvent, message);
        return;
      }
    }
    String errorMessage = "Could not emit " + eventName + " event, no event emitter or module registry present.";
    Log.e(TAG, errorMessage);
  }

  private Permissions mPermissions;
  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {

    if (mReceiver != null) {
      getApplicationContext().unregisterReceiver(mReceiver);
      mReceiver = null;
    }

    if (mModuleRegistry != null) {
      // Unregister from old UIManager
      if (scanManager != null) {
        scanManager.stopScan();
        scanManager = null;
      }

      for (Peripheral peripheral : peripherals.values()) {
        peripheral.disconnect();
      }
      peripherals = new LinkedHashMap<>();
    }

    mModuleRegistry = moduleRegistry;
    mPermissions = moduleRegistry.getModule(Permissions.class);

    if (mModuleRegistry != null) {
      // Register to new UIManager
      if (mModuleRegistry.getModule(UIManager.class) != null) {
        mModuleRegistry.getModule(UIManager.class).registerActivityEventListener(this);
      }
      createBluetoothInstance();
    }
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("BLUETOOTH_EVENT", EXBluetoothEvent);

    final Map<String, Object> events = new HashMap<>();

    events.put("CENTRAL_DID_UPDATE_STATE_EVENT", EXBluetoothCentralDidUpdateStateEvent);
    events.put("CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS_EVENT", EXBluetoothCentralDidRetrieveConnectedPeripheralsEvent);
    events.put("CENTRAL_DID_RETRIEVE_PERIPHERALS_EVENT", EXBluetoothCentralDidRetrievePeripheralsEvent);
    events.put("CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT", EXBluetoothCentralDidDiscoverPeripheralEvent);
    events.put("CENTRAL_DID_CONNECT_PERIPHERAL_EVENT", EXBluetoothCentralDidConnectPeripheralEvent);
    events.put("CENTRAL_DID_DISCONNECT_PERIPHERAL_EVENT", EXBluetoothCentralDidDisconnectPeripheralEvent);
    events.put("CENTRAL_DID_STOP_SCANNING_EVENT", EXBluetoothCentralDidStopScanningEvent);
    events.put("PERIPHERAL_DID_DISCOVER_SERVICES_EVENT", EXBluetoothPeripheralDidDiscoverServicesEvent);
    events.put("PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE_EVENT", EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent);
    events.put("PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC_EVENT", EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent);
    events.put("PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC_EVENT", EXBluetoothPeripheralDidUpdateValueForCharacteristicEvent);
    events.put("PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC_EVENT", EXBluetoothPeripheralDidWriteValueForCharacteristicEvent);
    events.put("PERIPHERAL_DID_UPDATE_NOTIFICATION_STATE_FOR_CHARACTERISTIC_EVENT", EXBluetoothPeripheralDidUpdateNotificationStateForCharacteristicEvent);
    events.put("PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR_EVENT", EXBluetoothPeripheralDidUpdateValueForDescriptorEvent);
    events.put("PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR_EVENT", EXBluetoothPeripheralDidWriteValueForDescriptorEvent);
    events.put("ENABLE_EVENT", EXBluetoothEnableEvent);
    constants.put("Events", events);

    return constants;
  }

  private Activity getCurrentActivity() {
    if (mModuleRegistry != null) {
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      return activityProvider.getCurrentActivity();
    }
    return null;
  }

  protected final Context getApplicationContext() {
    Activity activity = getCurrentActivity();
    if (activity != null) {
      return activity.getApplicationContext();
    }
    return null;
  }

  protected void sendEvent(final String eventName, Bundle data) {
    BluetoothModule.sendEvent(mModuleRegistry, eventName, data);
  }

  private BluetoothAdapter getBluetoothAdapter() {
    BluetoothManager manager = getBluetoothManager();
    return manager.getAdapter();
  }

  private BluetoothManager getBluetoothManager() {
    if (bluetoothManager == null) {
      bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
    }
    return bluetoothManager;
  }

  // TODO: Bacon: Done!
  // TODO: Bacon: Add to JS - Android only
  @ExpoMethod
  public void requestMTU(String peripheralUUID, int mtuValue, Promise promise) {
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }
    peripheral.requestMTU(mtuValue, promise);
  }

  private void createBluetoothInstance() {
    if (getBluetoothAdapter() == null) {
      return;
    }

    scanManager = new BluetoothScanManager(getContext(), mModuleRegistry, new ScanCallback() {
      @Override
      public void onScanResult(final int callbackType, final ScanResult result) {

        mModuleRegistry.getModule(UIManager.class).runOnUiQueueThread(new Runnable() {
          @Override
          public void run() {

            Peripheral peripheral = savePeripheral(result.getDevice(), result.getRssi(), result.getScanRecord());
            Bundle output = new Bundle();
            output.putInt("rssi", result.getRssi());
            output.putBundle("advertisementData", peripheral.advertisementData());
            output.putBundle(EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(peripheral));
            output.putBundle(EXBluetoothCentral, Serialize.BluetoothAdapter_NativeToJSON(getBluetoothAdapter()));

            BluetoothModule.sendEvent(mModuleRegistry, EXBluetoothCentralDidDiscoverPeripheralEvent, output);
          }
        });
      }

      @Override
      public void onBatchScanResults(final List<ScanResult> results) {
      }

      @Override
      public void onScanFailed(final int errorCode) {
        Bundle map = new Bundle();
        BluetoothModule.sendEvent(mModuleRegistry, "BluetoothManagerStopScan", map);
      }
    });

    IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
    filter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);

    mReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "onReceive");
        final String action = intent.getAction();


        if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
          // TODO: Bacon: Test if this works like expected: centralManagerDidUpdateState
          final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);

          Bundle map = Serialize.BluetoothAdapter_NativeToJSON(getBluetoothAdapter());
          String stringState = Serialize.AdapterState_NativeToJSON(state);

          // TODO: Bacon: Is stringState not equal to existing state??
          map.putString("state", stringState);

          Bundle output = new Bundle();
          output.putBundle(EXBluetoothCentral, map);
          sendEvent(EXBluetoothCentralDidUpdateStateEvent, output);

        } else if (action.equals(BluetoothDevice.ACTION_BOND_STATE_CHANGED)) {

          final int bondState = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR);
          final int prevState = intent.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.ERROR);
          BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);

          String bondStateStr = "UNKNOWN";
          switch (bondState) {
            case BluetoothDevice.BOND_BONDED:
              bondStateStr = "BOND_BONDED";
              break;
            case BluetoothDevice.BOND_BONDING:
              bondStateStr = "BOND_BONDING";
              break;
            case BluetoothDevice.BOND_NONE:
              bondStateStr = "BOND_NONE";
              break;
          }
          Log.d(TAG, "bond state: " + bondStateStr);

          if (bondRequest != null && bondRequest.uuid.equals(device.getAddress())) {
            if (bondState == BluetoothDevice.BOND_BONDED) {
              bondRequest.promise.resolve(null);
              bondRequest = null;
            } else if (bondState == BluetoothDevice.BOND_NONE || bondState == BluetoothDevice.ERROR) {
              bondRequest.promise.reject(ERROR_TAG, "Bond request has been denied");
              bondRequest = null;
            }
          }
          if (removeBondRequest != null && removeBondRequest.uuid.equals(device.getAddress()) && bondState == BluetoothDevice.BOND_NONE && prevState == BluetoothDevice.BOND_BONDED) {
            removeBondRequest.promise.resolve(null);
            removeBondRequest = null;
          }
        }
      }
    };

    getApplicationContext().registerReceiver(mReceiver, filter);
  }

//  @ExpoMethod
//  public void initializeManagerAsync(
//      final Map<String, Object> options,
//      final Promise promise
//  ) {
//
//    if (guardBluetoothAvailability(promise)) {
//      return;
//    }
//
//    scanManager = new BluetoothScanManager(getContext(), mModuleRegistry, new ScanCallback() {
//      @Override
//      public void onScanResult(final int callbackType, final ScanResult result) {
//
//        mModuleRegistry.getModule(UIManager.class).runOnUiQueueThread(new Runnable() {
//          @Override
//          public void run() {
//
//            Peripheral peripheral = savePeripheral(result.getDevice(), result.getRssi(), result.getScanRecord());
//
//            Bundle peripheralData = peripheral.asWritableMap();
//
//            Bundle output = new Bundle();
//            //TODO: Bacon: Add RSSI & Advertisment data... Are they better off bundled in the device (peripheral)
//            output.putInt("rssi", result.getRssi());
////            output.putBundle("advertisementData", Serialize.advertisementData_NativeToJSON() );
//            output.putBundle(EXBluetoothPeripheral, peripheralData);
//
//            Bundle central = Serialize.BluetoothAdapter_NativeToJSON(getBluetoothAdapter());
//            output.putBundle(EXBluetoothCentral, central);
//
//            BluetoothModule.sendEvent(mModuleRegistry, EXBluetoothCentralDidDiscoverPeripheralEvent, output);
//          }
//        });
//      }
//
//      @Override
//      public void onBatchScanResults(final List<ScanResult> results) {
//      }
//
//      @Override
//      public void onScanFailed(final int errorCode) {
//        Bundle map = new Bundle();
//        BluetoothModule.sendEvent(mModuleRegistry, "BluetoothManagerStopScan", map);
//      }
//    });
//
//    IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
//    filter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
//    getContext().registerReceiver(mReceiver, filter);
//    promise.resolve(null);
//  }

  // TODO: Bacon: Done Maybe?
  @ExpoMethod
  public void enableBluetoothAsync(
      Boolean shouldEnable,
      final Promise promise
  ) {
    if (guardBluetoothAvailability(promise)) {
      return;
    }

    if (shouldEnable != getBluetoothAdapter().isEnabled()) {
      if (getCurrentActivity() == null) {
        promise.reject(ERROR_TAG, "Activity is not available");
        return;
      } else {
        if (shouldEnable) {
          getCurrentActivity().startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), ENABLE_REQUEST);
        } else {
          // TODO: Bacon: This prolly isn't allowed
          getCurrentActivity().startActivityForResult(new Intent("android.bluetooth.adapter.action.REQUEST_DISABLE"), ENABLE_REQUEST);
        }
        return;
      }
    } else {

      Bundle output = new Bundle();
      BluetoothAdapter adapter = getBluetoothAdapter();
      output.putBundle(EXBluetoothCentral, Serialize.BluetoothAdapter_NativeToJSON(adapter));
      sendEvent(EXBluetoothEnableEvent, output);
    }
    promise.resolve(null);
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void stopScanAsync(
      final Promise promise
  ) {
    if (guardBluetoothAvailability(promise) || guardPermission(promise) || guardBluetoothEnabled(promise) || guardBluetoothScanning(promise)) {
      return;
    }
    scanManager.stopScan();
    promise.resolve(null);
  }

    private boolean isMissingPermissions() {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        return mPermissions == null || mPermissions.getPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED;
      }
      return false;
  }

  private boolean guardPermission(Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_TAG, "Missing location permission");
      return true;
    }
    
    return false;
  }

  // TODO: Bacon: Maybe done?
  @ExpoMethod
  public void startScanAsync(
      final ArrayList<String> serviceUUIDStrings,
      final Map<String, Object> options,
      final Promise promise
  ) {
    if (guardBluetoothAvailability(promise) || guardPermission(promise) || guardBluetoothEnabled(promise) || guardBluetoothScanning(promise)) {
      return;
    }
    removeAllCachedPeripherals();
    int timeout = 0;
    if (options.containsKey("timeout")) {
      timeout = (int) options.get("timeout");
    }

    scanManager.scan(serviceUUIDStrings, timeout, options, promise);
  }


  // TODO: Bacon: Done!
  @ExpoMethod
  public void getCentralAsync(
      final Promise promise
  ) {
    BluetoothAdapter adapter = getBluetoothAdapter();
    promise.resolve(Serialize.BluetoothAdapter_NativeToJSON(adapter));
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void getPeripheralsAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Map<String, Peripheral> peripheralsCopy = new LinkedHashMap<>(peripherals);
    ArrayList<Peripheral> input = new ArrayList<>(peripheralsCopy.values());
    promise.resolve(Serialize.PeripheralList_NativeToJSON(input));
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void getBondedPeripheralsAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    ArrayList bonded = new ArrayList<>();
    Set<BluetoothDevice> bondedDevices = getBluetoothAdapter().getBondedDevices();
    for (BluetoothDevice device : bondedDevices) {
      device.getBondState();
      int type = device.getType();
      if (type == DEVICE_TYPE_LE || type == DEVICE_TYPE_DUAL) {
        Peripheral p = new Peripheral(device, mModuleRegistry);
        bonded.add(p);
      }
    }
    promise.resolve(Serialize.PeripheralList_NativeToJSON(bonded));
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void getConnectedPeripheralsAsync(List serviceUUIDs, final Promise promise) {
    List<BluetoothDevice> peripherals = getBluetoothManager().getConnectedDevices(BluetoothProfile.GATT);
    promise.resolve(Serialize.PeripheralList_NativeToJSON(peripheralsFromDevices(peripherals)));
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void connectAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    String peripheralUUID = (String) options.get("uuid");
    Peripheral peripheral = retrieveOrCreatePeripheral(peripheralUUID);
    if (peripheral == null) {
      promise.reject("ERR_NO_PERIPHERAL", "No valid peripheral with UUID " + peripheralUUID);
      return;
    }
    //TODO: Bacon: update Activity syntax for task manager
    peripheral.connect(promise, getCurrentActivity());
  }

  // Bacon: Done
  @ExpoMethod
  public void readRSSIAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    String peripheralUUID = (String) options.get("uuid");
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) return;
    peripheral.readRSSI(promise);
  }

  //TODO: Bacon: Maybe break this out into another function because it doesn't make sense on android like it does on iOS
  @ExpoMethod
  public void updateCharacteristicAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {

    Peripheral peripheral = _getPeripheralOrReject((String) options.get("peripheralUUID"), promise);
    if (peripheral == null) return;

    String serviceUUIDString = (String) options.get("serviceUUID");
    String characteristicUUIDString = (String) options.get("characteristicUUID");
    UUID serviceUUID = UUIDHelper.toUUID(serviceUUIDString);
    UUID characteristicUUID = UUIDHelper.toUUID(characteristicUUIDString);

    String characteristicProperties = (String) options.get("characteristicProperties");

    if (characteristicProperties.equals("write")) { // Write

      // TODO: Bacon: This is different to iOS
      List data = (List) options.get("data");
      byte[] decoded = new byte[data.size()];
      for (int i = 0; i < data.size(); i++) {
        decoded[i] = new Integer((Integer) data.get(i)).byteValue();
      }
      // TODO: Bacon: This is not on iOS
      int maxByteSize = (int) options.get("maxByteSize");
      // TODO: Bacon: This should be in options?
      int writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT;
      peripheral.write(serviceUUID, characteristicUUID, decoded, maxByteSize, null, writeType, promise);
      return;
    } else { // Read

      //TODO: Bacon: Done??
      peripheral.read(serviceUUID, characteristicUUID, promise);
      return;
    }
  }

  //TODO: Bacon: this isn't as simple as iOS
  @ExpoMethod
  public void updateDescriptorAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {

    Peripheral peripheral = _getPeripheralOrReject((String) options.get("peripheralUUID"), promise);
    if (peripheral == null) return;

    String serviceUUIDString = (String) options.get("serviceUUID");
    String characteristicUUIDString = (String) options.get("characteristicUUID");
    String descriptorUUIDString = (String) options.get("descriptorUUID");

    UUID serviceUUID = UUIDHelper.toUUID(serviceUUIDString);
    UUID characteristicUUID = UUIDHelper.toUUID(characteristicUUIDString);
    UUID descriptorUUID = UUIDHelper.toUUID(descriptorUUIDString);

    String characteristicProperties = (String) options.get("characteristicProperties");

    if (characteristicProperties.equals("write")) { // Write

      // TODO: Bacon: This is different to iOS
      List data = (List) options.get("data");
      byte[] decoded = new byte[data.size()];
      for (int i = 0; i < data.size(); i++) {
        decoded[i] = new Integer((Integer) data.get(i)).byteValue();
      }
      // TODO: Bacon: This is not on iOS
      int maxByteSize = (int) options.get("maxByteSize");
      // TODO: Bacon: This should be in options?
      int writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT;
      peripheral.write(serviceUUID, characteristicUUID, decoded, maxByteSize, null, writeType, promise);
      return;
    } else { // Read

      //TODO: Bacon: Done??
      peripheral.read(serviceUUID, characteristicUUID, promise);
      return;
    }
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void disconnectAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    String peripheralUUID = (String) options.get("uuid");
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) return;

    peripheral.disconnect();
    promise.resolve(null);
  }

  @ExpoMethod
  public void discoverAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {

    String peripheralUUID = (String) options.get("peripheralUUID");
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }

    if (!options.containsKey("serviceUUID")) {
      peripheral.retrieveServices(promise);
      return;
    }

    String serviceUUIDString = (String) options.get("serviceUUID");
    BluetoothGattService service = _getServiceOrReject(peripheral, serviceUUIDString, promise);
    if (service == null) {
      return;
    }

    if (!options.containsKey("characteristicUUID")) {
      promise.resolve(null);

      //TODO: Bacon: Are these gotten automatically?
      Bundle output = new Bundle();
      Bundle peripheralData = Serialize.Peripheral_NativeToJSON(peripheral);
      output.putBundle(BluetoothModule.EXBluetoothPeripheral, peripheralData);

      Bundle serviceData = Serialize.Service_NativeToJSON(service, peripheralUUID);
      output.putBundle(BluetoothModule.EXBluetoothServiceKey, peripheralData);

      String transactionId = "scan|" + serviceData.getString("id");
      output.putString(BluetoothModule.EXBluetoothTransactionIdKey, transactionId);
      BluetoothModule.sendEvent(mModuleRegistry, BluetoothModule.EXBluetoothPeripheralDidDiscoverServicesEvent, output);
      return;
    }

    String characteristicUUIDString = (String) options.get("characteristicUUID");
    BluetoothGattCharacteristic characteristic = _getCharacteristicOrReject(service, characteristicUUIDString, promise);
    if (characteristic == null) {
      return;
    }

    if (!options.containsKey("descriptorUUID")) {
      promise.resolve(null);

      Bundle serviceData = Serialize.Service_NativeToJSON(service, peripheral.getUUIDString());
      Bundle output = new Bundle();
      output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "scan|" + serviceData.getString("id") + "|" + characteristicUUIDString);
      output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(peripheral));
      output.putBundle(BluetoothModule.EXBluetoothServiceKey, serviceData);
      BluetoothModule.sendEvent(mModuleRegistry, BluetoothModule.EXBluetoothPeripheralDidDiscoverCharacteristicsForServiceEvent, output);
      return;
    }

    String descriptorUUIDString = (String) options.get("descriptorUUID");
    BluetoothGattDescriptor descriptor = _getDescriptorOrReject(characteristic, descriptorUUIDString, promise);
    if (descriptor == null) {
      return;
    }
    promise.resolve(null);


    Bundle characteristicData = Serialize.Characteristic_NativeToJSON(characteristic, peripheral.getUUIDString());
    Bundle output = new Bundle();

    output.putString(BluetoothModule.EXBluetoothTransactionIdKey, "scan|" + characteristicData.getString("id") + "|" + descriptorUUIDString);
    output.putBundle(BluetoothModule.EXBluetoothPeripheral, Serialize.Peripheral_NativeToJSON(peripheral));
    output.putBundle(BluetoothModule.EXBluetoothCharacteristicKey, characteristicData);
    BluetoothModule.sendEvent(mModuleRegistry, BluetoothModule.EXBluetoothPeripheralDidDiscoverDescriptorsForCharacteristicEvent, output);
  }

  private List<Peripheral> peripheralsFromDevices(List<BluetoothDevice> devices) {
    ArrayList bonded = new ArrayList<>();
    for (BluetoothDevice device : devices) {
      Peripheral p = new Peripheral(device, mModuleRegistry);
      bonded.add(p);
    }
    return bonded;
  }


  private void removeAllCachedPeripherals() {
    synchronized (peripherals) {
      for (Iterator<Map.Entry<String, Peripheral>> iterator = peripherals.entrySet().iterator(); iterator.hasNext(); ) {
        Map.Entry<String, Peripheral> entry = iterator.next();
        if (!entry.getValue().isConnected()) {
          iterator.remove();
        }
      }
    }
  }

  // TODO: Bacon: is this needed?
  private boolean guardBluetoothScanning(Promise promise) {
    if (scanManager == null) {
      promise.reject(ERROR_TAG, "Bluetooth scanning is not ready yet: Maybe you forgot to call initializeManagerAsync()");
      return true;
    }
    return false;
  }

  private boolean guardBluetoothAvailability(Promise promise) {
    if (getBluetoothAdapter() == null) {
      promise.reject(ERROR_TAG, "Bluetooth is not supported on this device");
      return true;
    }
    if (!getBluetoothAdapter().isEnabled()) {
      promise.reject(ERROR_TAG, "Bluetooth is not enabled");
      return true;
    }
    return false;
  }

  private boolean guardBluetoothEnabled(Promise promise) {
    if (!getBluetoothAdapter().isEnabled()) {
      promise.reject(ERROR_TAG, "Bluetooth is not enabled");
      return true;
    }
    return false;
  }

  private Peripheral _getPeripheralOrReject(String peripheralUUID, Promise promise) {
    Peripheral peripheral = peripherals.get(peripheralUUID);

    if (peripheral == null) {
      promise.reject("ERR_NO_PERIPHERAL", "No valid peripheral with UUID " + peripheralUUID);
    }

    return peripheral;
  }

  private BluetoothGattService _getServiceOrReject(Peripheral peripheral, String serviceUUIDString, Promise promise) {
    BluetoothGattService service = peripheral.gatt.getService(UUIDHelper.toUUID(serviceUUIDString));

    if (service == null) {
      promise.reject("ERR_NO_SERVICE", "No valid service with UUID " + serviceUUIDString);
    }

    return service;
  }

  private BluetoothGattCharacteristic _getCharacteristicOrReject(BluetoothGattService service, String uuid, Promise promise) {
    BluetoothGattCharacteristic characteristic = service.getCharacteristic(UUIDHelper.toUUID(uuid));

    if (characteristic == null) {
      promise.reject("ERR_NO_CHARACTERISTIC", "No valid characteristic with UUID " + uuid);
    }

    return characteristic;
  }

  private BluetoothGattDescriptor _getDescriptorOrReject(BluetoothGattCharacteristic characteristic, String uuid, Promise promise) {
    BluetoothGattDescriptor descriptor = characteristic.getDescriptor(UUIDHelper.toUUID(uuid));

    if (descriptor == null) {
      promise.reject("ERR_NO_DESCRIPTOR", "No valid descriptor with UUID " + uuid);
    }

    return descriptor;
  }

  private Peripheral retrieveOrCreatePeripheral(String peripheralUUID) {
    Peripheral peripheral = peripherals.get(peripheralUUID);
    if (peripheral == null) {
      synchronized (peripherals) {
        if (peripheralUUID != null) {
          peripheralUUID = peripheralUUID.toUpperCase();
        }
        if (BluetoothAdapter.checkBluetoothAddress(peripheralUUID)) {
          BluetoothDevice device = getBluetoothAdapter().getRemoteDevice(peripheralUUID);
          peripheral = new Peripheral(device, mModuleRegistry);
          peripherals.put(peripheralUUID, peripheral);
        }
      }
    }

    return peripheral;
  }

  private UUID[] parseServiceUUIDList(JSONArray jsonArray) throws JSONException {
    List<UUID> serviceUUIDs = new ArrayList<UUID>();

    for (int i = 0; i < jsonArray.length(); i++) {
      String uuidString = jsonArray.getString(i);
      serviceUUIDs.add(UUIDHelper.toUUID(uuidString));
    }

    return serviceUUIDs.toArray(new UUID[jsonArray.length()]);
  }

  private Peripheral savePeripheral(BluetoothDevice device) {
    String address = device.getAddress();
    synchronized (peripherals) {
      if (!peripherals.containsKey(address)) {
        Peripheral peripheral = new Peripheral(device, mModuleRegistry);
        peripherals.put(device.getAddress(), peripheral);
      }
    }
    return peripherals.get(address);
  }

  Peripheral savePeripheral(BluetoothDevice device, int rssi, byte[] scanRecord) {
    String address = device.getAddress();
    synchronized (peripherals) {
      if (!peripherals.containsKey(address)) {
        Peripheral peripheral = new Peripheral(device, rssi, scanRecord, mModuleRegistry);
        peripherals.put(device.getAddress(), peripheral);
      } else {
        Peripheral peripheral = peripherals.get(address);
        peripheral.updateRssi(rssi);
        peripheral.updateData(scanRecord);
      }
    }
    return peripherals.get(address);
  }

  Peripheral savePeripheral(BluetoothDevice device, int rssi, ScanRecord scanRecord) {
    String address = device.getAddress();
    synchronized (peripherals) {
      if (!peripherals.containsKey(address)) {
        Peripheral peripheral = new Peripheral(device, rssi, scanRecord, mModuleRegistry);
        peripherals.put(device.getAddress(), peripheral);
      } else {
        Peripheral peripheral = peripherals.get(address);
        peripheral.updateRssi(rssi);
        peripheral.updateData(scanRecord);
      }
    }
    return peripherals.get(address);
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    /*
     * TODO: Bacon:
     * In JS we need to observe Events.ENABLE_EVENT for { central, error } and callback with enabled event.
     */
    if (requestCode == ENABLE_REQUEST) {
      Bundle output = new Bundle();
      if (resultCode == RESULT_OK) {
        BluetoothAdapter adapter = getBluetoothAdapter();
        output.putBundle(EXBluetoothCentral, Serialize.BluetoothAdapter_NativeToJSON(adapter));
      } else {
        output.putBundle(EXBluetoothErrorKey, buildError("User denied enable request"));
      }
      sendEvent(EXBluetoothEnableEvent, output);
    }
  }

  private Bundle buildError(String message) {
    Bundle error = new Bundle();
    error.putString("message", message);
    return error;
  }

  @Override
  public void onNewIntent(Intent intent) {

  }

}
