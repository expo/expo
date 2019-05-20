package org.unimodules.core.errors;

/**
 * Exception for mismatched host-to-native interfaces. Compared to a Java-only
 * program, these modules are more susceptible to mismatched interfaces, and
 * this class helps harden those interfaces.
 */

public class InvalidArgumentException extends CodedRuntimeException {
  public InvalidArgumentException(String message) {
    super(message);
  }

  public InvalidArgumentException(Throwable cause) {
    super(cause);
  }

  public InvalidArgumentException(String message, Throwable cause) {
    super(message, cause);
  }

  @Override
  public String getCode() {
    return "ERR_INVALID_ARGUMENT";
  }
}
