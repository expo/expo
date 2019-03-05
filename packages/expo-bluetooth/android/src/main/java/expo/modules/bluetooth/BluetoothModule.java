package expo.modules.bluetooth;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.ScanRecord;
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
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
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
  private static ModuleRegistry mModuleRegistry;
  private static BluetoothManager bluetoothManager;
  private static Map<String, Peripheral> peripherals = new LinkedHashMap<>();
  private static Map<String, BluetoothGatt> connectedDevices = new LinkedHashMap<>();
  private static BluetoothScanManager mScanManager;
  private BondingPromise createBond;
  private BondingPromise removeBond;
  private BroadcastReceiver mReceiver;
  private BroadcastReceiver mBondingReceiver;
  private Permissions mPermissions;

  public BluetoothModule(Context context) {
    super(context);
  }

  private static BluetoothManager getManager() {
    return bluetoothManager;
  }

  public static BluetoothDevice getDeviceFromAddress(String peripheralUUID) {

    /** Native method seems to jump around and not be as accurate as simply caching data. */
    if (getManager() == null || getManager().getAdapter() == null) {
      return null;
    }

    return getManager().getAdapter().getRemoteDevice(peripheralUUID);
  }

  public static boolean isDeviceConnected(String peripheralUUID) {

    /** Native method seems to jump around and not be as accurate as simply caching data. */
    if (bluetoothManager == null) {
      return isDeviceInLocalCache(peripheralUUID);
    }
    BluetoothDevice device = bluetoothManager.getAdapter().getRemoteDevice(peripheralUUID);
    if (device == null) {
      return false;
    }
    return bluetoothManager.getConnectedDevices(BluetoothProfile.GATT).contains(device);
  }

  private static boolean isDeviceInLocalCache(String peripheralUUID) {
    synchronized (connectedDevices) {
      return connectedDevices.containsKey(peripheralUUID);
    }
  }

    public static void sendEvent(final String eventName, Bundle data) {
    if (mModuleRegistry != null) {
      EventEmitter eventEmitter = mModuleRegistry.getModule(EventEmitter.class);
      if (eventEmitter != null) {
        Bundle message = new Bundle();
        message.putString(BluetoothConstants.JSON.EVENT, eventName);
//        message.putString(BluetoothConstants.JSON.DEVICE_TYPE, eventName);
        message.putBundle(BluetoothConstants.JSON.DATA, data);
        eventEmitter.emit(BluetoothConstants.JSON.BLUETOOTH_EVENT, message);
        return;
      }
    }
    String errorMessage = "Could not emit " + eventName + " event, no event emitter or module registry present.";
    Log.e(TAG, errorMessage);
  }

  public static Activity getActivity() {
    if (mModuleRegistry != null) {
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      return activityProvider.getCurrentActivity();
    }
    return null;
  }

  public static void emitState() {
    if (peripherals != null) {
      synchronized (peripherals) {
        Map<String, Peripheral> peripheralsCopy = new LinkedHashMap<>(peripherals);
        ArrayList<Peripheral> input = new ArrayList<>(peripheralsCopy.values());
        Bundle output = new Bundle();
        output.putParcelableArrayList(BluetoothConstants.JSON.PERIPHERALS, Peripheral.listToJSON(input));
        sendEvent("UPDATE", output);
      }
    }
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    if (mReceiver != null) {
      getApplicationContext().unregisterReceiver(mReceiver);
      mReceiver = null;
    }

    if (mBondingReceiver != null) {
      getApplicationContext().unregisterReceiver(mBondingReceiver);
      mBondingReceiver = null;
    }

    removeAllCachedPeripherals();
    bluetoothManager = null;

    mModuleRegistry = moduleRegistry;
    mPermissions = moduleRegistry.getModule(Permissions.class);

    /**
     * Stop scanning and deallocate the instance.
     * This will reset any cached info.
     *
     * Call this after the module registry has been set to ensure that the DID_STOP event is sent.
     */
    if (mScanManager != null) {
      mScanManager.stopScan();
      mScanManager = null;
    }

    if (moduleRegistry != null) {
      // Register to new UIManager
      if (moduleRegistry.getModule(UIManager.class) != null) {
        moduleRegistry.getModule(UIManager.class).registerActivityEventListener(this);
      }
      createBluetoothInstance();
      createBondingReceiver();
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

    events.put("SYSTEM_ENABLED_STATE_CHANGED", BluetoothConstants.EVENTS.SYSTEM_ENABLED_STATE_CHANGED);
//    events.put("CENTRAL_SCAN_STARTED", BluetoothConstants.EVENTS.CENTRAL_SCAN_STARTED);
//    events.put("CENTRAL_SCAN_STOPPED", BluetoothConstants.EVENTS.CENTRAL_SCAN_STOPPED);
    events.put("CENTRAL_STATE_CHANGED", BluetoothConstants.EVENTS.CENTRAL_STATE_CHANGED);
    events.put("CENTRAL_DISCOVERED_PERIPHERAL", BluetoothConstants.EVENTS.CENTRAL_DISCOVERED_PERIPHERAL);
    events.put("PERIPHERAL_DISCOVERED_SERVICES", BluetoothConstants.EVENTS.PERIPHERAL_DISCOVERED_SERVICES);
    events.put("PERIPHERAL_CONNECTED", BluetoothConstants.EVENTS.PERIPHERAL_CONNECTED);
    events.put("PERIPHERAL_DISCONNECTED", BluetoothConstants.EVENTS.PERIPHERAL_DISCONNECTED);
    events.put("PERIPHERAL_BONDED", BluetoothConstants.EVENTS.PERIPHERAL_BONDED);
    events.put("PERIPHERAL_UNBONDED", BluetoothConstants.EVENTS.PERIPHERAL_UNBONDED);
    events.put("PERIPHERAL_UPDATED_RSSI", BluetoothConstants.EVENTS.PERIPHERAL_UPDATED_RSSI);
    events.put("PERIPHERAL_UPDATED_MTU", BluetoothConstants.EVENTS.PERIPHERAL_UPDATED_MTU);
    events.put("SERVICE_DISCOVERED_INCLUDED_SERVICES", BluetoothConstants.EVENTS.SERVICE_DISCOVERED_INCLUDED_SERVICES);
    events.put("SERVICE_DISCOVERED_CHARACTERISTICS", BluetoothConstants.EVENTS.SERVICE_DISCOVERED_CHARACTERISTICS);
    events.put("CHARACTERISTIC_DISCOVERED_DESCRIPTORS", BluetoothConstants.EVENTS.CHARACTERISTIC_DISCOVERED_DESCRIPTORS);
    events.put("CHARACTERISTIC_DID_WRITE", BluetoothConstants.EVENTS.CHARACTERISTIC_DID_WRITE);
    events.put("CHARACTERISTIC_DID_READ", BluetoothConstants.EVENTS.CHARACTERISTIC_DID_READ);
    events.put("CHARACTERISTIC_DID_NOTIFY", BluetoothConstants.EVENTS.CHARACTERISTIC_DID_NOTIFY);
    events.put("DESCRIPTOR_DID_WRITE", BluetoothConstants.EVENTS.DESCRIPTOR_DID_WRITE);
    events.put("DESCRIPTOR_DID_READ", BluetoothConstants.EVENTS.DESCRIPTOR_DID_READ);
    constants.put("EVENTS", events);


    final Map<String, Object> priority = new HashMap<>();
    priority.put("High", BluetoothConstants.PRIORITY.HIGH);
    priority.put("LowPower", BluetoothConstants.PRIORITY.LOW_POWER);
    priority.put("Balanced", BluetoothConstants.PRIORITY.BALANCED);

    constants.put("PRIORITY", priority);

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


  private boolean isScanning() {
    if (mScanManager != null) {
      return mScanManager.isScanning();
    }
    return false;
  }

  private void stopScanning() {
    if (mScanManager != null) {
      mScanManager.stopScan();
      mScanManager = null;
    }
  }

  private Bundle centralAsJSON() {
    return Serialize.BluetoothAdapter_NativeToJSON(getBluetoothAdapter(), isScanning());
  }

  private void onBluetoothAdapterStateChange(int state) {
    if (state == BluetoothAdapter.STATE_OFF) {
      removeAllCachedPeripherals();
      stopScanning();
    }

    Bundle output = new Bundle();
    output.putBundle(BluetoothConstants.JSON.CENTRAL, centralAsJSON());
    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.SYSTEM_ENABLED_STATE_CHANGED, output);
  }

  private void createBondingReceiver() {
    mBondingReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        final String action = intent.getAction();

        if (!action.equals(BluetoothDevice.ACTION_BOND_STATE_CHANGED)) {
          return;
        }

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
              BluetoothError.reject(createBond.promise, BluetoothError.BONDING_DENIED());
              createBond = null;
              /// TODO: Bacon: Should we return?
              break;
            default:
              break;
          }
        }
        if (removeBond != null && removeBond.uuid.equals(device.getAddress()) && bondState == BluetoothDevice.BOND_NONE && prevState == BluetoothDevice.BOND_BONDED) {
          removeBond.promise.resolve(null);
          removeBond = null;
        }
      }
    };

    getContext().registerReceiver(mBondingReceiver, new IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED));
  }

  private void createBluetoothInstance() {
    mReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
          final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
          onBluetoothAdapterStateChange(state);
        }
      }
    };

    getContext().registerReceiver(mReceiver, new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED));
  }

  @ExpoMethod
  public void requestConnectionPriorityAsync(String peripheralUUID, String connectionPriority, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }
    int connection = Serialize.Priority_JSONToNative(connectionPriority);
    peripheral.requestConnectionPriority(connection, promise);
  }

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

  @ExpoMethod
  public void bondAsync(String peripheralUUID, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }

    // Bacon: Check if the device is already bonded before starting a new task.
    int bondState = peripheral.getBondState();

    if (bondState == BluetoothDevice.BOND_BONDED) {
      String bondStateString = Serialize.Bonding_NativeToJSON(bondState);
      promise.resolve(bondStateString);
      return;
    }

    if (createBond != null) {
      BluetoothError.reject(promise, BluetoothError.CONCURRENT_BONDING(createBond.uuid, peripheralUUID));
      return;
    }

    createBond = new BondingPromise(peripheralUUID, promise);
    if (!peripheral.getDevice().createBond()) {
      createBond = null;
      BluetoothError.reject(promise, BluetoothError.BONDING_FAILED(peripheralUUID));
      return;
    }
  }

  @ExpoMethod
  private void unbondAsync(String peripheralUUID, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }

    // Bacon: Check if the device is already unbonded before starting a new task.
    int bondState = peripheral.getBondState();

    if (bondState == BluetoothDevice.BOND_NONE) {
      String bondStateString = Serialize.Bonding_NativeToJSON(bondState);
      promise.resolve(bondStateString);
      return;
    } else if (removeBond != null) {
      promise.reject(BluetoothConstants.ERRORS.GENERAL, "You are already attempting to remove the bond: " + removeBond.uuid);
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
      removeBond = null;
    }
  }

  @ExpoMethod
  public void enableBluetoothAsync(
      Boolean shouldEnable,
      final Promise promise
  ) {
    if (guardBluetoothAvailability(promise)) {
      return;
    }
    // TODO: Bacon: Should we do nothing if shouldEnable === getBluetoothAdapter().isEnabled()

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
      output.putBundle(BluetoothConstants.JSON.CENTRAL, centralAsJSON());
      BluetoothModule.sendEvent(BluetoothConstants.EVENTS.SYSTEM_ENABLED_STATE_CHANGED, output);
    }
    promise.resolve(getBluetoothAdapter().isEnabled());
  }

  @ExpoMethod
  public void stopScanningAsync(
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    stopScanning();

    promise.resolve(null);
  }

  private boolean isMissingPermissions() {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && (mPermissions == null || mPermissions.getPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED);
  }

  private boolean guardPermission(Promise promise) {
    if (isMissingPermissions()) {
      BluetoothError.reject(promise, BluetoothError.LOCATION_PERMISSION());
      return true;
    }
    return false;
  }

  private boolean guardPeripheralAction(Promise promise) {
    return (guardPermission(promise) || guardBluetoothEnabled(promise));
  }

  @ExpoMethod
  public void startScanningAsync(
      final ArrayList<String> serviceUUIDStrings,
      final Map<String, Object> options,
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }

    // TODO: Bacon: This is redundant but maybe more efficient.
    if (isScanning()) {
      BluetoothError.reject(promise, BluetoothError.SCAN_REDUNDANT_INIT());
      return;
    }

//    removeAllCachedPeripherals();

    /** Create a new scanner. */
    mScanManager = new BluetoothScanManager(new PeripheralScanningDelegate() {

      @Override
      public void onStartScanning() {
        /** It seems that scanning starts in sync */
        Bundle map = new Bundle();
        map.putBundle(BluetoothConstants.JSON.CENTRAL, centralAsJSON());
        emitState();
        sendEvent(BluetoothConstants.EVENTS.CENTRAL_STATE_CHANGED, map);
      }

      @Override
      public void onPeripheralFound(BluetoothDevice device, int RSSI, ScanRecord scanRecord) {
        boolean peripheralExists = peripheralExists(device.getAddress());

        Peripheral peripheral = savePeripheral(device, RSSI, scanRecord);

        if (peripheralExists) {
          Bundle output = new Bundle();
          output.putInt(BluetoothConstants.JSON.RSSI, RSSI);
          output.putBundle(BluetoothConstants.JSON.ADVERTISEMENT_DATA, peripheral.advertisementData());
          output.putBundle(BluetoothConstants.JSON.PERIPHERAL, peripheral.toJSON());
          Bundle central = Serialize.BluetoothAdapter_NativeToJSON(getBluetoothAdapter(), true);
          output.putBundle(BluetoothConstants.JSON.CENTRAL, central);
          sendEvent(BluetoothConstants.EVENTS.CENTRAL_DISCOVERED_PERIPHERAL, output);
        } else {
          emitState();
        }
      }

      @Override
      public void onStopScanningWithError(BluetoothError error) {
        Bundle map = new Bundle();
        if (error != null) {
          map.putBundle(BluetoothConstants.JSON.ERROR, error.toJSON());
        }
        map.putBundle(BluetoothConstants.JSON.CENTRAL, centralAsJSON());
        emitState(); // TODO: Bacon
        sendEvent(BluetoothConstants.EVENTS.CENTRAL_STATE_CHANGED, map);
      }
    }, getBluetoothAdapter());

    mScanManager.startScan(serviceUUIDStrings, options);

    promise.resolve(null);
  }

  @ExpoMethod
  public void getCentralAsync(
      final Promise promise
  ) {
    if (guardBluetoothEnabled(promise) || guardPermission(promise)) {
      return;
    }
    promise.resolve(centralAsJSON());
  }

  @ExpoMethod
  public void getPeripheralAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Peripheral peripheral = getPeripheralFromOptionsOrReject(options, promise);
    if (peripheral == null) {
      return;
    }
    promise.resolve(peripheral.toJSON());
  }

  @ExpoMethod
  public void getServiceAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Service service = getServiceFromOptionsOrReject(options, promise);
    if (service == null) {
      return;
    }
    promise.resolve(service.toJSON());
  }

  @ExpoMethod
  public void getCharacteristicAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Characteristic characteristic = getCharacteristicFromOptionsOrReject(options, promise);
    if (characteristic == null) {
      return;
    }
    promise.resolve(characteristic.toJSON());
  }

  @ExpoMethod
  public void getDescriptorAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {
    Descriptor descriptor = getDescriptorFromOptionsOrReject(options, promise);
    if (descriptor == null) {
      return;
    }
    promise.resolve(descriptor.toJSON());
  }

  @ExpoMethod
  public void getPeripheralsAsync(
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }
    synchronized (peripherals) {
      Map<String, Peripheral> peripheralsCopy = new LinkedHashMap<>(peripherals);
      ArrayList<Peripheral> input = new ArrayList<>(peripheralsCopy.values());
      promise.resolve(Peripheral.listToJSON(input));
    }
  }

  private boolean peripheralExists(String uuid) {
    synchronized (peripherals) {
      return peripherals.containsKey(uuid);
    }
  }

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
        bonded.add(peripheralFromDevice(device));
      }
    }
    promise.resolve(EXBluetoothObject.listToJSON(bonded));
  }

  @ExpoMethod
  public void getConnectedPeripheralsAsync(List serviceUUIDs, final Promise promise) {
    if (guardPeripheralAction(promise)) {
      return;
    }
//    promise.resolve(Peripheral.listToJSON(peripheralsFromGATTs(getConnectedGATTs())));

    /** Bluetooth native might be more accurate but it doesn't seem to sync as expected when devices disconnect */
    List<BluetoothDevice> peripherals = getBluetoothManager().getConnectedDevices(BluetoothProfile.GATT);
    promise.resolve(Peripheral.listToJSON(peripheralsFromDevices(peripherals)));
  }

  private synchronized List<BluetoothGatt> getConnectedGATTs() {
  //    List<BluetoothDevice> peripherals = getBluetoothManager().getConnectedDevices(BluetoothProfile.GATT);
    return new ArrayList<>(BluetoothModule.connectedDevices.values());
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
    Peripheral peripheral = _getPeripheralOrReject(peripheralUUID, promise);
    if (peripheral == null) {
      return;
    }

    boolean shouldAutoConnect = false;

    if (options.containsKey("shouldAutoConnect")) {
      shouldAutoConnect = (boolean) options.get("shouldAutoConnect");
    }
    peripheral.connect(promise, shouldAutoConnect, getCurrentActivity());
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
    service.getPeripheral().setNotify(service, (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUID), shouldNotify, promise);
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
    peripheral.readRSSIAsync(promise);
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

    String dataString = (String) options.get(BluetoothConstants.JSON.DATA);
    byte[] data = dataString.getBytes(StandardCharsets.UTF_8);
    descriptor.getPeripheral().writeDescriptor(data, descriptor, promise);
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

    String dataString = (String) options.get(BluetoothConstants.JSON.DATA);
    byte[] data = dataString.getBytes(StandardCharsets.UTF_8);
    characteristic.getPeripheral().writeCharacteristicAsync(data, characteristic, promise);
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

  @ExpoMethod
  public void disconnectPeripheralAsync(
      final String peripheralUUID,
      final Promise promise
  ) {
    if (guardPeripheralAction(promise)) {
      return;
    }

    Peripheral peripheral = ensurePeripheral(peripheralUUID);

    if (peripheral == null) {
      Bundle output = new Bundle();
      output.putString("status", "unavailable");
      promise.resolve(output);
      return;
    }
    /** Don't guard connection because we can cancel a pending connection attempt this way.*/
    peripheral.disconnect(promise);
  }

  private Peripheral getPeripheralFromOptionsOrReject(Map<String, Object> options, Promise promise) {
    if (guardPeripheralAction(promise)) {
      return null;
    }
    Peripheral peripheral = _getPeripheralOrReject((String) options.get(BluetoothConstants.JSON.PERIPHERAL_UUID), promise);
    if (peripheral == null) {
      return null;
    }
    return peripheral;
  }

  private Service getServiceFromOptionsOrReject(Map<String, Object> options, Promise promise) {
    Peripheral peripheral = getPeripheralFromOptionsOrReject(options, promise);
    if (peripheral == null || peripheral.guardIsConnected(promise)) {
      return null;
    }
    String serviceUUIDString = (String) options.get(BluetoothConstants.JSON.SERVICE_UUID);
    Service service = peripheral.getServiceOrReject(serviceUUIDString, promise);
    return service;
  }

  private Characteristic getCharacteristicFromOptionsOrReject(Map<String, Object> options, Promise promise) {
    Service service = getServiceFromOptionsOrReject(options, promise);
    if (service == null) {
      return null;
    }

    String characteristicUUIDString = (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUID);
    // TODO: Bacon: Restructure
    Characteristic characteristic;
    if (options.containsKey(BluetoothConstants.JSON.CHARACTERISTIC_PROPERTIES)) {
      String characteristicPropertiesString = (String) options.get(BluetoothConstants.JSON.CHARACTERISTIC_PROPERTIES);
      characteristic = service.getPeripheral().getCharacteristicOrReject(service, characteristicUUIDString, Serialize.CharacteristicProperties_JSONToNative(characteristicPropertiesString), promise);
    } else {
      characteristic = service.getPeripheral().getCharacteristicOrReject(service, characteristicUUIDString, promise);
    }
    return characteristic;
  }

  private Descriptor getDescriptorFromOptionsOrReject(Map<String, Object> options, Promise promise) {
    Characteristic characteristic = getCharacteristicFromOptionsOrReject(options, promise);
    if (characteristic == null) {
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
      Log.d(TAG, "discoverDescriptorsForCharacteristicAsync: Failed to get characteristic " + options.get(BluetoothConstants.JSON.CHARACTERISTIC_UUID));
      return;
    }

    Bundle output = characteristic.discoverDescriptors(promise);
    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.CHARACTERISTIC_DISCOVERED_DESCRIPTORS, output);
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

    Bundle output = service.discoverCharacteristics(characteristicUUIDs, promise);
    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.SERVICE_DISCOVERED_CHARACTERISTICS, output);
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
    Bundle output = service.discoverIncludedServices(includedServicesUUIDs, promise);
    BluetoothModule.sendEvent(BluetoothConstants.EVENTS.SERVICE_DISCOVERED_INCLUDED_SERVICES, output);
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
    peripheral.discoverServicesForPeripheralAsync(promise);
  }

  private List<Peripheral> peripheralsFromDevices(List<BluetoothDevice> devices) {
    ArrayList peripherals = new ArrayList<>();
    for (BluetoothDevice device : devices) {
      peripherals.add(peripheralFromDevice(device));
    }
    return peripherals;
  }

  private static Peripheral peripheralFromDevice(BluetoothDevice device) {
    synchronized (peripherals) {
      if (peripherals.containsKey(device.getAddress())) {
        return peripherals.get(device.getAddress());
      } else {
        return new Peripheral(device.getAddress());
      }
    }
  }

  private List<Peripheral> peripheralsFromGATTs(List<BluetoothGatt> gatts) {
    ArrayList peripherals = new ArrayList<>();
    for (BluetoothGatt gatt : gatts) {
      BluetoothDevice device = gatt.getDevice();
      peripherals.add(peripheralFromDevice(device));
    }
    return peripherals;
  }

  private void removeAllCachedPeripherals() {
    synchronized (peripherals) {
      for (Iterator<Map.Entry<String, Peripheral>> iterator = peripherals.entrySet().iterator(); iterator.hasNext(); ) {
        Map.Entry<String, Peripheral> entry = iterator.next();
        entry.getValue().disconnect();
        iterator.remove();
      }
    }
  }

  private boolean isBluetoothAvailable() {
    try {
      if (getBluetoothAdapter() == null || getBluetoothAdapter().getAddress().equals(null)) {
        return false;
      }
    } catch (NullPointerException e) {
      return false;
    }
    return true;
  }

  private boolean guardBluetoothAvailability(Promise promise) {
    if (!isBluetoothAvailable()) {
      BluetoothError.reject(promise, BluetoothError.BLUETOOTH_UNAVAILABLE());
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
    Peripheral peripheral = ensurePeripheral(peripheralUUID);
    if (peripheral == null) {
      promise.reject("ERR_NO_PERIPHERAL", "No valid peripheral with UUID " + peripheralUUID);
      return null;
    }
    return peripheral;
  }

  private Peripheral ensurePeripheral(String peripheralUUID) {
    Peripheral peripheral = peripherals.get(peripheralUUID);
    if (peripheral == null) {
      synchronized (peripherals) {
        if (peripheralUUID != null) {
          peripheralUUID = peripheralUUID.toUpperCase();
        }
        if (BluetoothAdapter.checkBluetoothAddress(peripheralUUID)) {
          BluetoothDevice device = getBluetoothAdapter().getRemoteDevice(peripheralUUID);
          if (device != null) {
            peripheral = peripheralFromDevice(device);
            peripherals.put(peripheralUUID, peripheral);
          }
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

  private Peripheral savePeripheral(BluetoothDevice device, int RSSI, ScanRecord scanRecord) {
    String address = device.getAddress();
    synchronized (peripherals) {
      if (!peripherals.containsKey(address)) {
        Peripheral peripheral = new Peripheral(device.getAddress(), RSSI, scanRecord);
        peripherals.put(peripheral.getID(), peripheral);
        emitState();
      } else {
        Peripheral peripheral = peripherals.get(address);
        //TODO: Bacon: Sync new device data maybe
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
      output.putBundle(BluetoothConstants.JSON.CENTRAL, centralAsJSON());
      if (resultCode != RESULT_OK) {
        output.putBundle(BluetoothConstants.JSON.ERROR, BluetoothError.ENABLE_REQUEST_DENIED().toJSON());
      }
      BluetoothModule.sendEvent(BluetoothConstants.EVENTS.SYSTEM_ENABLED_STATE_CHANGED, output);
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    // noop
  }

  static public final BluetoothGattCallback bluetoothGattCallback = new BluetoothGattCallback() {
    @Override
    public void onPhyUpdate(BluetoothGatt gatt, int txPhy, int rxPhy, int status) {
      super.onPhyUpdate(gatt, txPhy, rxPhy, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onPhyUpdate(txPhy, rxPhy, status);
      }
    }

    @Override
    public void onPhyRead(BluetoothGatt gatt, int txPhy, int rxPhy, int status) {
      super.onPhyRead(gatt, txPhy, rxPhy, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onPhyRead(txPhy, rxPhy, status);
      }
    }

    @Override
    public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
      super.onConnectionStateChange(gatt, status, newState);

      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        synchronized (connectedDevices) {
          /** Update the connected cache locally */
          if (newState == BluetoothProfile.STATE_CONNECTED) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
              peripheral.setGatt(gatt);
              Log.d(TAG, "Add connected GATT to the cache: " + gatt.getDevice().getAddress());
              BluetoothModule.connectedDevices.put(gatt.getDevice().getAddress(), gatt);
            }
          } else {
            peripheral.setGatt(null);
            Log.d(TAG, "Remove connected GATT from the cache: " + gatt.getDevice().getAddress() + " Status: " + status);
            BluetoothModule.connectedDevices.remove(gatt.getDevice().getAddress());
          }

          peripheral.onConnectionStateChange(status, newState);
        }
      } else {
        Log.d(TAG, "No peripheral for connection op: " + gatt.getDevice().getAddress() + " Status: " + status + " State: " + newState);
      }
    }

    @Override
    public void onServicesDiscovered(BluetoothGatt gatt, int status) {
      super.onServicesDiscovered(gatt, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onServicesDiscovered(status);
      }
    }

    @Override
    public void onCharacteristicRead(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
      super.onCharacteristicRead(gatt, characteristic, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onCharacteristicRead(characteristic, status);
      }
    }

    @Override
    public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
      super.onCharacteristicWrite(gatt, characteristic, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onCharacteristicWrite(characteristic, status);
      }
    }

    /** Enable or disable notifications/indications for a given characteristic. */
    @Override
    public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
      super.onCharacteristicChanged(gatt, characteristic);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onCharacteristicChanged(characteristic);
      }
    }

    @Override
    public void onDescriptorRead(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
      super.onDescriptorRead(gatt, descriptor, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onDescriptorRead(descriptor, status);
      }
    }

    @Override
    public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
      super.onDescriptorWrite(gatt, descriptor, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onDescriptorWrite(descriptor, status);
      }
    }

    @Override
    public void onReliableWriteCompleted(BluetoothGatt gatt, int status) {
      super.onReliableWriteCompleted(gatt, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onReliableWriteCompleted(status);
      }
    }

    @Override
    public void onReadRemoteRssi(BluetoothGatt gatt, int rssi, int status) {
      super.onReadRemoteRssi(gatt, rssi, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onReadRemoteRssi(rssi, status);
      }
    }

    @Override
    public void onMtuChanged(BluetoothGatt gatt, int mtu, int status) {
      super.onMtuChanged(gatt, mtu, status);
      Peripheral peripheral = peripheralFromDevice(gatt.getDevice());
      if (peripheral != null) {
        peripheral.setGatt(gatt); /** This may not do anything. */
        peripheral.onMtuChanged(mtu, status);
      }
    }
  };
}
