package abi38_0_0.expo.modules.location.exceptions;

import abi38_0_0.org.unimodules.core.interfaces.CodedThrowable;
import abi38_0_0.org.unimodules.core.errors.CodedException;

public class LocationSettingsUnsatisfiedException extends CodedException implements CodedThrowable {
  public LocationSettingsUnsatisfiedException() {
    super("Location request failed due to unsatisfied device settings.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_SETTINGS_UNSATISFIED";
  }
}
