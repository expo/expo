package expo.modules.location.exceptions;

import org.unimodules.core.interfaces.CodedThrowable;
import org.unimodules.core.errors.CodedException;

public class LocationBackgroundUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationBackgroundUnauthorizedException() {
    super("Not authorized to use background location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_BACKGROUND_UNAUTHORIZED";
  }
}
