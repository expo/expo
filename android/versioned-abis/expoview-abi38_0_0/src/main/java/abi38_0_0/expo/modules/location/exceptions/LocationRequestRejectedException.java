package abi38_0_0.expo.modules.location.exceptions;

import abi38_0_0.org.unimodules.core.interfaces.CodedThrowable;
import abi38_0_0.org.unimodules.core.errors.CodedException;

public class LocationRequestRejectedException extends CodedException implements CodedThrowable {
  public LocationRequestRejectedException(Exception cause) {
    super("Location request has been rejected: " + cause.getMessage());
  }

  @Override
  public String getCode() {
    return "E_LOCATION_REQUEST_REJECTED";
  }
}
