package abi47_0_0.expo.modules.location.exceptions;

import abi47_0_0.expo.modules.core.interfaces.CodedThrowable;
import abi47_0_0.expo.modules.core.errors.CodedException;

public class LocationSettingsUnsatisfiedException extends CodedException implements CodedThrowable {
  public LocationSettingsUnsatisfiedException() {
    super("Location request failed due to unsatisfied device settings.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_SETTINGS_UNSATISFIED";
  }
}
