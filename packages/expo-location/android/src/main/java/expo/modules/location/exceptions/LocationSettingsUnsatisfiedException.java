package expo.modules.location.exceptions;

import expo.core.interfaces.CodedThrowable;
import expo.errors.CodedException;

public class LocationSettingsUnsatisfiedException extends CodedException implements CodedThrowable {
  public LocationSettingsUnsatisfiedException() {
    super("Location request failed due to unsatisfied device settings.");
  }

  @Override
  public String getCode() {
    return "E_LOCATION_SETTINGS_UNSATISFIED";
  }
}
