package expo.modules.location.exceptions;

import expo.modules.core.interfaces.CodedThrowable;
import expo.modules.core.errors.CodedException;

public class LocationUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationUnauthorizedException() {
    super("Not authorized to use location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_UNAUTHORIZED";
  }
}
