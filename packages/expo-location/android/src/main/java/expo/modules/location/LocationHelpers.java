package expo.modules.location;

import android.content.Context;
import android.location.LocationManager;

import com.google.android.gms.location.LocationRequest;

import java.util.Map;

import io.nlopez.smartlocation.location.config.LocationAccuracy;
import io.nlopez.smartlocation.location.config.LocationParams;

import static expo.modules.location.LocationModule.*;

public class LocationHelpers {
  public static boolean isAnyProviderAvailable(Context context) {
    if (context == null) {
      return false;
    }
    LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
    return locationManager != null && (locationManager.isProviderEnabled("gps") || locationManager.isProviderEnabled("network"));
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

  public static int getAccuracyFromOptions(Map<String, Object> options) {
    // (2018-12): `enableHighAccuracy` is deprecated - use `accuracy` instead
    boolean highAccuracy = options.containsKey("enableHighAccuracy") && (Boolean) options.get("enableHighAccuracy");

    return options.containsKey("accuracy")
        ? ((Number) options.get("accuracy")).intValue()
        : highAccuracy ? ACCURACY_HIGH : ACCURACY_BALANCED;
  }

  public static LocationRequest prepareLocationRequest(Map<String, Object> options) {
    LocationParams locationParams = LocationHelpers.mapOptionsToLocationParams(options);
    int accuracy = LocationHelpers.getAccuracyFromOptions(options);

    return new LocationRequest()
        .setFastestInterval(locationParams.getInterval())
        .setInterval(locationParams.getInterval())
        .setSmallestDisplacement(locationParams.getDistance())
        .setPriority(mapAccuracyToPriority(accuracy));
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
}
