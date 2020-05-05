package abi37_0_0.expo.modules.location.exceptions;

import abi37_0_0.org.unimodules.core.interfaces.CodedThrowable;
import abi37_0_0.org.unimodules.core.errors.CodedException;

public class LocationRequestTimeoutException extends CodedException implements CodedThrowable {
  public LocationRequestTimeoutException() {
    super("Location request timed out.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_TIMEOUT";
  }
}
