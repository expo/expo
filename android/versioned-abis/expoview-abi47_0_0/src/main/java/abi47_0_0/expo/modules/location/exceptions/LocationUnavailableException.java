package abi47_0_0.expo.modules.location.exceptions;

import abi47_0_0.expo.modules.core.interfaces.CodedThrowable;
import abi47_0_0.expo.modules.core.errors.CodedException;

public class LocationUnavailableException extends CodedException implements CodedThrowable {
  public LocationUnavailableException() {
    super("Location is unavailable. Make sure that location services are enabled.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_UNAVAILABLE";
  }
}
