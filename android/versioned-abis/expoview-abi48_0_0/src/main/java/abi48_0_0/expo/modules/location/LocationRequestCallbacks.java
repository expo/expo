package abi48_0_0.expo.modules.location;

import android.location.Location;

import abi48_0_0.expo.modules.core.errors.CodedException;

abstract class LocationRequestCallbacks {
  public void onLocationChanged(Location location) {}
  public void onLocationError(CodedException throwable) {}
  public void onRequestSuccess() {}
  public void onRequestFailed(CodedException throwable) {}
}
