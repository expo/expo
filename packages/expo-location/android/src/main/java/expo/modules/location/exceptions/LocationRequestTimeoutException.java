package expo.modules.location.exceptions;

import org.unimodules.core.interfaces.CodedThrowable;
import org.unimodules.core.errors.CodedException;

public class LocationRequestTimeoutException extends CodedException implements CodedThrowable {
  public LocationRequestTimeoutException() {
    super("Location request timed out.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_TIMEOUT";
  }
}
