package abi40_0_0.expo.modules.location.exceptions;

import abi40_0_0.org.unimodules.core.interfaces.CodedThrowable;
import abi40_0_0.org.unimodules.core.errors.CodedException;

public class LocationUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationUnauthorizedException() {
    super("Not authorized to use location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_UNAUTHORIZED";
  }
}
