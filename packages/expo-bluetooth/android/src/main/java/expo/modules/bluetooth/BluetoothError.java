package expo.modules.bluetooth;

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

  static void reject(Promise promise, BluetoothError error) {
    promise.reject(error.code, error.message);
  }

  static void reject(Promise promise, String message) {
    promise.reject(Codes.UNIMPLEMENTED, message);
  }

  public BluetoothError(String code, String message) {
    this.code = code;
    this.message = message;
  }

  public class Codes {
    protected static final String PLACEHOLDER = "ERR_BLUETOOTH";

    protected static final String NO_PERIPHERAL = "ERR_NO_PERIPHERAL";
    protected static final String NO_SERVICE = "ERR_NO_SERVICE";
    protected static final String NO_CHARACTERISTIC = "ERR_NO_CHARACTERISTIC";
    protected static final String NO_DESCRIPTOR = "ERR_NO_DESCRIPTOR";

    protected static final String UNIMPLEMENTED = "ERR_UNIMPLEMENTED";
  }

  public class Messages {
    protected static final String PLACEHOLDER = "An unknown error has occurred";
    protected static final String NO_PERIPHERAL = "ERR_NO_PERIPHERAL";
    protected static final String NO_SERVICE = "ERR_NO_SERVICE";
    protected static final String NO_CHARACTERISTIC = "ERR_NO_CHARACTERISTIC";
    protected static final String NO_DESCRIPTOR = "ERR_NO_DESCRIPTOR";
    protected static final String UNIMPLEMENTED = "ERR_UNIMPLEMENTED";
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
}
