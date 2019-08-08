package expo.modules.location;

import android.content.Context;
import android.location.Address;
import android.location.Location;
import android.location.LocationManager;
import android.os.BaseBundle;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.util.Log;

import com.google.android.gms.location.LocationRequest;

import java.util.Map;

import org.unimodules.core.Promise;
import org.unimodules.core.errors.CodedException;
import expo.modules.location.utils.TimeoutObject;
import io.nlopez.smartlocation.location.config.LocationAccuracy;
import io.nlopez.smartlocation.location.config.LocationParams;

import static expo.modules.location.LocationModule.*;

public class LocationHelpers {
  private static final String TAG = LocationHelpers.class.getSimpleName();

  //region public methods

  public static boolean isAnyProviderAvailable(Context context) {
    if (context == null) {
      return false;
    }
    LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
    return locationManager != null && (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER));
  }

  public static boolean hasNetworkProviderEnabled(Context context) {
    if (context == null) {
      return false;
    }
    LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
    return locationManager != null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
  }

  public static <BundleType extends BaseBundle> BundleType locationToBundle(Location location, Class<BundleType> bundleTypeClass) {
    try {
      BundleType map = bundleTypeClass.newInstance();
      BundleType coords = locationToCoordsBundle(location, bundleTypeClass);

      if (coords == null) {
        return null;
      }
      if (map instanceof PersistableBundle) {
        ((PersistableBundle) map).putPersistableBundle("coords", (PersistableBundle) coords);
      } else if (map instanceof Bundle) {
        ((Bundle) map).putBundle("coords", (Bundle) coords);
        ((Bundle) map).putBoolean("mocked", location.isFromMockProvider());
      }
      map.putDouble("timestamp", location.getTime());

      return map;
    } catch (IllegalAccessException | InstantiationException e) {
      Log.e(TAG, "Unexpected exception was thrown when converting location to the bundle: " + e.toString());
      return null;
    }
  }

  static <BundleType extends BaseBundle> BundleType locationToCoordsBundle(Location location, Class<BundleType> bundleTypeClass) {
    try {
      BundleType coords = bundleTypeClass.newInstance();

      coords.putDouble("latitude", location.getLatitude());
      coords.putDouble("longitude", location.getLongitude());
      coords.putDouble("altitude", location.getAltitude());
      coords.putDouble("accuracy", location.getAccuracy());
      coords.putDouble("heading", location.getBearing());
      coords.putDouble("speed", location.getSpeed());

      return coords;
    } catch (IllegalAccessException | InstantiationException e) {
      Log.e(TAG, "Unexpected exception was thrown when converting location to coords bundle: " + e.toString());
      return null;
    }
  }

  static Bundle addressToBundle(Address address) {
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

  static Bundle headingToBundle(double trueNorth, double magneticNorth, int accuracy) {
    Bundle heading = new Bundle();

    heading.putDouble("trueHeading", trueNorth);
    heading.putDouble("magHeading", magneticNorth);
    heading.putInt("accuracy", accuracy);

    return heading;
  }

  public static LocationRequest prepareLocationRequest(Map<String, Object> options) {
    LocationParams locationParams = LocationHelpers.mapOptionsToLocationParams(options);
    int accuracy = LocationHelpers.getAccuracyFromOptions(options);

    return new LocationRequest()
        .setFastestInterval(locationParams.getInterval())
        .setInterval(locationParams.getInterval())
        .setMaxWaitTime(locationParams.getInterval())
        .setSmallestDisplacement(locationParams.getDistance())
        .setPriority(mapAccuracyToPriority(accuracy));
  }

  public static LocationParams mapOptionsToLocationParams(Map<String, Object> options) {
    int accuracy = getAccuracyFromOptions(options);

    LocationParams.Builder locationParamsBuilder = buildLocationParamsForAccuracy(accuracy);

    if (options.containsKey("timeInterval")) {
      Number timeInterval = (Number) options.get("timeInterval");
      locationParamsBuilder.setInterval(timeInterval.longValue());
    }
    if (options.containsKey("distanceInterval")) {
      Number distanceInterval = (Number) options.get("distanceInterval");
      locationParamsBuilder.setDistance(distanceInterval.floatValue());
    }
    return locationParamsBuilder.build();
  }

  static void requestSingleLocation(final LocationModule locationModule, final LocationRequest locationRequest, final TimeoutObject timeoutObject, final Promise promise) {
    // we want just one update
    locationRequest.setNumUpdates(1);

    locationModule.requestLocationUpdates(locationRequest, null, new LocationRequestCallbacks() {
      @Override
      public void onLocationChanged(Location location) {
        if (timeoutObject.markDoneIfNotTimedOut()) {
          promise.resolve(LocationHelpers.locationToBundle(location, Bundle.class));
        }
      }

      @Override
      public void onLocationError(CodedException exception) {
        if (timeoutObject.markDoneIfNotTimedOut()) {
          promise.reject(exception);
        }
      }

      @Override
      public void onRequestFailed(CodedException exception) {
        if (timeoutObject.markDoneIfNotTimedOut()) {
          promise.reject(exception);
        }
      }
    });
  }

  static void requestContinuousUpdates(final LocationModule locationModule, final LocationRequest locationRequest, final int watchId, final Promise promise) {
    locationModule.requestLocationUpdates(locationRequest, watchId, new LocationRequestCallbacks() {
      @Override
      public void onLocationChanged(Location location) {
        Bundle response = new Bundle();

        response.putBundle("location", LocationHelpers.locationToBundle(location, Bundle.class));
        locationModule.sendLocationResponse(watchId, response);
      }

      @Override
      public void onRequestSuccess() {
        promise.resolve(null);
      }

      @Override
      public void onRequestFailed(CodedException exception) {
        promise.reject(exception);
      }
    });
  }

  //endregion
  //region private methods

  private static int getAccuracyFromOptions(Map<String, Object> options) {
    // (2018-12): `enableHighAccuracy` is deprecated - use `accuracy` instead.
    // However, don't remove that option as it must be still supported in navigator.geolocation polyfills.
    boolean highAccuracy = options.containsKey("enableHighAccuracy") && (Boolean) options.get("enableHighAccuracy");

    return options.containsKey("accuracy")
        ? ((Number) options.get("accuracy")).intValue()
        : highAccuracy ? ACCURACY_HIGH : ACCURACY_BALANCED;
  }
  private static LocationParams.Builder buildLocationParamsForAccuracy(int accuracy) {
    switch (accuracy) {
      case ACCURACY_LOWEST:
        return new LocationParams.Builder()
            .setAccuracy(LocationAccuracy.LOWEST)
            .setDistance(3000)
            .setInterval(10000);
      case ACCURACY_LOW:
        return new LocationParams.Builder()
            .setAccuracy(LocationAccuracy.LOW)
            .setDistance(1000)
            .setInterval(5000);
      case ACCURACY_BALANCED:
      default:
        return new LocationParams.Builder()
            .setAccuracy(LocationAccuracy.MEDIUM)
            .setDistance(100)
            .setInterval(3000);
      case ACCURACY_HIGH:
        return new LocationParams.Builder()
            .setAccuracy(LocationAccuracy.HIGH)
            .setDistance(50)
            .setInterval(2000);
      case ACCURACY_HIGHEST:
        return new LocationParams.Builder()
            .setAccuracy(LocationAccuracy.HIGH)
            .setDistance(25)
            .setInterval(1000);
      case ACCURACY_BEST_FOR_NAVIGATION:
        return new LocationParams.Builder()
            .setAccuracy(LocationAccuracy.HIGH)
            .setDistance(0)
            .setInterval(500);
    }
  }

  private static int mapAccuracyToPriority(int accuracy) {
    switch (accuracy) {
      case LocationModule.ACCURACY_BEST_FOR_NAVIGATION:
      case LocationModule.ACCURACY_HIGHEST:
      case LocationModule.ACCURACY_HIGH:
        return LocationRequest.PRIORITY_HIGH_ACCURACY;
      case LocationModule.ACCURACY_BALANCED:
      default:
        return LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY;
      case LocationModule.ACCURACY_LOW:
        return LocationRequest.PRIORITY_LOW_POWER;
      case LocationModule.ACCURACY_LOWEST:
        return LocationRequest.PRIORITY_NO_POWER;
    }
  }

  //endregion
}
