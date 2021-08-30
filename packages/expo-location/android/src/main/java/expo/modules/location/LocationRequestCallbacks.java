package expo.modules.location;

import android.location.Location;

import expo.modules.core.errors.CodedException;

abstract class LocationRequestCallbacks {
  public void onLocationChanged(Location location) {}
  public void onLocationError(CodedException throwable) {}
  public void onRequestSuccess() {}
  public void onRequestFailed(CodedException throwable) {}
}
