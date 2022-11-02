package abi47_0_0.expo.modules.location.exceptions;

import abi47_0_0.expo.modules.core.interfaces.CodedThrowable;
import abi47_0_0.expo.modules.core.errors.CodedException;

public class LocationUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationUnauthorizedException() {
    super("Not authorized to use location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_UNAUTHORIZED";
  }
}
