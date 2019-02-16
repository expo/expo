package expo.modules.bluetooth;

import android.bluetooth.BluetoothGatt;
import android.bluetooth.le.ScanCallback;
import android.os.Bundle;

import expo.core.Promise;
import expo.core.interfaces.CodedThrowable;

public class BluetoothError {

  private static String PREFIX = "ERR_BLE_";

  public String code;
  public String domain;
  public String message;
  public String reason;
  public String suggestion;
  public String underlayingError;

  public BluetoothError(String code, String message) {
    this.code = code;
    this.message = message;
  }

  public static BluetoothError fromScanCallbackErrorCode(int scanCallbackErrorCode) {
    switch (scanCallbackErrorCode) {
      case 0: /** NO_ERROR */
        return null;
      case ScanCallback.SCAN_FAILED_ALREADY_STARTED:
        return SCAN_REDUNDANT_INIT();
      case ScanCallback.SCAN_FAILED_APPLICATION_REGISTRATION_FAILED:
        return APP_REGISTRATION();
      case ScanCallback.SCAN_FAILED_INTERNAL_ERROR:
        return SCAN_INTERNAL();
      case ScanCallback.SCAN_FAILED_FEATURE_UNSUPPORTED:
        return BLE_UNSUPPORTED();
      case 5: /** SCAN_FAILED_OUT_OF_HARDWARE_RESOURCES */
        return OUT_OF_HARDWARE_RESOURCES();
      default:
        return UNKOWN_SCANNING_ERROR();
    }
  }

  public static Bundle fromScanCallbackErrorCodeAsJSON(int scanCallbackErrorCode) {
    BluetoothError error = fromScanCallbackErrorCode(scanCallbackErrorCode);
    if (error != null) {
      return error.toJSON();
    }
    return null;
  }

  public static BluetoothError fromGattStatusCode(int gattStatusCode) {
    if (gattStatusCode == BluetoothGatt.GATT_SUCCESS) {
      return null;
    }
    return new BluetoothError(PREFIX + "GATT:" + gattStatusCode, "");
  }

  public static Bundle fromGattStatusCodeAsJSON(int gattStatusCode) {
    BluetoothError error = fromGattStatusCode(gattStatusCode);
    if (error != null) {
      return error.toJSON();
    }
    return null;
  }

  public static void reject(Promise promise, BluetoothError error) {
    promise.reject(error.code, error.message);
  }

  public static void rejectWithStatus(Promise promise, int gattStatusCode) {
    promise.reject(PREFIX + "GATT:" + gattStatusCode, "");
  }

  public static void reject(Promise promise, String message) {
    promise.reject(Codes.UNIMPLEMENTED, message);
  }

  public static final BluetoothError BLUETOOTH_UNAVAILABLE() {
    return new BluetoothError(PREFIX + "BLUETOOTH_UNAVAILABLE", "Bluetooth is not supported on this device.");
  }

  public static final BluetoothError LOCATION_PERMISSION() {
    return new BluetoothError(PREFIX + "LOCATION_PERMISSION", "Android BLE requires access to COARSE location data. Please enable the Location permission.");
  }

  public static final BluetoothError UNKOWN() {
    return new BluetoothError(PREFIX + "UNKNOWN", "An unknown error has occurred.");
  }

  public static final BluetoothError UNKOWN_SCANNING_ERROR() {
    return new BluetoothError(PREFIX + "UNKNOWN", "An unknown error has occurred while scanning for peripherals.");
  }

  public static final BluetoothError BLE_UNSUPPORTED() {
    return new BluetoothError(PREFIX + "UNSUPPORTED", "Failed to start power optimized scan as this feature is not supported.");
  }

  public static final BluetoothError OUT_OF_HARDWARE_RESOURCES() {
    return new BluetoothError(PREFIX + "OUT_OF_HARDWARE_RESOURCES", "Failed to start scanning because the device is out of hardware resources.");
  }

  public static final BluetoothError SCAN_INTERNAL() {
    return new BluetoothError(PREFIX + "INTERNAL", "Failed to start scan due to an internal error.");
  }

  public static final BluetoothError SCAN_REDUNDANT_INIT() {
    return new BluetoothError(PREFIX + "REDUNDANT_INIT", "Failed to start scan because a BLE scan with the same settings is already running. Stop scanning before attempting to start a new scan.");
  }

  public static final BluetoothError APP_REGISTRATION() {
    return new BluetoothError(PREFIX + "APP_REGISTRATION", "Failed to start scan because the app couldn't be registered.");
  }

  public static final BluetoothError CONCURRENT_TASK() {
    return new BluetoothError(PREFIX + "CONCURRENT_TASK", "Running concurrent task.");
  }

  public static final BluetoothError ENABLE_REQUEST_DENIED() {
    return new BluetoothError(PREFIX + "ENABLE_REQUEST_DENIED", "User denied enable request.");
  }

  // Bonding

  public static final BluetoothError BONDING_DENIED() {
    return new BluetoothError(PREFIX + "BONDING_DENIED", "The peripheral you attempted to bond with has denied the request.");
  }

  public static final BluetoothError CONCURRENT_BONDING(String currentUUID, String rejectedUUID) {
    return new BluetoothError(PREFIX + "CONCURRENT_BONDING", "Already attempting to bond with peripheral: " + currentUUID + ". Cannot bond with more than one peripheral at a time. Rejecting bond to: " + rejectedUUID);
  }

  public static final BluetoothError BONDING_FAILED(String peripheralUUID) {
    return new BluetoothError(PREFIX + "BONDING_FAILED", "Cannot create bond to Remote Device: " + peripheralUUID);
  }

  public Bundle toJSON() {
    Bundle output = new Bundle();
    output.putString("code", this.code);
    output.putString("domain", this.domain);
    output.putString("message", this.message);
    output.putString("reason", this.reason);
    output.putString("suggestion", this.suggestion);
    output.putString("underlayingError", this.underlayingError);
    output.putString("type", "error");
    return output;
  }

  public class Codes {
    public static final String UNKNOWN = "UNKNOWN";
    public static final String PLACEHOLDER = "BLUETOOTH";
    public static final String NO_PERIPHERAL = "NO_PERIPHERAL";
    public static final String NO_SERVICE = "NO_SERVICE";
    public static final String NO_CHARACTERISTIC = "NO_CHARACTERISTIC";
    public static final String NO_DESCRIPTOR = "NO_DESCRIPTOR";
    public static final String UNIMPLEMENTED = "UNIMPLEMENTED";
  }

  public class Messages {
    public static final String UNKNOWN = "An unknown error has occurred.";
    public static final String PLACEHOLDER = "An unknown error has occurred";
    public static final String NO_PERIPHERAL = "NO_PERIPHERAL";
    public static final String NO_SERVICE = "NO_SERVICE";
    public static final String NO_CHARACTERISTIC = "NO_CHARACTERISTIC";
    public static final String NO_DESCRIPTOR = "NO_DESCRIPTOR";
    public static final String UNIMPLEMENTED = "UNIMPLEMENTED";
  }
}
