package abi49_0_0.expo.modules.location.exceptions;

import abi49_0_0.expo.modules.core.interfaces.CodedThrowable;
import abi49_0_0.expo.modules.core.errors.CodedException;

public class LocationBackgroundUnauthorizedException extends CodedException implements CodedThrowable {
  public LocationBackgroundUnauthorizedException() {
    super("Not authorized to use background location services.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_BACKGROUND_UNAUTHORIZED";
  }
}
