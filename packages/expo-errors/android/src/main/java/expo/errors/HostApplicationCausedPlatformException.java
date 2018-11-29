package expo.errors;

/**
 * Helper class to make errors easier to handle. The native promise.reject
 * method on each platform should know about this class and be able to get
 * the code itself when passed an instance of this class.
 */

public abstract class HostApplicationCausedPlatformException extends RuntimeException {
  public HostApplicationCausedPlatformException(String message) {
    super(message);
  }

  public HostApplicationCausedPlatformException(Throwable cause) {
    super(cause);
  }

  public HostApplicationCausedPlatformException(String message, Throwable cause) {
    super(message, cause);
  }

  public String getCode() {
    return "ERR_UNSPECIFIED_HOST_CAUSED_PLATFORM_EXCEPTION";
  }
}
