package org.unimodules.core;

/**
 * Exception for mismatched host-to-native interfaces. Compared to a Java-only program,
 * these modules are more susceptible to mismatched interfaces, and this class helps
 * harden those interfaces.
 */
public class InvalidArgumentException extends Exception {
  public InvalidArgumentException() {
  }

  public InvalidArgumentException(String message) {
    super(message);
  }

  public InvalidArgumentException(Throwable cause) {
    super(cause);
  }

  public InvalidArgumentException(String message, Throwable cause) {
    super(message, cause);
  }
}
