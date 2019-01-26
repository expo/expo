package expo.modules.location.exceptions;

import expo.core.interfaces.CodedThrowable;
import expo.errors.CodedException;

public class LocationRequestTimeoutException extends CodedException implements CodedThrowable {
  public LocationRequestTimeoutException() {
    super("Location request timed out.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_TIMEOUT";
  }
}
