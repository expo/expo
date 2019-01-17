package expo.modules.bluetooth;

import android.bluetooth.BluetoothGatt;
import android.os.Bundle;

import expo.core.Promise;

public class BluetoothError {

  public String code;
  public String domain;
  public String message;
  public String reason;
  public String suggestion;
  public String underlayingError;

  public String deviceID;
  public String serviceUUID;
  public String characteristicUUID;
  public String descriptorUUID;

  public BluetoothError(String code, String message) {
    this.code = code;
    this.message = message;
  }

  public static void reject(Promise promise, BluetoothError error) {
    promise.reject(error.code, error.message);
  }

  public static void reject(Promise promise, String message) {
    promise.reject(Codes.UNIMPLEMENTED, message);
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
    public static final String PLACEHOLDER = "ERR_BLUETOOTH";

    public static final String NO_PERIPHERAL = "ERR_NO_PERIPHERAL";
    public static final String NO_SERVICE = "ERR_NO_SERVICE";
    public static final String NO_CHARACTERISTIC = "ERR_NO_CHARACTERISTIC";
    public static final String NO_DESCRIPTOR = "ERR_NO_DESCRIPTOR";

    public static final String UNIMPLEMENTED = "ERR_UNIMPLEMENTED";
  }

  public class Messages {
    public static final String PLACEHOLDER = "An unknown error has occurred";
    public static final String NO_PERIPHERAL = "ERR_NO_PERIPHERAL";
    public static final String NO_SERVICE = "ERR_NO_SERVICE";
    public static final String NO_CHARACTERISTIC = "ERR_NO_CHARACTERISTIC";
    public static final String NO_DESCRIPTOR = "ERR_NO_DESCRIPTOR";
    public static final String UNIMPLEMENTED = "ERR_UNIMPLEMENTED";
  }


  public static Bundle errorFromGattStatus(int status) {
    if (status != BluetoothGatt.GATT_SUCCESS) {
      Bundle output = new Bundle();
      output.putString(BluetoothConstants.JSON.MESSAGE, Serialize.messageForGATTStatus(status));
      return output;
    }
    return null;
  }
}
