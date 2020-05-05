package abi37_0_0.expo.modules.location.exceptions;

import abi37_0_0.org.unimodules.core.interfaces.CodedThrowable;
import abi37_0_0.org.unimodules.core.errors.CodedException;

public class LocationUnavailableException extends CodedException implements CodedThrowable {
  public LocationUnavailableException() {
    super("Location provider is unavailable. Make sure that location services are enabled.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_UNAVAILABLE";
  }
}
