package expo.errors;

/**
 * Base class that can be extended to create coded errors that promise.reject
 * can handle.
 */

public abstract class CodedException extends Exception implements CodedThrowable {
  public CodedException(String message) {
    super(message);
  }

  public CodedException(Throwable cause) {
    super(cause);
  }

  public CodedException(String message, Throwable cause) {
    super(message, cause);
  }

  public String getCode() {
    return "ERR_UNSPECIFIED_ANDROID_EXCEPTION";
  }
}
