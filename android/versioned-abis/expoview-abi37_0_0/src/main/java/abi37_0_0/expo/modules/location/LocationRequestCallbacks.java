package abi37_0_0.expo.modules.location;

import android.location.Location;

import abi37_0_0.org.unimodules.core.errors.CodedException;

abstract class LocationRequestCallbacks {
  public void onLocationChanged(Location location) {}
  public void onLocationError(CodedException throwable) {}
  public void onRequestSuccess() {}
  public void onRequestFailed(CodedException throwable) {}
}
