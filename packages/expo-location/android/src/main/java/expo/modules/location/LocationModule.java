// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.location;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.GeomagneticField;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.EventEmitter;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.permissions.Permissions;
import expo.modules.location.utils.TimeoutObject;
import io.nlopez.smartlocation.OnGeocodingListener;
import io.nlopez.smartlocation.OnLocationUpdatedListener;
import io.nlopez.smartlocation.OnReverseGeocodingListener;
import io.nlopez.smartlocation.SmartLocation;
import io.nlopez.smartlocation.geocoding.utils.LocationAddress;
import io.nlopez.smartlocation.location.config.LocationAccuracy;
import io.nlopez.smartlocation.location.config.LocationParams;
import io.nlopez.smartlocation.location.utils.LocationState;

public class LocationModule extends ExportedModule implements ModuleRegistryConsumer, LifecycleEventListener, SensorEventListener {

  private Context mContext;
  private LocationParams mLocationParams;
  private OnLocationUpdatedListener mOnLocationUpdatedListener;
  private SensorManager mSensorManager;
  private GeomagneticField mGeofield;

  // modules
  private EventEmitter mEventEmitter;
  private UIManager mUIManager;
  private Permissions mPermissions;

  private float[] mGravity;
  private float[] mGeomagnetic;
  private int mHeadingId;
  private float mLastAzimut = 0;
  private int mAccuracy = 0;
  private long mLastUpdate = 0;
  private boolean mGeocoderPaused = false;

  private static final double DEGREE_DELTA = 0.0355; // in radians, about 2 degrees
  private static final float TIME_DELTA = 50; // in milliseconds

  public LocationModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return "ExpoLocation";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    if (mUIManager != null) {
      mUIManager.unregisterLifecycleEventListener(this);
    }

    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mUIManager = moduleRegistry.getModule(UIManager.class);
    mPermissions = moduleRegistry.getModule(Permissions.class);

    if (mUIManager != null) {
      mUIManager.registerLifecycleEventListener(this);
    }
  }

  public static Bundle locationToMap(Location location) {
    Bundle map = new Bundle();
    Bundle coords = new Bundle();
    coords.putDouble("latitude", location.getLatitude());
    coords.putDouble("longitude", location.getLongitude());
    coords.putDouble("altitude", location.getAltitude());
    coords.putDouble("accuracy", location.getAccuracy());
    coords.putDouble("heading", location.getBearing());
    coords.putDouble("speed", location.getSpeed());
    map.putBundle("coords", coords);
    map.putDouble("timestamp", location.getTime());
    map.putBoolean("mocked", location.isFromMockProvider());

    return map;
  }

  private static Bundle addressToMap(Address address) {
    Bundle map = new Bundle();
    map.putString("city", address.getLocality());
    map.putString("street", address.getThoroughfare());
    map.putString("region", address.getAdminArea());
    map.putString("country", address.getCountryName());
    map.putString("postalCode", address.getPostalCode());
    map.putString("name", address.getFeatureName());
    map.putString("isoCountryCode", address.getCountryCode());

    return map;
  }

  private boolean isMissingPermissions() {
    return mPermissions == null
        || (
            mPermissions.getPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
            && mPermissions.getPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED
        );
  }

  @ExpoMethod
  public void getCurrentPositionAsync(final Map<String, Object> options, final Promise promise) {
    // Read options
    final Long timeout = options.containsKey("timeout") ? ((Double) options.get("timeout")).longValue() : null;
    boolean highAccuracy = options.containsKey("enableHighAccuracy") && (boolean) options.get("enableHighAccuracy");

    final LocationParams locationParams = highAccuracy ? LocationParams.NAVIGATION : LocationParams.BEST_EFFORT;
    // LocationControl has an internal map from Context -> LocationProvider, so each experience
    // will only have one instance of a LocationProvider.
    SmartLocation.LocationControl locationControl = SmartLocation.with(mContext).location().oneFix().config(locationParams);

    if (!locationControl.state().isAnyProviderAvailable()) {
      promise.reject("E_LOCATION_SERVICES_DISABLED", "Location services are disabled");
      return;
    }

    // Check for permissions
    if (isMissingPermissions()) {
      promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services");
      return;
    }

    // Have location cached already?
    if (options.containsKey("maximumAge")) {
      double maximumAge = (double) options.get("maximumAge");
      Location location = locationControl.getLastLocation();
      if (location != null && System.currentTimeMillis() - location.getTime() < maximumAge) {
        promise.resolve(locationToMap(location));
        return;
      }
    }

    final TimeoutObject timeoutObject = new TimeoutObject(timeout);
    timeoutObject.onTimeout(new TimeoutObject.TimeoutListener() {
      @Override
      public void onTimeout() {
        promise.reject("E_LOCATION_TIMEOUT", "Location request timed out.");
      }
    });
    timeoutObject.start();

    locationControl.start(new OnLocationUpdatedListener() {
      @Override
      public void onLocationUpdated(Location location) {
        if (timeoutObject.markDoneIfNotTimedOut()) {
          promise.resolve(locationToMap(location));
        }
      }
    });
  }

  private boolean startWatching() {
    if (mContext == null) {
      return false;
    }

    // if permissions not granted it won't work anyway, but this can be invoked when permission dialog disappears
    if (!isMissingPermissions()) {
      mGeocoderPaused = false;
    }

    if (mLocationParams == null || mOnLocationUpdatedListener == null) {
      return false;
    }

    // LocationControl has an internal map from Context -> LocationProvider, so each experience
    // will only have one instance of a LocationProvider.
    SmartLocation.LocationControl locationControl = SmartLocation.with(mContext).location().config(mLocationParams);
    if (!locationControl.state().isAnyProviderAvailable()) {
      return false;
    }
    locationControl.start(mOnLocationUpdatedListener);
    return true;
  }

  private void stopWatching() {
    if (mContext == null) {
      return;
    }

    // if permissions not granted it won't work anyway, but this can be invoked when permission dialog appears
    if (Geocoder.isPresent() && !isMissingPermissions()) {
      SmartLocation.with(mContext).geocoding().stop();
      mGeocoderPaused = true;
    }

    if (mLocationParams == null || mOnLocationUpdatedListener == null) {
      SmartLocation.with(mContext).location().stop();
    }
  }

  @ExpoMethod
  public void getProviderStatusAsync(final Promise promise) {
    if (mContext == null) {
      promise.reject("E_CONTEXT_UNAVAILABLE", "Context is not available");
    }

    LocationState state = SmartLocation.with(mContext).location().state();

    Bundle map = new Bundle();

    map.putBoolean("locationServicesEnabled", state.locationServicesEnabled()); // If location is off
    map.putBoolean("gpsAvailable", state.isGpsAvailable()); // If GPS provider is enabled
    map.putBoolean("networkAvailable", state.isNetworkAvailable()); // If network provider is enabled
    map.putBoolean("passiveAvailable", state.isPassiveAvailable()); // If passive provider is enabled

    promise.resolve(map);
  }

  // Start Compass Module

  @ExpoMethod
  public void watchDeviceHeading(final int watchId, final Promise promise) {
    mSensorManager = (SensorManager) mContext.getSystemService(Context.SENSOR_SERVICE);
    this.mHeadingId = watchId;
    startHeadingUpdate();
    promise.resolve(null);
  }

  public void startHeadingUpdate() {
    if (mSensorManager == null || mContext == null) {
      return;
    }

    SmartLocation.LocationControl locationControl = SmartLocation.with(mContext).location().oneFix().config(LocationParams.BEST_EFFORT);
    Location currLoc = locationControl.getLastLocation();
    if (currLoc != null) {
      mGeofield = new GeomagneticField(
          (float) currLoc.getLatitude(),
          (float) currLoc.getLongitude(),
          (float) currLoc.getAltitude(),
          System.currentTimeMillis());
    } else {
      locationControl.start(new OnLocationUpdatedListener() {
        @Override
        public void onLocationUpdated(Location location) {
          mGeofield = new GeomagneticField(
              (float) location.getLatitude(),
              (float) location.getLongitude(),
              (float) location.getAltitude(),
              System.currentTimeMillis());
        }
      });
    }
    mSensorManager.registerListener(this, mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD),
        SensorManager.SENSOR_DELAY_NORMAL);
    mSensorManager.registerListener(this, mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER), SensorManager.SENSOR_DELAY_NORMAL);
  }

  public void onSensorChanged(SensorEvent event) {
    if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER)
      mGravity = event.values;
    if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD)
      mGeomagnetic = event.values;
    if (mGravity != null && mGeomagnetic != null) {
      sendUpdate();
    }
  }

  private void sendUpdate() {
    float R[] = new float[9];
    float I[] = new float[9];
    boolean success = SensorManager.getRotationMatrix(R, I, mGravity, mGeomagnetic);

    if (success) {
      float orientation[] = new float[3];
      SensorManager.getOrientation(R, orientation);

      // Make sure Delta is big enough to warrant an update
      // Currently: 50ms and ~2 degrees of change (android has a lot of useless updates block up the sending)
      if ((Math.abs(orientation[0] - mLastAzimut)) > DEGREE_DELTA && (System.currentTimeMillis() - mLastUpdate) > TIME_DELTA) {
        mLastAzimut = orientation[0];
        mLastUpdate = System.currentTimeMillis();
        float magneticNorth = calcMagNorth(orientation[0]);
        float trueNorth = calcTrueNorth(magneticNorth);

        // Write data to send back to React
        Bundle response = new Bundle();
        Bundle heading = new Bundle();

        response.putInt("watchId", mHeadingId);

        heading.putDouble("trueHeading", trueNorth);
        heading.putDouble("magHeading", magneticNorth);
        heading.putInt("accuracy", mAccuracy);
        response.putBundle("heading", heading);

        mEventEmitter.emit("Exponent.headingChanged", response);
      }
    }
  }

  private float calcMagNorth(float azimut) {
    float azimutDeg = (float) Math.toDegrees(azimut);
    return (azimutDeg + 360) % 360;
  }

  private float calcTrueNorth(float magNorth) {
    // Need to request geo location info to calculate true north
    if (isMissingPermissions() || mGeofield == null) {
      return -1;
    }
    return magNorth + mGeofield.getDeclination();
  }

  private void stopHeadingWatch() {
    if (mSensorManager == null) {
      return;
    }
    mSensorManager.unregisterListener(this);
  }

  private void destroyHeadingWatch() {
    stopHeadingWatch();
    mSensorManager = null;
    mGravity = null;
    mGeomagnetic = null;
    mGeofield = null;
    mHeadingId = 0;
    mLastAzimut = 0;
    mAccuracy = 0;
  }

  // Android returns 4 different values for accuracy
  // 3: high accuracy, 2: medium, 1: low, 0: none
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
    mAccuracy = accuracy;
  }
  // End Compass

  // TODO: Stop sending watchId from JS since we ignore it.
  @ExpoMethod
  public void watchPositionImplAsync(final int watchId, final Map<String, Object> options, final Promise promise) {
    // Read options
    final boolean highAccuracy = options.containsKey("enableHighAccuracy") && (Boolean) options.get("enableHighAccuracy");
    final double timeInterval = options.containsKey("timeInterval") ? (double) options.get("timeInterval") : 1000;
    final double distanceInterval = options.containsKey("distanceInterval") ? (double) options.get("distanceInterval") : 100;

    // Check for permissions
    if (isMissingPermissions()) {
      promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services");
      return;
    }

    mLocationParams = (new LocationParams.Builder()).setAccuracy(highAccuracy ? LocationAccuracy.HIGH : LocationAccuracy.MEDIUM).setDistance((float) distanceInterval).setInterval((long) timeInterval).build();
    mOnLocationUpdatedListener = new OnLocationUpdatedListener() {
      @Override
      public void onLocationUpdated(Location location) {
        Bundle response = new Bundle();
        response.putInt("watchId", watchId);
        response.putBundle("location", locationToMap(location));

        mEventEmitter.emit("Exponent.locationChanged", response);
      }
    };

    if (startWatching()) {
      promise.resolve(null);
    } else {
      promise.reject("E_LOCATION_SERVICES_DISABLED", "Location services are disabled");
    }
  }

  // TODO: Stop sending watchId from JS since we ignore it.
  @ExpoMethod
  public void removeWatchAsync(final int watchId, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services");
      return;
    }

    // Check if we want to stop watching location or compass
    if (watchId == mHeadingId) {
      destroyHeadingWatch();
    } else {
      stopWatching();
      mLocationParams = null;
      mOnLocationUpdatedListener = null;
    }

    promise.resolve(null);
  }

  @ExpoMethod
  public void geocodeAsync(final String address, final Promise promise) {
    if (mGeocoderPaused) {
      promise.reject("E_CANNOT_GEOCODE", "Geocoder is not running.");
      return;
    }

    if (isMissingPermissions()) {
      promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services.");
      return;
    }

    if (Geocoder.isPresent()) {
      SmartLocation.with(mContext).geocoding()
          .direct(address, new OnGeocodingListener() {
            @Override
            public void onLocationResolved(String s, List<LocationAddress> list) {
              List<Bundle> results = new ArrayList<>(list.size());

              for (LocationAddress locationAddress : list) {
                Bundle coords = new Bundle();
                Location location = locationAddress.getLocation();

                coords.putDouble("latitude", location.getLatitude());
                coords.putDouble("longitude", location.getLongitude());
                coords.putDouble("altitude", location.getAltitude());
                coords.putDouble("accuracy", location.getAccuracy());
                results.add(coords);
              }

              SmartLocation.with(mContext).geocoding().stop();
              promise.resolve(results);
            }
          });
    } else {
      promise.reject("E_NO_GEOCODER", "Geocoder service is not available for this device.");
    }
  }

  @ExpoMethod
  public void reverseGeocodeAsync(final Map<String, Object> locationMap, final Promise promise) {
    if (mGeocoderPaused) {
      promise.reject("E_CANNOT_GEOCODE", "Geocoder is not running.");
      return;
    }

    if (isMissingPermissions()) {
      promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services.");
      return;
    }

    Location location = new Location("");
    location.setLatitude((double) locationMap.get("latitude"));
    location.setLongitude((double) locationMap.get("longitude"));

    if (Geocoder.isPresent()) {
      SmartLocation.with(mContext).geocoding()
          .reverse(location, new OnReverseGeocodingListener() {
            @Override
            public void onAddressResolved(Location original, List<Address> addresses) {
              List<Bundle> results = new ArrayList<>(addresses.size());

              for (Address address : addresses) {
                results.add(addressToMap(address));
              }

              SmartLocation.with(mContext).geocoding().stop();
              promise.resolve(results);
            }
          });
    } else {
      promise.reject("E_NO_GEOCODER", "Geocoder service is not available for this device.");
    }
  }

  @ExpoMethod
  public void requestPermissionsAsync(final Promise promise) {
    if (mPermissions == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }

    mPermissions.askForPermissions(
        new String[] {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        },
        new Permissions.PermissionsRequestListener() {
          @Override
          public void onPermissionsResult(int[] results) {
            for (int result : results) {
              // we need at least one of asked permissions to be granted
              if (result == PackageManager.PERMISSION_GRANTED) {
                promise.resolve(null);
                return;
              }
            }
            promise.reject("E_LOCATION_UNAUTHORIZED", "Not authorized to use location services");
          }
        });
  }

  // App lifecycle listeners

  @Override
  public void onHostResume() {
    startWatching();
    startHeadingUpdate();
  }

  @Override
  public void onHostPause() {
    stopWatching();
    stopHeadingWatch();
  }

  @Override
  public void onHostDestroy() {
    stopWatching();
    stopHeadingWatch();
  }
}
