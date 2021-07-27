package expo.modules.location.exceptions;

import expo.modules.core.interfaces.CodedThrowable;
import expo.modules.core.errors.CodedException;

public class LocationBackgroundUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationBackgroundUnauthorizedException() {
    super("Not authorized to use background location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_BACKGROUND_UNAUTHORIZED";
  }
}
