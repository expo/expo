package expo.modules.bluetooth;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
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

import java.lang.reflect.Method;
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
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.EventEmitter;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.permissions.Permissions;
import expo.modules.bluetooth.helpers.UUIDHelper;
import expo.modules.bluetooth.objects.Characteristic;
import expo.modules.bluetooth.objects.Descriptor;
import expo.modules.bluetooth.objects.EXBluetoothObject;
import expo.modules.bluetooth.objects.Peripheral;
import expo.modules.bluetooth.objects.Service;

import static android.app.Activity.RESULT_OK;
import static android.bluetooth.BluetoothDevice.DEVICE_TYPE_DUAL;
import static android.bluetooth.BluetoothDevice.DEVICE_TYPE_LE;


public class BluetoothModule extends ExportedModule implements ModuleRegistryConsumer, ActivityEventListener {

  protected static final String TAG = "ExpoBluetooth";

  private static final int ENABLE_REQUEST = 65072;
  static ModuleRegistry moduleRegistry;
  public BluetoothScanManager scanManager;
  static private Map<String, Peripheral> peripherals = new LinkedHashMap<>();
  private ModuleRegistry mModuleRegistry;
  private BluetoothManager bluetoothManager;
  private BondingPromise createBond;
  private BondingPromise removeBond;
  private BroadcastReceiver mReceiver;
  private Permissions mPermissions;
  private boolean isDiscovering = false;

  public BluetoothModule(Context context) {
    super(context);
  }

  public static void sendEvent(final String eventName, Bundle data) {
    if (BluetoothModule.moduleRegistry != null) {
      EventEmitter eventEmitter = BluetoothModule.moduleRegistry.getModule(EventEmitter.class);
      if (eventEmitter != null) {
        Bundle message = new Bundle();
        message.putString(BluetoothConstants.JSON.EVENT, eventName);
        message.putBundle(BluetoothConstants.JSON.DATA, data);
        eventEmitter.emit(BluetoothConstants.JSON.BLUETOOTH_EVENT, message);
        return;
      }
    }
    String errorMessage = "Could not emit " + eventName + " event, no event emitter or module registry present.";
    Log.e(TAG, errorMessage);
  }

  public static void emitState() {
    if (peripherals != null) {
      Map<String, Peripheral> peripheralsCopy = new LinkedHashMap<>(peripherals);
      ArrayList<Peripheral> input = new ArrayList<>(peripheralsCopy.values());
      Bundle output = new Bundle();
      output.putParcelableArrayList(BluetoothConstants.JSON.PERIPHERALS, Peripheral.listToJSON(input));
      sendEvent("UPDATE", output);
    }
  }


  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    if (mReceiver != null) {
      getApplicationContext().unregisterReceiver(mReceiver);
      mReceiver = null;
    }

    isDiscovering = false;
    removeAllCachedPeripherals();
    bluetoothManager = null;
    BluetoothModule.moduleRegistry = moduleRegistry;
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
    constants.put("BLUETOOTH_EVENT", BluetoothConstants.JSON.BLUETOOTH_EVENT);

    final Map<String, Object> events = new HashMap<>();

    events.put("CENTRAL_DID_UPDATE_STATE", BluetoothConstants.EVENTS.CENTRAL_DID_UPDATE_STATE);
    events.put("CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS", BluetoothConstants.EVENTS.CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS);
    events.put("CENTRAL_DID_RETRIEVE_PERIPHERALS", BluetoothConstants.EVENTS.CENTRAL_DID_RETRIEVE_PERIPHERALS);
    events.put("CENTRAL_DID_DISCOVER_PERIPHERAL", BluetoothConstants.EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL);
    events.put("CENTRAL_DID_CONNECT_PERIPHERAL", BluetoothConstants.EVENTS.CENTRAL_DID_CONNECT_PERIPHERAL);
    events.put("CENTRAL_DID_DISCONNECT_PERIPHERAL", BluetoothConstants.EVENTS.CENTRAL_DID_DISCONNECT_PERIPHERAL);
    events.put("CENTRAL_DID_STOP_SCANNING", BluetoothConstants.EVENTS.CENTRAL_DID_STOP_SCANNING);
    events.put("PERIPHERAL_DID_DISCOVER_SERVICES", BluetoothConstants.EVENTS.PERIPHERAL_DID_DISCOVER_SERVICES);
    events.put("PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE", BluetoothConstants.EVENTS.PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE);
    events.put("PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC", BluetoothConstants.EVENTS.PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC);
    events.put("PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC", BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC);
    events.put("PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC", BluetoothConstants.EVENTS.PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC);
    events.put("PERIPHERAL_DID_UPDATE_NOTIFICATION_STATE_FOR_CHARACTERISTIC", BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_NOTIFICATION_STATE_FOR_CHARACTERISTIC);
    events.put("PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR", BluetoothConstants.EVENTS.PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR);
    events.put("PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR", BluetoothConstants.EVENTS.PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR);
    events.put("ENABLE_BLUETOOTH", BluetoothConstants.EVENTS.ENABLE_BLUETOOTH);

    constants.put("EVENTS", events);

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

  @ExpoMethod
  public void requestConnectionPriorityAsync(String peripheralUUID, Integer connectionPriority, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }
    peripheral.requestConnectionPriority(connectionPriority.intValue(), promise);
  }

  // TODO: Bacon: Add to JS - Android only
  @ExpoMethod
  public void requestMTUAsync(String peripheralUUID, Integer mtuValue, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }
    peripheral.requestMTU(mtuValue.intValue(), promise);
  }

  private boolean isScanning() {
    return isDiscovering;
  }

  private void createScanner() {

    BluetoothAdapter adapter = getBluetoothAdapter();
    if (adapter == null) {
      return;
    }
    if (scanManager != null) {
      scanManager.stopScan();
      scanManager = null;
    }

    isDiscovering = true;
    scanManager = new BluetoothScanManager(adapter, mModuleRegistry, new ScanCallback() {
      @Override
      public void onScanResult(final int callbackType, final ScanResult result) {
        if (!isScanning()) {
          return;
        }
        sendScanResult(result);
      }

      @Override
      public void onBatchScanResults(final List<ScanResult> results) {
        if (!isScanning()) {
          return;
        }
        for (ScanResult result : results) {
          sendScanResult(result);
        }
      }

      @Override
      public void onScanFailed(final int errorCode) {
        isDiscovering = false;

        BluetoothError error = BluetoothError.fromScanCallbackErrorCode(errorCode);

        Bundle map = new Bundle();
        map.putBundle(BluetoothConstants.JSON.ERROR, error.toJSON());
        BluetoothModule.sendEvent(BluetoothConstants.EVENTS.CENTRAL_DID_STOP_SCANNING, map);
        emitState();
      }
    });
  }

  private void sendScanResult(final ScanResult result) {
    Peripheral peripheral = savePeripheral(result.getDevice(), result.getRssi(), result.getScanRecord());
    Bundle output = new Bundle();
    output.putInt(BluetoothConstants.JSON.RSSI, result.getRssi());
    output.putBundle(BluetoothConstants.JSON.ADVERTISEMENT_DATA, peripheral.advertisementData());
    output.putBundle(BluetoothConstants.JSON.PERIPHERAL, peripheral.toJSON());
    output.putBundle(BluetoothConstants.JSON.CENTRAL, Serialize.BluetoothAdapter_NativeToJSON(getBluetoothAdapter(), isDiscovering));
    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL, output);
  }

  private void createBluetoothInstance() {
    BluetoothAdapter adapter = getBluetoothAdapter();
    if (adapter == null) {
      return;
    }
    createScanner();

    IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);

    filter.addAction(BluetoothDevice.ACTION_NAME_CHANGED);
    filter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
    filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
    filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_STARTED);

    mReceiver = null;
    mReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        final String action = intent.getAction();

        emitState();
        if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
          // TODO: Bacon: Test if this works like expected: centralManagerDidUpdateState
          final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);

          Bundle map = Serialize.BluetoothAdapter_NativeToJSON(getBluetoothAdapter(), isDiscovering);
          String stringState = Serialize.AdapterState_NativeToJSON(state);

          // TODO: Bacon: Is stringState not equal to existing state??
          map.putString("state", stringState);

          Bundle output = new Bundle();
          output.putBundle(BluetoothConstants.JSON.CENTRAL, map);
          BluetoothModule.sendEvent(BluetoothConstants.EVENTS.CENTRAL_DID_UPDATE_STATE, output);

        } else if (action.equals(BluetoothDevice.ACTION_BOND_STATE_CHANGED)) {

          final int bondState = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR);
          final int prevState = intent.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.ERROR);
          BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);

          String bondStateString = Serialize.Bonding_NativeToJSON(bondState);
          if (createBond != null && createBond.uuid.equals(device.getAddress())) {
            switch (bondState) {
              case BluetoothDevice.BOND_BONDED:
                createBond.promise.resolve(bondStateString);
                createBond = null;
                break;
              case BluetoothDevice.BOND_NONE:
              case BluetoothDevice.ERROR:
                createBond.promise.reject(BluetoothConstants.ERRORS.GENERAL, "The peripheral you attempted to bond with has denied the request.");
                createBond = null;
                break;
                default:
                  break;
            }
          }
          if (removeBond != null && removeBond.uuid.equals(device.getAddress()) && bondState == BluetoothDevice.BOND_NONE && prevState == BluetoothDevice.BOND_BONDED) {
            removeBond.promise.resolve(null);
            removeBond = null;
          }
        } else if (action.equals(BluetoothDevice.ACTION_NAME_CHANGED)) {
          // _didUpdateNameBlock
        } else if (action.equals(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)) {
          isDiscovering = false;
        } else if (action.equals(BluetoothAdapter.ACTION_DISCOVERY_STARTED)) {
          isDiscovering = true;
        }
      }
    };

    getContext().registerReceiver(mReceiver, filter);
  }

  @ExpoMethod
  public void createBondAsync(String peripheralUUID, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }

    Set<BluetoothDevice> deviceSet = getBluetoothAdapter().getBondedDevices();
    for (BluetoothDevice device : deviceSet) {
      if (peripheralUUID.equalsIgnoreCase(device.getAddress())) {
        String bondStateString = Serialize.Bonding_NativeToJSON(BluetoothDevice.BOND_BONDED);
        promise.resolve(bondStateString);
        return;
      }
    }

    Peripheral peripheral = retrieveOrCreatePeripheral(peripheralUUID);
    if (peripheral == null) {
      promise.reject("ERR_NO_PERIPHERAL", "No valid peripheral with UUID " + peripheralUUID);
      return;
    } else if (createBond != null) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "You are already attempting to Bond: " + createBond.uuid);
      return;
    } else if (!peripheral.getDevice().createBond()) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Couldn't bond to peripheral: " + peripheralUUID);
      return;
    }
    createBond = new BondingPromise(peripheralUUID, promise);
  }

  @ExpoMethod
  private void removeBondAsync(String peripheralUUID, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = retrieveOrCreatePeripheral(peripheralUUID);
    if (peripheral == null) {
      promise.reject("ERR_NO_PERIPHERAL", "No valid peripheral with UUID " + peripheralUUID);
      return;
    }

    try {
      // https://stackoverflow.com/a/11147911/4047926
      Method m = peripheral.getDevice().getClass().getMethod("removeBond", (Class[]) null);
      m.invoke(peripheral.getDevice(), (Object[]) null);
      removeBond = new BondingPromise(peripheralUUID, promise);
      return;
    } catch (Exception e) {
      promise.reject(e);
    }
  }

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
        promise.reject(BluetoothConstants.ERRORS.GENERAL, "Activity is not available");
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
      output.putBundle(BluetoothConstants.JSON.CENTRAL, Serialize.BluetoothAdapter_NativeToJSON(adapter, isDiscovering));
      BluetoothModule.sendEvent(BluetoothConstants.EVENTS.ENABLE_BLUETOOTH, output);
    }
    promise.resolve(getBluetoothAdapter().isEnabled());
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void stopScanningAsync(
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    scanManager.stopScan();
    // TODO: EMIT STATE
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
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Missing location permission");
      return true;
    }
    return false;
  }

  private boolean guardPeripheralAction(Promise promise) {
    return (guardPermission(promise) || guardBluetoothEnabled(promise) || guardBluetoothScanning(promise));
  }

  // TODO: Bacon: Maybe done?
  @ExpoMethod
  public void startScanningAsync(
      final ArrayList<String> serviceUUIDStrings,
      final Map<String, Object> options,
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }

    // TODO: Bacon: guard isScanning

    removeAllCachedPeripherals();
    int timeout = 0;
    if (options.containsKey("timeout")) {
      timeout = (int) options.get("timeout");
    }

    createScanner();
    scanManager.scan(serviceUUIDStrings, timeout, options, promise);

    // TODO: EMIT
  }


  // TODO: Bacon: Done!
  @ExpoMethod
  public void getCentralAsync(
      final Promise promise
  ) {
    if (guardBluetoothAvailability(promise) || guardBluetoothEnabled(promise) || guardPermission(promise)) {
      return;
    }
    BluetoothAdapter adapter = getBluetoothAdapter();
    promise.resolve(Serialize.BluetoothAdapter_NativeToJSON(adapter, isDiscovering));
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void getPeripheralsAsync(
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Map<String, Peripheral> peripheralsCopy = new LinkedHashMap<>(peripherals);
    ArrayList<Peripheral> input = new ArrayList<>(peripheralsCopy.values());
    promise.resolve(Peripheral.listToJSON(input));
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void getBondedPeripheralsAsync(
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    ArrayList bonded = new ArrayList<>();
    Set<BluetoothDevice> bondedDevices = getBluetoothAdapter().getBondedDevices();
    for (BluetoothDevice device : bondedDevices) {
      device.getBondState();
      int type = device.getType();
      if (type == DEVICE_TYPE_LE || type == DEVICE_TYPE_DUAL) {
        Peripheral peripheral = new Peripheral(device, getCurrentActivity());
        bonded.add(peripheral);
      }
    }
    promise.resolve(EXBluetoothObject.listToJSON(bonded));
  }

  // TODO: Bacon: Done!
  @ExpoMethod
  public void getConnectedPeripheralsAsync(List serviceUUIDs, final Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    List<BluetoothDevice> peripherals = getBluetoothManager().getConnectedDevices(BluetoothProfile.GATT);
    promise.resolve(Peripheral.listToJSON(peripheralsFromDevices(peripherals)));
  }

  @ExpoMethod
  public void connectPeripheralAsync(
      final String peripheralUUID,
      final Map<String, Object> options,
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = retrieveOrCreatePeripheral(peripheralUUID);
    if (peripheral == null) {
      promise.reject("ERR_NO_PERIPHERAL", "No valid peripheral with UUID " + peripheralUUID);
      return;
    }
    //TODO: Bacon: update Activity syntax for task manager
    peripheral.connect(promise, getCurrentActivity());
  }

  @ExpoMethod
  public void setNotifyCharacteristicAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Service service = getServiceFromOptionsOrReject(options, promise);
    if (service == null) {
      return;
    }
    boolean shouldNotify = (boolean) options.get("shouldNotify");
    service.getPeripheral().setNotify(service, (String) options.get(BluetoothConstants.JSON.SERVICE_UUID), shouldNotify, promise);
  }

//  @ExpoMethod
//  public void setNotifyDescriptorAsync(
//      final Map<String, Object> options,
//      final Promise promise
//  ) {
//    Descriptor descriptor = getDescriptorFromOptionsOrReject(options, promise);
//    if (descriptor == null) {
//      return;
//    }
//    boolean shouldNotify = (boolean) options.get("shouldNotify");
//    descriptor.setShouldNotifiy(shouldNotify, promise);
//  }

  @ExpoMethod
  public void readRSSIAsync(
      final String peripheralUUID,
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }
    peripheral.readRSSI(promise);
  }

  @ExpoMethod
  public void writeDescriptorAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Descriptor descriptor = getDescriptorFromOptionsOrReject(options, promise);
    if (descriptor == null) {
      return;
    }

    List data = (List) options.get(BluetoothConstants.JSON.DATA);
    byte[] decoded = Serialize.Base64_JSONToNative(data);

    descriptor.getPeripheral().writeDescriptor(decoded, descriptor, promise);
  }

  @ExpoMethod
  public void readDescriptorAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Descriptor descriptor = getDescriptorFromOptionsOrReject(options, promise);
    if (descriptor == null) {
      return;
    }

    descriptor.getPeripheral().readDescriptor(descriptor, promise);
  }

  @ExpoMethod
  public void writeCharacteristicAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Characteristic characteristic = getCharacteristicFromOptionsOrReject(options, promise);
    if (characteristic == null) {
      return;
    }

    List data = (List) options.get(BluetoothConstants.JSON.DATA);
    byte[] decoded = Serialize.Base64_JSONToNative(data);

    characteristic.getPeripheral().writeCharacteristicAsync(decoded,characteristic, promise);
  }

  @ExpoMethod
  public void readCharacteristicAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Characteristic characteristic = getCharacteristicFromOptionsOrReject(options, promise);
    if (characteristic == null) {
      return;
    }

    characteristic.getPeripheral().readCharacteristicAsync(characteristic, promise);
  }


//  @ExpoMethod
//  public void updateCharacteristicAsync(
//      final Map<String, Object> options,
//      final Promise promise
//  ) {
//    if (guardPeripheralAction(promise)) {
//      return;
//    }
//    Peripheral peripheral = _getPeripheralOrReject((String) options.get(BluetoothConstants.JSON.PERIPHERAL_UUID), promise);
//    if (peripheral == null) {
//      return;
//    }
//
//    peripheral.updateCharacteristicAsync(options, promise);
//  }
//
//  @ExpoMethod
//  public void updateDescriptorAsync(
//      final Map<String, Object> options,
//      final Promise promise
//  ) {
//    if (guardPeripheralAction(promise)) {
//      return;
//    }
//    Peripheral peripheral = _getPeripheralOrReject((String) options.get(BluetoothConstants.JSON.PERIPHERAL_UUID), promise);
//    if (peripheral == null) {
//      return;
//    }
//
//    peripheral.updateDescriptorAsync(options, promise);
//  }

  @ExpoMethod
  public void disconnectPeripheralAsync(
      final String peripheralUUID,
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = peripherals.get(peripheralUUID);
    if (peripheral == null) {
      Bundle output = new Bundle();
      output.putString("status", "unavailable");
      promise.resolve(output);
      return;
    }

    peripheral.disconnect(promise);
  }

  private Service getServiceFromOptionsOrReject(Map<String, Object> options, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return null;
    }
    Peripheral peripheral = _getPeripheralOrReject((String) options.get(BluetoothConstants.JSON.PERIPHERAL_UUID), promise);
    if (peripheral == null || peripheral.guardIsConnected(promise)) {
      return null;
    }
    String serviceUUIDString = (String) options.get(BluetoothConstants.JSON.SERVICE_UUID);
    Service service = peripheral.getServiceOrReject(serviceUUIDString, promise);
    return service;
  }

  private Characteristic getCharacteristicFromOptionsOrReject(Map<String, Object> options, Promise promise) {
    Service service = getServiceFromOptionsOrReject(options, promise);
    if (service != null) {
      return null;
    }

    String characteristicUUIDString = (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUID);
    // TODO: Bacon: Restructure
    Characteristic characteristic;
    if (options.containsKey(BluetoothConstants.JSON.CHARACTERISTIC_PROPERTIES)) {
      String characteristicPropertiesString = (String)options.get(BluetoothConstants.JSON.CHARACTERISTIC_PROPERTIES);
      characteristic = service.getPeripheral().getCharacteristicOrReject(service, characteristicUUIDString, Serialize.CharacteristicProperties_JSONToNative(characteristicPropertiesString), promise);
    } else {
      characteristic = service.getPeripheral().getCharacteristicOrReject(service, characteristicUUIDString, promise);
    }
    return characteristic;
  }

  private Descriptor getDescriptorFromOptionsOrReject(Map<String, Object> options, Promise promise) {
    Characteristic characteristic = getCharacteristicFromOptionsOrReject(options, promise);
    if (characteristic  != null) {
      return null;
    }
    String descriptorUUIDString = (String) options.get(BluetoothConstants.JSON.DESCRIPTOR_UUID);

    Descriptor descriptor = characteristic.getPeripheral().getDescriptorOrReject(characteristic, descriptorUUIDString, promise);
    return descriptor;
  }


  @ExpoMethod
  public void discoverDescriptorsForCharacteristicAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {

    Characteristic characteristic = getCharacteristicFromOptionsOrReject(options, promise);
    if (characteristic == null) {
      return;
    }

    characteristic.discoverDescriptors(promise);
  }

  @ExpoMethod
  public void discoverCharacteristicsForServiceAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {

    Service service = getServiceFromOptionsOrReject(options, promise);
    if (service == null) {
      return;
    }

    ArrayList<UUID> characteristicUUIDs = null;
    if (options.containsKey(BluetoothConstants.JSON.CHARACTERISTIC_UUIDS)) {
      ArrayList<String> characteristicUUIDStrings = (ArrayList<String>) options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUIDS);
      characteristicUUIDs = Serialize.UUIDList_JSONToNative(characteristicUUIDStrings);
    }

    service.discoverCharacteristics(characteristicUUIDs, promise);
  }

  @ExpoMethod
  public void discoverIncludedServicesForServiceAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Service service = getServiceFromOptionsOrReject(options, promise);
    if (service == null) {
      return;
    }


    ArrayList<UUID> includedServicesUUIDs = null;
    if (options.containsKey(BluetoothConstants.JSON.INCLUDED_SERVICES_UUIDS)) {
      ArrayList<String> includedServicesUUIDStrings = (ArrayList<String>) options.get(BluetoothConstants.JSON.INCLUDED_SERVICES_UUIDS);
      includedServicesUUIDs = Serialize.UUIDList_JSONToNative(includedServicesUUIDStrings);
    }

    // TODO: Bacon: Add serviceUUIDs
    service.discoverIncludedServices(includedServicesUUIDs, promise);
  }

  @ExpoMethod
  public void discoverServicesForPeripheralAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = _getPeripheralOrReject((String) options.get(BluetoothConstants.JSON.PERIPHERAL_UUID), promise);
    if (peripheral == null) {
      return;
    }
    peripheral.retrieveServices(promise);
  }

//  @ExpoMethod
//  public void discoverAsync(
//      final Map<String, Object> options,
//      final Promise promise
//  ) {
//    if (guardPeripheralAction(promise)) {
//      return;
//    }
//    String peripheralUUID = (String) options.get(BluetoothConstants.JSON.PERIPHERAL_UUID);
//    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
//    if (peripheral == null) {
//      return;
//    }
//
//    if (!options.containsKey(BluetoothConstants.JSON.SERVICE_UUID)) {
//      peripheral.retrieveServices(promise);
//      return;
//    }
//
//    String serviceUUIDString = (String) options.get(BluetoothConstants.JSON.SERVICE_UUID);
//    Service service = peripheral.getServiceOrReject(serviceUUIDString, promise);
//    if (service == null) {
//      return;
//    }
//
//    if (!options.containsKey(BluetoothConstants.JSON.CHARACTERISTIC_UUID)) {
//      promise.resolve(null);
//
//      //TODO: Bacon: Are these gotten automatically?
//      Bundle output = new Bundle();
//      Bundle peripheralData = peripheral.toJSON();
//      output.putBundle(BluetoothConstants.JSON.PERIPHERAL, peripheralData);
//      output.putBundle(BluetoothConstants.JSON.SERVICE, service.toJSON());
//      output.putString(BluetoothConstants.JSON.TRANSACTION_ID, service.transactionIdForOperation(BluetoothConstants.OPERATIONS.SCAN));
//      BluetoothModule.sendEvent(BluetoothConstants.EVENTS.PERIPHERAL_DID_DISCOVER_SERVICES, output);
//      return;
//    }
//
//    String characteristicUUIDString = (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUID);
//    Characteristic characteristic = peripheral.getCharacteristicOrReject(service, characteristicUUIDString, promise);
//    if (characteristic == null) {
//      return;
//    }
//
//    if (!options.containsKey(BluetoothConstants.JSON.DESCRIPTOR_UUID)) {
//      promise.resolve(null);
//
//      Bundle output = new Bundle();
//      output.putString(BluetoothConstants.JSON.TRANSACTION_ID, characteristic.transactionIdForOperation(BluetoothConstants.OPERATIONS.SCAN));
//      output.putBundle(BluetoothConstants.JSON.PERIPHERAL, peripheral.toJSON());
//      output.putBundle(BluetoothConstants.JSON.SERVICE, service.toJSON());
//      BluetoothModule.sendEvent(BluetoothConstants.EVENTS.PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE, output);
//      return;
//    }
//
//    String descriptorUUIDString = (String) options.get(BluetoothConstants.JSON.DESCRIPTOR_UUID);
//    Descriptor descriptor = peripheral.getDescriptorOrReject(characteristic, descriptorUUIDString, promise);
//    if (descriptor == null) {
//      return;
//    }
//    promise.resolve(null);
//
//
//    Bundle output = new Bundle();
//    output.putString(BluetoothConstants.JSON.TRANSACTION_ID, descriptor.transactionIdForOperation(BluetoothConstants.OPERATIONS.SCAN));
//    output.putBundle(BluetoothConstants.JSON.PERIPHERAL, peripheral.toJSON());
//    output.putBundle(BluetoothConstants.JSON.CHARACTERISTIC, characteristic.toJSON());
//    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC, output);
//  }

  private List<Peripheral> peripheralsFromDevices(List<BluetoothDevice> devices) {
    ArrayList bonded = new ArrayList<>();
    for (BluetoothDevice device : devices) {
      Peripheral p = new Peripheral(device, getCurrentActivity());
      bonded.add(p);
    }
    return bonded;
  }


  private void removeAllCachedPeripherals() {
    synchronized (peripherals) {
      for (Iterator<Map.Entry<String, Peripheral>> iterator = peripherals.entrySet().iterator(); iterator.hasNext(); ) {
        Map.Entry<String, Peripheral> entry = iterator.next();
        entry.getValue().tearDown();
        if (!entry.getValue().isConnected()) {
          iterator.remove();
        }
      }
    }
  }

  // TODO: Bacon: is this needed?
  private boolean guardBluetoothScanning(Promise promise) {
    if (scanManager == null) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Bluetooth scanning is not ready yet: Maybe you forgot to call initializeManagerAsync()");
      return true;
    }
    return false;
  }

  private boolean isBluetoothAvailable() {
      try {
          if (getBluetoothAdapter() == null || getBluetoothAdapter().getAddress().equals(null))
              return false;
      } catch (NullPointerException e) {
            return false;
      }
      return true;
  }

  private boolean guardBluetoothAvailability(Promise promise) {
    if (!isBluetoothAvailable()) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Bluetooth is not supported on this device");
      return true;
    }
    return false;
  }

  private boolean guardBluetoothEnabled(Promise promise) {
    if (guardBluetoothAvailability(promise)) {
      return true;
    }
    if (!getBluetoothAdapter().isEnabled()) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "Bluetooth is not enabled");
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

  private Peripheral retrieveOrCreatePeripheral(String peripheralUUID) {
    Peripheral peripheral = peripherals.get(peripheralUUID);
    if (peripheral == null) {
      synchronized (peripherals) {
        if (peripheralUUID != null) {
          peripheralUUID = peripheralUUID.toUpperCase();
        }
        if (BluetoothAdapter.checkBluetoothAddress(peripheralUUID)) {
          BluetoothDevice device = getBluetoothAdapter().getRemoteDevice(peripheralUUID);
          peripheral = new Peripheral(device, getCurrentActivity());
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
        Peripheral peripheral = new Peripheral(device, getCurrentActivity());
        peripherals.put(device.getAddress(), peripheral);
      }
    }
    return peripherals.get(address);
  }

  Peripheral savePeripheral(BluetoothDevice device, int RSSI, byte[] scanRecord) {
    String address = device.getAddress();
    synchronized (peripherals) {
      if (!peripherals.containsKey(address)) {
        Peripheral peripheral = new Peripheral(device, RSSI, scanRecord);
        peripherals.put(device.getAddress(), peripheral);
      } else {
        Peripheral peripheral = peripherals.get(address);
        peripheral.updateRSSI(RSSI);
        peripheral.updateData(scanRecord);
      }
    }
    return peripherals.get(address);
  }

  Peripheral savePeripheral(BluetoothDevice device, int RSSI, ScanRecord scanRecord) {
    String address = device.getAddress();
    synchronized (peripherals) {
      if (!peripherals.containsKey(address)) {
        Peripheral peripheral = new Peripheral(device, RSSI, scanRecord);
        peripherals.put(device.getAddress(), peripheral);
        emitState();
      } else {
        Peripheral peripheral = peripherals.get(address);
        peripheral.updateRSSI(RSSI);
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
        output.putBundle(BluetoothConstants.JSON.CENTRAL, Serialize.BluetoothAdapter_NativeToJSON(adapter, isDiscovering));
      } else {
        output.putBundle(BluetoothConstants.JSON.ERROR, buildError("User denied enable request"));
      }
      BluetoothModule.sendEvent(BluetoothConstants.EVENTS.ENABLE_BLUETOOTH, output);
    }
  }

  private Bundle buildError(String message) {
    Bundle error = new Bundle();
    error.putString(BluetoothConstants.JSON.MESSAGE, message);
    return error;
  }

  @Override
  public void onNewIntent(Intent intent) {

  }

}
