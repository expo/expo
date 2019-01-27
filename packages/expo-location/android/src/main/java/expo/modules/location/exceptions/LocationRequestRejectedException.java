package expo.modules.location.exceptions;

import expo.core.interfaces.CodedThrowable;
import expo.errors.CodedException;

public class LocationRequestRejectedException extends CodedException implements CodedThrowable {
  public LocationRequestRejectedException(Exception cause) {
    super("Location request has been rejected: " + cause.getMessage());
  }

  @Override
  public String getCode() {
    return "E_LOCATION_REQUEST_REJECTED";
  }
}
