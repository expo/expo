// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.support.v4.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.experience.BaseExperienceActivity;

public class LocationModule extends ReactContextBaseJavaModule {
  Map<Integer, LocationListener> mLocationListeners = new HashMap<>();

  public LocationModule(ReactApplicationContext reactContext) {
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

  private static String selectProvider(LocationManager locMgr, boolean highAccuracy) {
    String provider = highAccuracy ? LocationManager.GPS_PROVIDER : LocationManager.NETWORK_PROVIDER;
    if (!locMgr.isProviderEnabled(provider)) {
      provider = provider.equals(LocationManager.GPS_PROVIDER) ?
              LocationManager.NETWORK_PROVIDER :
              LocationManager.GPS_PROVIDER;
    }
    if (locMgr.isProviderEnabled(provider)) {
      return provider;
    }
    return null;
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
    final String provider = selectProvider(locMgr, highAccuracy);
    if (provider == null) {
      promise.reject("E_NO_LOCATION_PROVIDER", "No location provider available.");
    }

    // Check for permissions
    if (Build.VERSION.SDK_INT >= 23 &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_FINE_LOCATION ) != PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("E_MISSING_PERMISSION", "Missing location permissions.");
      return;
    }

    // Have location cached already?
    Location location = locMgr.getLastKnownLocation(provider);
    if (location != null && SystemClock.currentTimeMillis() - location.getTime() < maximumAge) {
      promise.resolve(locationToMap(location));
      return;
    }

    // No cached location, ask for one
    final Handler handler = new Handler();
    class SingleRequest {
      private boolean mDone;

      public void invoke() {
        if (Build.VERSION.SDK_INT >= 23 &&
            ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_FINE_LOCATION ) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
          promise.reject("E_MISSING_PERMISSION", "Missing location permissions.");
          return;
        }

        locMgr.requestSingleUpdate(provider, mLocListener, null);
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
              if (Build.VERSION.SDK_INT >= 23 &&
                  ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_FINE_LOCATION ) != PackageManager.PERMISSION_GRANTED &&
                  ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("E_MISSING_PERMISSION", "Missing location permissions.");
                return;
              }
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

  @ReactMethod
  public void watchPositionImplAsync(final int watchId, final ReadableMap options, final Promise promise) {
    // Need to run when experience activity visible
    BaseExperienceActivity activity = BaseExperienceActivity.getVisibleActivity();
    if (activity == null) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request location when visible.");
      return;
    }

    // Read options
    final boolean highAccuracy = options.hasKey("enableHighAccuracy") && options.getBoolean("enableHighAccuracy");
    final int timeInterval = options.hasKey("timeInterval") ? options.getInt("timeInterval") : 1000;
    final int distanceInterval = options.hasKey("distanceInterval") ? options.getInt("distanceInterval") : 100;

    // Select location provider
    final LocationManager locMgr = (LocationManager)
            getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE);
    final String provider = selectProvider(locMgr, highAccuracy);
    if (provider == null) {
      promise.reject("E_NO_LOCATION_PROVIDER", "No location provider available.");
      return;
    }

    // Check for permissions
    if (Build.VERSION.SDK_INT >= 23 &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_FINE_LOCATION ) != PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("E_MISSING_PERMISSION", "Missing location permissions.");
      return;
    }

    LocationListener listener = new LocationListener() {
      @Override
      public void onLocationChanged(Location location) {
        WritableMap response = Arguments.createMap();
        response.putInt("watchId", watchId);
        response.putMap("location", locationToMap(location));
        getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
            .emit("Exponent.locationChanged", response);
      }
      @Override
      public void onStatusChanged(String provider, int status, Bundle extras) { }
      @Override
      public void onProviderEnabled(String provider) { }
      @Override
      public void onProviderDisabled(String provider) { }
    };
    locMgr.requestLocationUpdates(provider, timeInterval, distanceInterval, listener);
    mLocationListeners.put(watchId, listener);
    promise.resolve(null);
  }

  @ReactMethod
  public void removeWatchAsync(final int watchId, final Promise promise) {
    final LocationManager locMgr = (LocationManager)
            getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE);
    final LocationListener listener = mLocationListeners.get(watchId);
    if (listener == null) {
      promise.resolve(null);
      return;
    }

    if (Build.VERSION.SDK_INT >= 23 &&
            ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_FINE_LOCATION ) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("E_MISSING_PERMISSION", "Missing location permissions.");
      return;
    }
    locMgr.removeUpdates(listener);
    mLocationListeners.remove(watchId);
    promise.resolve(null);
  }
}
