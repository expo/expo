// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.support.v4.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import host.exp.exponent.utils.TimeoutObject;
import io.nlopez.smartlocation.OnLocationUpdatedListener;
import io.nlopez.smartlocation.SmartLocation;
import io.nlopez.smartlocation.location.config.LocationAccuracy;
import io.nlopez.smartlocation.location.config.LocationParams;
import versioned.host.exp.exponent.ScopedReactApplicationContext;

public class LocationModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  private ScopedReactApplicationContext mScopedReactApplicationContext;
  private LocationParams mLocationParams;
  private OnLocationUpdatedListener mOnLocationUpdatedListener;

  public LocationModule(ScopedReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);

    mScopedReactApplicationContext = reactContext;
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

  private boolean isMissingPermissions() {
    return Build.VERSION.SDK_INT >= 23 &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_FINE_LOCATION ) != PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED;
  }

  @ReactMethod
  public void getCurrentPositionAsync(final ReadableMap options, final Promise promise) {
    // Read options
    final Long timeout = options.hasKey("timeout") ? (long) options.getDouble("timeout") : null;
    final double maximumAge = options.hasKey("maximumAge") ? options.getDouble("maximumAge") : Double.POSITIVE_INFINITY;
    boolean highAccuracy = options.hasKey("enableHighAccuracy") && options.getBoolean("enableHighAccuracy");

    // Check for permissions
    if (isMissingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing location permissions.");
      return;
    }

    final LocationParams locationParams = highAccuracy ? LocationParams.NAVIGATION : LocationParams.BEST_EFFORT;
    // LocationControl has an internal map from Context -> LocationProvider, so each experience
    // will only have one instance of a LocationProvider.
    SmartLocation.LocationControl locationControl = SmartLocation.with(mScopedReactApplicationContext).location().oneFix().config(locationParams);

    // Have location cached already?
    Location location = locationControl.getLastLocation();
    if (location != null && SystemClock.currentTimeMillis() - location.getTime() < maximumAge) {
      promise.resolve(locationToMap(location));
      return;
    }

    final TimeoutObject timeoutObject = new TimeoutObject(timeout);

    timeoutObject.onTimeout(new TimeoutObject.TimeoutListener() {
      @Override
      public void onTimeout() {
        promise.reject("E_TIMEOUT", "Location request timed out.");
      }
    });

    locationControl.start(new OnLocationUpdatedListener() {
      @Override
      public void onLocationUpdated(Location location) {
        if (timeoutObject.markDoneIfNotTimedOut()) {
          promise.resolve(locationToMap(location));
        }
      }
    });
  }

  private void startWatching() {
    if (mScopedReactApplicationContext == null || mLocationParams == null || mOnLocationUpdatedListener == null) {
      return;
    }

    // LocationControl has an internal map from Context -> LocationProvider, so each experience
    // will only have one instance of a LocationProvider.
    SmartLocation.with(mScopedReactApplicationContext).location().config(mLocationParams).start(mOnLocationUpdatedListener);
  }

  private void stopWatching() {
    if (mScopedReactApplicationContext == null || mLocationParams == null || mOnLocationUpdatedListener == null) {
      return;
    }

    SmartLocation.with(mScopedReactApplicationContext).location().stop();
  }

  // TODO: Stop sending watchId from JS since we ignore it.
  @ReactMethod
  public void watchPositionImplAsync(final int watchId, final ReadableMap options, final Promise promise) {
    // Read options
    final boolean highAccuracy = options.hasKey("enableHighAccuracy") && options.getBoolean("enableHighAccuracy");
    final int timeInterval = options.hasKey("timeInterval") ? options.getInt("timeInterval") : 1000;
    final int distanceInterval = options.hasKey("distanceInterval") ? options.getInt("distanceInterval") : 100;

    // Check for permissions
    if (isMissingPermissions()) {
      promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services");
      return;
    }

    mLocationParams = (new LocationParams.Builder()).setAccuracy(highAccuracy ? LocationAccuracy.HIGH : LocationAccuracy.MEDIUM).setDistance(distanceInterval).setInterval(timeInterval).build();
    mOnLocationUpdatedListener = new OnLocationUpdatedListener() {
      @Override
      public void onLocationUpdated(Location location) {
        WritableMap response = Arguments.createMap();
        response.putInt("watchId", watchId);
        response.putMap("location", locationToMap(location));
        getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
            .emit("Exponent.locationChanged", response);
      }
    };

    startWatching();
    promise.resolve(null);
  }

  // TODO: Stop sending watchId from JS since we ignore it.
  @ReactMethod
  public void removeWatchAsync(final int watchId, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services");
      return;
    }

    stopWatching();

    mLocationParams = null;
    mOnLocationUpdatedListener = null;

    promise.resolve(null);
  }

  @Override
  public void onHostResume() {
    startWatching();
  }

  @Override
  public void onHostPause() {
    stopWatching();
  }

  @Override
  public void onHostDestroy() {
    stopWatching();
  }
}
