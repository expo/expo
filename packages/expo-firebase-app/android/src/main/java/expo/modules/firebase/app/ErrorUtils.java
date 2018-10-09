package expo.modules.firebase.app;

public class ErrorUtils {
  /**
   * Wrap a message string with the specified service name e.g. 'Database'
   *
   * @param message
   * @param service
   * @param fullCode
   * @return
   */
  public static String getMessageWithService(String message, String service, String fullCode) {
    // Service: Error message (service/code).
    return service + ": " + message + " (" + fullCode.toLowerCase() + ").";
  }

  /**
   * Generate a service error code string e.g. 'DATABASE/PERMISSION-DENIED'
   *
   * @param service
   * @param code
   * @return
   */
  public static String getCodeWithService(String service, String code) {
    return service.toLowerCase() + "/" + code.toLowerCase();
  }
}
