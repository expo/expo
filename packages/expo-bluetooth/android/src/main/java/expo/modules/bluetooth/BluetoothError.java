package expo.modules.bluetooth;

import android.bluetooth.BluetoothGatt;
import android.bluetooth.le.ScanCallback;
import android.os.Bundle;

import expo.core.Promise;

public class BluetoothError {

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

  public static BluetoothError fromScanCallbackErrorCode(int errorCode) {
    switch (errorCode) {
      case ScanCallback.SCAN_FAILED_ALREADY_STARTED:
        return SCAN_REDUNDANT_INIT();
      case ScanCallback.SCAN_FAILED_APPLICATION_REGISTRATION_FAILED:
        return APP_REGISTRATION();
      case ScanCallback.SCAN_FAILED_INTERNAL_ERROR:
        return SCAN_INTERNAL();
      case ScanCallback.SCAN_FAILED_FEATURE_UNSUPPORTED:
        return BLE_UNSUPPORTED();
      default:
        return UNKOWN();
    }
  }

  public static void reject(Promise promise, BluetoothError error) {
    promise.reject(error.code, error.message);
  }

  public static void rejectWithStatus(Promise promise, int status) {
    promise.reject(Codes.UNIMPLEMENTED, Serialize.messageForGATTStatus(status));
  }

  public static void reject(Promise promise, String message) {
    promise.reject(Codes.UNIMPLEMENTED, message);
  }

  public static final BluetoothError UNKOWN() {
    return new BluetoothError("ERR_UNKNOWN", "An unknown error has occurred.");
  }

  public static final BluetoothError BLE_UNSUPPORTED() {
    return new BluetoothError("ERR_BLE_UNSUPPORTED", "Failed to start power optimized scan as this feature is not supported.");
  }

  public static final BluetoothError SCAN_INTERNAL() {
    return new BluetoothError("ERR_SCAN_INTERNAL", "Failed to start scan due to an internal error.");
  }

  public static final BluetoothError SCAN_REDUNDANT_INIT() {
    return new BluetoothError("ERR_SCAN_REDUNDANT_INIT", "Failed to start scan because a BLE scan with the same settings is already started by the app.");
  }

  public static final BluetoothError APP_REGISTRATION() {
    return new BluetoothError("ERR_APP_REGISTRATION", "Failed to start scan because the app couldn't be registered.");
  }

  public static final BluetoothError CONCURRENT_TASK() {
    return new BluetoothError("ERR_CONCURRENT_TASK", "Running concurrent task.");
  }

  public static Bundle errorFromGattStatus(int status) {
    if (status != BluetoothGatt.GATT_SUCCESS) {
      Bundle output = new Bundle();
      output.putString(BluetoothConstants.JSON.MESSAGE, Serialize.messageForGATTStatus(status));
      return output;
    }
    return null;
  }

  public Bundle toJSON() {
    Bundle output = new Bundle();
    output.putString("code", this.code);
    output.putString("domain", this.domain);
    output.putString("message", this.message);
    output.putString("reason", this.reason);
    output.putString("suggestion", this.suggestion);
    output.putString("underlayingError", this.underlayingError);
    return output;
  }

  public class Codes {

    public static final String UNKNOWN = "ERR_UNKNOWN";

    public static final String PLACEHOLDER = "ERR_BLUETOOTH";

    public static final String NO_PERIPHERAL = "ERR_NO_PERIPHERAL";
    public static final String NO_SERVICE = "ERR_NO_SERVICE";
    public static final String NO_CHARACTERISTIC = "ERR_NO_CHARACTERISTIC";
    public static final String NO_DESCRIPTOR = "ERR_NO_DESCRIPTOR";

    public static final String UNIMPLEMENTED = "ERR_UNIMPLEMENTED";
  }

  public class Messages {
    public static final String UNKNOWN = "An unknown error has occurred.";

    public static final String PLACEHOLDER = "An unknown error has occurred";
    public static final String NO_PERIPHERAL = "ERR_NO_PERIPHERAL";
    public static final String NO_SERVICE = "ERR_NO_SERVICE";
    public static final String NO_CHARACTERISTIC = "ERR_NO_CHARACTERISTIC";
    public static final String NO_DESCRIPTOR = "ERR_NO_DESCRIPTOR";
    public static final String UNIMPLEMENTED = "ERR_UNIMPLEMENTED";
  }
}
