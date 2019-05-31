// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.location;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
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
import android.os.Looper;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationAvailability;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.interfaces.permissions.Permissions;
import org.unimodules.interfaces.taskManager.TaskManagerInterface;
import expo.modules.location.exceptions.LocationRequestRejectedException;
import expo.modules.location.exceptions.LocationRequestTimeoutException;
import expo.modules.location.exceptions.LocationSettingsUnsatisfiedException;
import expo.modules.location.exceptions.LocationUnauthorizedException;
import expo.modules.location.exceptions.LocationUnavailableException;
import expo.modules.location.taskConsumers.GeofencingTaskConsumer;
import expo.modules.location.taskConsumers.LocationTaskConsumer;
import expo.modules.location.utils.TimeoutObject;
import io.nlopez.smartlocation.OnGeocodingListener;
import io.nlopez.smartlocation.OnLocationUpdatedListener;
import io.nlopez.smartlocation.OnReverseGeocodingListener;
import io.nlopez.smartlocation.SmartLocation;
import io.nlopez.smartlocation.geocoding.utils.LocationAddress;
import io.nlopez.smartlocation.location.config.LocationParams;
import io.nlopez.smartlocation.location.utils.LocationState;

public class LocationModule extends ExportedModule implements ModuleRegistryConsumer, LifecycleEventListener, SensorEventListener, ActivityEventListener {
  private static final String TAG = LocationModule.class.getSimpleName();
  private static final String LOCATION_EVENT_NAME = "Expo.locationChanged";
  private static final String HEADING_EVENT_NAME = "Expo.headingChanged";
  private static final int CHECK_SETTINGS_REQUEST_CODE = 42;

  private static final String SHOW_USER_SETTINGS_DIALOG_KEY = "mayShowUserSettingsDialog";

  public static final int ACCURACY_LOWEST = 1;
  public static final int ACCURACY_LOW = 2;
  public static final int ACCURACY_BALANCED = 3;
  public static final int ACCURACY_HIGH = 4;
  public static final int ACCURACY_HIGHEST = 5;
  public static final int ACCURACY_BEST_FOR_NAVIGATION = 6;

  public static final int GEOFENCING_EVENT_ENTER = 1;
  public static final int GEOFENCING_EVENT_EXIT = 2;

  public static final int GEOFENCING_REGION_STATE_UNKNOWN = 0;
  public static final int GEOFENCING_REGION_STATE_INSIDE = 1;
  public static final int GEOFENCING_REGION_STATE_OUTSIDE = 2;

  private Context mContext;
  private SensorManager mSensorManager;
  private GeomagneticField mGeofield;

  private Map<Integer, LocationCallback> mLocationCallbacks = new HashMap<>();
  private Map<Integer, LocationRequest> mLocationRequests = new HashMap<>();
  private List<LocationActivityResultListener> mPendingLocationRequests = new ArrayList<>();

  // modules
  private EventEmitter mEventEmitter;
  private UIManager mUIManager;
  private Permissions mPermissions;
  private TaskManagerInterface mTaskManager;
  private ActivityProvider mActivityProvider;

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
    mTaskManager = moduleRegistry.getModule(TaskManagerInterface.class);
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);

    if (mUIManager != null) {
      mUIManager.registerLifecycleEventListener(this);
    }
  }

  //region Expo methods

  @ExpoMethod
  public void getCurrentPositionAsync(final Map<String, Object> options, final Promise promise) {
    // Read options
    final Long timeout = options.containsKey("timeout") ? ((Double) options.get("timeout")).longValue() : null;
    final LocationRequest locationRequest = LocationHelpers.prepareLocationRequest(options);
    boolean showUserSettingsDialog = !options.containsKey(SHOW_USER_SETTINGS_DIALOG_KEY) || (boolean) options.get(SHOW_USER_SETTINGS_DIALOG_KEY);

    // Check for permissions
    if (isMissingPermissions()) {
      promise.reject(new LocationUnauthorizedException());
      return;
    }

    final TimeoutObject timeoutObject = new TimeoutObject(timeout);
    timeoutObject.onTimeout(new TimeoutObject.TimeoutListener() {
      @Override
      public void onTimeout() {
        promise.reject(new LocationRequestTimeoutException());
      }
    });
    timeoutObject.start();

    // Have location cached already?
    if (options.containsKey("maximumAge")) {
      final Double maximumAge = (Double) options.get("maximumAge");

      getLastKnownLocation(maximumAge, new OnSuccessListener<Location>() {
        @Override
        public void onSuccess(Location location) {
          if (location != null) {
            promise.resolve(LocationHelpers.locationToBundle(location, Bundle.class));
            timeoutObject.markDoneIfNotTimedOut();
          }
        }
      });
    }

    if (LocationHelpers.hasNetworkProviderEnabled(mContext) || !showUserSettingsDialog) {
      LocationHelpers.requestSingleLocation(this, locationRequest, timeoutObject, promise);
    } else {
      // Pending requests can ask the user to turn on improved accuracy mode in user's settings.
      addPendingLocationRequest(locationRequest, new LocationActivityResultListener() {
        @Override
        public void onResult(int resultCode) {
          if (resultCode == Activity.RESULT_OK) {
            LocationHelpers.requestSingleLocation(LocationModule.this, locationRequest, timeoutObject, promise);
          } else {
            promise.reject(new LocationSettingsUnsatisfiedException());
          }
        }
      });
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
    map.putBoolean("backgroundModeEnabled", state.locationServicesEnabled()); // background mode is always available if location services are on

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

  @ExpoMethod
  public void watchPositionImplAsync(final int watchId, final Map<String, Object> options, final Promise promise) {
    // Check for permissions
    if (isMissingPermissions()) {
      promise.reject(new LocationUnauthorizedException());
      return;
    }

    final LocationRequest locationRequest = LocationHelpers.prepareLocationRequest(options);
    boolean showUserSettingsDialog = !options.containsKey(SHOW_USER_SETTINGS_DIALOG_KEY) || (boolean) options.get(SHOW_USER_SETTINGS_DIALOG_KEY);

    if (LocationHelpers.hasNetworkProviderEnabled(mContext) || !showUserSettingsDialog) {
      LocationHelpers.requestContinuousUpdates(this, locationRequest, watchId, promise);
    } else {
      // Pending requests can ask the user to turn on improved accuracy mode in user's settings.
      addPendingLocationRequest(locationRequest, new LocationActivityResultListener() {
        @Override
        public void onResult(int resultCode) {
          if (resultCode == Activity.RESULT_OK) {
            LocationHelpers.requestContinuousUpdates(LocationModule.this, locationRequest, watchId, promise);
          } else {
            promise.reject(new LocationSettingsUnsatisfiedException());
          }
        }
      });
    }
  }

  @ExpoMethod
  public void removeWatchAsync(final int watchId, final Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(new LocationUnauthorizedException());
      return;
    }

    // Check if we want to stop watching location or compass
    if (watchId == mHeadingId) {
      destroyHeadingWatch();
    } else {
      removeLocationUpdatesForRequest(watchId);
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
      promise.reject(new LocationUnauthorizedException());
      return;
    }

    if (Geocoder.isPresent()) {
      SmartLocation.with(mContext).geocoding()
          .direct(address, new OnGeocodingListener() {
            @Override
            public void onLocationResolved(String s, List<LocationAddress> list) {
              List<Bundle> results = new ArrayList<>(list.size());

              for (LocationAddress locationAddress : list) {
                Bundle coords = LocationHelpers.locationToCoordsBundle(locationAddress.getLocation(), Bundle.class);

                if (coords != null) {
                  results.add(coords);
                }
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
      promise.reject(new LocationUnauthorizedException());
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
                results.add(LocationHelpers.addressToBundle(address));
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
            promise.reject(new LocationUnauthorizedException());
          }
        });
  }

  @ExpoMethod
  public void enableNetworkProviderAsync(final Promise promise) {
    if (LocationHelpers.hasNetworkProviderEnabled(mContext)) {
      promise.resolve(null);
      return;
    }

    LocationRequest locationRequest = LocationHelpers.prepareLocationRequest(new HashMap<String, Object>());

    addPendingLocationRequest(locationRequest, new LocationActivityResultListener() {
      @Override
      public void onResult(int resultCode) {
        if (resultCode == Activity.RESULT_OK) {
          promise.resolve(null);
        } else {
          promise.reject(new LocationSettingsUnsatisfiedException());
        }
      }
    });
  }

  @ExpoMethod
  public void hasServicesEnabledAsync(final Promise promise) {
    boolean servicesEnabled = LocationHelpers.isAnyProviderAvailable(getContext());
    promise.resolve(servicesEnabled);
  }

  //region Background location

  @ExpoMethod
  public void startLocationUpdatesAsync(String taskName, Map<String, Object> options, final Promise promise) {
    try {
      mTaskManager.registerTask(taskName, LocationTaskConsumer.class, options);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void stopLocationUpdatesAsync(String taskName, final Promise promise) {
    try {
      mTaskManager.unregisterTask(taskName, LocationTaskConsumer.class);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void hasStartedLocationUpdatesAsync(String taskName, final Promise promise) {
    promise.resolve(mTaskManager.taskHasConsumerOfClass(taskName, LocationTaskConsumer.class));
  }

  //endregion Background location
  //region Geofencing

  @ExpoMethod
  public void startGeofencingAsync(String taskName, Map<String, Object> options, final Promise promise) {
    try {
      mTaskManager.registerTask(taskName, GeofencingTaskConsumer.class, options);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void stopGeofencingAsync(String taskName, final Promise promise) {
    try {
      mTaskManager.unregisterTask(taskName, GeofencingTaskConsumer.class);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void hasStartedGeofencingAsync(String taskName, final Promise promise) {
    promise.resolve(mTaskManager.taskHasConsumerOfClass(taskName, GeofencingTaskConsumer.class));
  }

  //endregion Geofencing
  //endregion Expo methods
  //region public methods

  void requestLocationUpdates(final LocationRequest locationRequest, Integer requestId, final LocationRequestCallbacks callbacks) {
    final FusedLocationProviderClient locationClient = LocationServices.getFusedLocationProviderClient(mContext);

    LocationCallback locationCallback = new LocationCallback() {
      @Override
      public void onLocationResult(LocationResult locationResult) {
        Location location = locationResult != null ? locationResult.getLastLocation() : null;

        if (location != null) {
          callbacks.onLocationChanged(location);
        }
      }

      @Override
      public void onLocationAvailability(LocationAvailability locationAvailability) {
        if (!locationAvailability.isLocationAvailable()) {
          callbacks.onLocationError(new LocationUnavailableException());
        }
      }
    };

    if (requestId != null) {
      // Save location callback and request so we will be able to pause/resume receiving updates.
      mLocationCallbacks.put(requestId, locationCallback);
      mLocationRequests.put(requestId, locationRequest);
    }

    try {
      locationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.myLooper());
      callbacks.onRequestSuccess();
    } catch (SecurityException e) {
      callbacks.onRequestFailed(new LocationRequestRejectedException(e));
    }
  }

  //region private methods

  private boolean isMissingPermissions() {
    return mPermissions == null
        || (
        mPermissions.getPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
            && mPermissions.getPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED
    );
  }

  private void getLastKnownLocation(final Double maximumAge, final OnSuccessListener<Location> callback) {
    final FusedLocationProviderClient locationClient = LocationServices.getFusedLocationProviderClient(mContext);

    try {
      locationClient.getLastLocation().addOnSuccessListener(new OnSuccessListener<Location>() {
        @Override
        public void onSuccess(Location location) {
          if (location != null && (maximumAge == null || System.currentTimeMillis() - location.getTime() < maximumAge)) {
            callback.onSuccess(location);
          } else {
            callback.onSuccess(null);
          }
        }
      });
    } catch (SecurityException e) {
      callback.onSuccess(null);
    }
  }

  private void addPendingLocationRequest(LocationRequest locationRequest, LocationActivityResultListener listener) {
    // Add activity result listener to an array of pending requests.
    mPendingLocationRequests.add(listener);

    // If it's the first pending request, let's ask the user to turn on high accuracy location.
    if (mPendingLocationRequests.size() == 1) {
      resolveUserSettingsForRequest(locationRequest);
    }
  }

  private void resolveUserSettingsForRequest(LocationRequest locationRequest) {
    final Activity activity = mActivityProvider.getCurrentActivity();

    if (activity == null) {
      // Activity not found. It could have been called in a headless mode.
      executePendingRequests(Activity.RESULT_CANCELED);
      return;
    }

    LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder().addLocationRequest(locationRequest);
    SettingsClient client = LocationServices.getSettingsClient(mContext);
    Task<LocationSettingsResponse> task = client.checkLocationSettings(builder.build());

    task.addOnSuccessListener(new OnSuccessListener<LocationSettingsResponse>() {
      @Override
      public void onSuccess(LocationSettingsResponse locationSettingsResponse) {
        // All location settings requirements are satisfied.
        executePendingRequests(Activity.RESULT_OK);
      }
    });

    task.addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(@NonNull Exception e) {
        int statusCode = ((ApiException) e).getStatusCode();

        switch (statusCode) {
          case CommonStatusCodes.RESOLUTION_REQUIRED:
            // Location settings are not satisfied, but this can be fixed by showing the user a dialog.
            // Show the dialog by calling startResolutionForResult(), and check the result in onActivityResult().

            try {
              ResolvableApiException resolvable = (ResolvableApiException) e;

              mUIManager.registerActivityEventListener(LocationModule.this);
              resolvable.startResolutionForResult(activity, CHECK_SETTINGS_REQUEST_CODE);
            } catch (IntentSender.SendIntentException sendEx) {
              // Ignore the error.
              executePendingRequests(Activity.RESULT_CANCELED);
            }
            break;
          default:
            // Location settings are not satisfied. However, we have no way to fix the settings so we won't show the dialog.
            executePendingRequests(Activity.RESULT_CANCELED);
            break;
        }
      }
    });
  }

  private void pauseLocationUpdatesForRequest(Integer requestId) {
    final FusedLocationProviderClient locationClient = LocationServices.getFusedLocationProviderClient(mContext);

    if (mLocationCallbacks.containsKey(requestId)) {
      LocationCallback locationCallback = mLocationCallbacks.get(requestId);
      locationClient.removeLocationUpdates(locationCallback);
    }
  }

  private void resumeLocationUpdates() {
    final FusedLocationProviderClient locationClient = LocationServices.getFusedLocationProviderClient(mContext);

    for (Integer requestId : mLocationCallbacks.keySet()) {
      LocationCallback locationCallback = mLocationCallbacks.get(requestId);
      LocationRequest locationRequest = mLocationRequests.get(requestId);

      if (locationCallback != null && locationRequest != null) {
        try {
          locationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.myLooper());
        } catch (SecurityException e) {
          Log.e(TAG, "Error occurred while resuming location updates: " + e.toString());
        }
      }
    }
  }

  private void removeLocationUpdatesForRequest(Integer requestId) {
    pauseLocationUpdatesForRequest(requestId);
    mLocationCallbacks.remove(requestId);
    mLocationRequests.remove(requestId);
  }

  void sendLocationResponse(int watchId, Bundle response) {
    response.putInt("watchId", watchId);
    mEventEmitter.emit(LOCATION_EVENT_NAME, response);
  }

  private void executePendingRequests(int resultCode) {
    // Propagate result to pending location requests.
    for (LocationActivityResultListener listener : mPendingLocationRequests) {
      listener.onResult(resultCode);
    }
    mPendingLocationRequests.clear();
  }

  private void startHeadingUpdate() {
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
        Bundle heading = LocationHelpers.headingToBundle(trueNorth, magneticNorth, mAccuracy);

        response.putInt("watchId", mHeadingId);
        response.putBundle("heading", heading);

        mEventEmitter.emit(HEADING_EVENT_NAME, response);
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

  private void startWatching() {
    if (mContext == null) {
      return;
    }

    // if permissions not granted it won't work anyway, but this can be invoked when permission dialog disappears
    if (!isMissingPermissions()) {
      mGeocoderPaused = false;
    }

    // Resume paused location updates
    resumeLocationUpdates();
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

    for (Integer requestId : mLocationCallbacks.keySet()) {
      pauseLocationUpdatesForRequest(requestId);
    }
  }

  //endregion
  //region SensorEventListener

  public void onSensorChanged(SensorEvent event) {
    if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
      mGravity = event.values;
    } else if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
      mGeomagnetic = event.values;
    }
    if (mGravity != null && mGeomagnetic != null) {
      sendUpdate();
    }
  }

  // Android returns 4 different values for accuracy
  // 3: high accuracy, 2: medium, 1: low, 0: none
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
    mAccuracy = accuracy;
  }

  //endregion
  //region ActivityEventListener

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (requestCode != CHECK_SETTINGS_REQUEST_CODE) {
      return;
    }
    executePendingRequests(resultCode);
    mUIManager.unregisterActivityEventListener(this);
  }

  @Override
  public void onNewIntent(Intent intent) {}

  //endregion
  //region LifecycleEventListener

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

  //endregion
}
