package expo.modules.notifications.notifications.channels;

import expo.modules.core.errors.CodedRuntimeException;

public class InvalidVibrationPatternException extends CodedRuntimeException {
  public InvalidVibrationPatternException(int invalidValueKey, Object invalidValue) {
    super("Invalid value in vibration pattern, expected all elements to be numbers, got: " + invalidValue + " under " + invalidValueKey);
  }

  @Override
  public String getCode() {
    return "ERR_INVALID_VIBRATION_PATTERN";
  }
}
