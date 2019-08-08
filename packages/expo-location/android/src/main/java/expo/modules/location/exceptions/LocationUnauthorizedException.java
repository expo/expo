package expo.modules.location.exceptions;

import org.unimodules.core.interfaces.CodedThrowable;
import org.unimodules.core.errors.CodedException;

public class LocationUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationUnauthorizedException() {
    super("Not authorized to use location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_UNAUTHORIZED";
  }
}
