package abi49_0_0.expo.modules.core.errors;

import abi49_0_0.expo.modules.core.interfaces.CodedThrowable;

/**
 * Base class that can be extended to create coded runtime errors that
 * promise.reject can handle.
 */

public abstract class CodedRuntimeException extends RuntimeException implements CodedThrowable {
  public CodedRuntimeException(String message) {
    super(message);
  }

  public CodedRuntimeException(Throwable cause) {
    super(cause);
  }

  public CodedRuntimeException(String message, Throwable cause) {
    super(message, cause);
  }

  public String getCode() {
    return "ERR_UNSPECIFIED_ANDROID_EXCEPTION";
  }
}
