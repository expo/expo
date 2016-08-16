package abi5_0_0.host.exp.exponent.modules;

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;

import abi5_0_0.com.facebook.react.bridge.Arguments;
import abi5_0_0.com.facebook.react.bridge.Promise;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.bridge.ReactMethod;
import abi5_0_0.com.facebook.react.bridge.ReadableMap;
import abi5_0_0.com.facebook.react.bridge.WritableMap;
import abi5_0_0.com.facebook.react.common.SystemClock;

import host.exp.exponent.experience.BaseExperienceActivity;

public class ExponentLocationModule extends ReactContextBaseJavaModule {
  public ExponentLocationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentLocation";
  }

  private static WritableMap locationToMap(Location location) {
    WritableMap map = Arguments.createMap();
    WritableMap coords = Arguments.createMap();
    coords.putDouble("latitude", location.getLatitude());
    coords.putDouble("longitude", location.getLongitude());
    coords.putDouble("altitude", location.getAltitude());
    coords.putDouble("accuracy", location.getAccuracy());
    coords.putDouble("heading", location.getBearing());
    coords.putDouble("speed", location.getSpeed());
    map.putMap("coords", coords);
    map.putDouble("timestamp", location.getTime());
    return map;
  }

  @ReactMethod
  public void getCurrentPositionAsync(final ReadableMap options, final Promise promise) {
    // Need to run when experience activity visible
    BaseExperienceActivity activity = BaseExperienceActivity.getVisibleActivity();
    if (activity == null) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request location when visible.");
      return;
    }

    // Read options
    final long timeout = options.hasKey("timeout") ? (long) options.getDouble("timeout") : Long.MAX_VALUE;
    final double maximumAge = options.hasKey("maximumAge") ? options.getDouble("maximumAge") : Double.POSITIVE_INFINITY;
    boolean highAccuracy = options.hasKey("enableHighAccuracy") && options.getBoolean("enableHighAccuracy");

    // Select location provider
    final LocationManager locMgr = (LocationManager)
            getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE);
    String provider = highAccuracy ? LocationManager.GPS_PROVIDER : LocationManager.NETWORK_PROVIDER;
    if (!locMgr.isProviderEnabled(provider)) {
      provider = provider.equals(LocationManager.GPS_PROVIDER) ?
              LocationManager.NETWORK_PROVIDER :
              LocationManager.GPS_PROVIDER;
    }
    final String theProvider = provider;
    if (!locMgr.isProviderEnabled(theProvider)) {
      promise.reject("E_NO_LOCATION_PROVIDER", "No location provider available.");
    }

    // Ask for permissions
    final String[] permissions = new String[]{
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
    };
    activity.getPermissions(new BaseExperienceActivity.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        // Have location cached already?
        Location location = locMgr.getLastKnownLocation(theProvider);
        if (location != null && SystemClock.currentTimeMillis() - location.getTime() < maximumAge) {
          promise.resolve(locationToMap(location));
          return;
        }

        // No cached location, ask for one
        final Handler handler = new Handler();
        class SingleRequest {
          private boolean mDone;

          public void invoke() {
            locMgr.requestSingleUpdate(theProvider, mLocListener, null);
            handler.postDelayed(mTimeoutRunnable, timeout);
          }

          // Called when location request fulfilled
          private final LocationListener mLocListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
              synchronized (SingleRequest.this) {
                if (!mDone) {
                  promise.resolve(locationToMap(location));
                  handler.removeCallbacks(mTimeoutRunnable);
                  mDone = true;
                }
              }
            }

            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {}
            @Override
            public void onProviderEnabled(String provider) {}
            @Override
            public void onProviderDisabled(String provider) {}
          };

          // Called on timeout
          private final Runnable mTimeoutRunnable = new Runnable() {
            @Override
            public void run() {
              synchronized (SingleRequest.this) {
                if (!mDone) {
                  promise.reject("E_TIMEOUT", "Location request timed out.");
                  locMgr.removeUpdates(mLocListener);
                  mDone = true;
                }
              }
            }
          };
        }
        new SingleRequest().invoke();
      }

      @Override
      public void permissionsDenied() {
        promise.reject("E_MISSING_PERMISSION", "User rejected location permissions.");
      }
    }, permissions);
  }
}
