package expo.modules.location.exceptions;

import org.unimodules.core.interfaces.CodedThrowable;
import org.unimodules.core.errors.CodedException;

public class LocationForegroundUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationForegroundUnauthorizedException() {
    super("Not authorized to use foreground location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_FOREGROUND_UNAUTHORIZED";
  }
}
