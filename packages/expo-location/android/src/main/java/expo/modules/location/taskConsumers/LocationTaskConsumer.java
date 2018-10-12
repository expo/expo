package expo.modules.location.taskConsumers;

import android.app.PendingIntent;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.util.Log;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import expo.interfaces.taskManager.TaskConsumer;
import expo.interfaces.taskManager.TaskExecutionCallback;
import expo.interfaces.taskManager.TaskManagerUtilsInterface;
import expo.interfaces.taskManager.TaskConsumerInterface;
import expo.interfaces.taskManager.TaskInterface;
import expo.modules.location.LocationModule;
import io.nlopez.smartlocation.location.config.LocationParams;

public class LocationTaskConsumer extends TaskConsumer implements TaskConsumerInterface {
  private static final String TAG = "LocationTaskConsumer";

  private TaskInterface mTask;
  private PendingIntent mPendingIntent;
  private LocationRequest mLocationRequest;
  private FusedLocationProviderClient mLocationClient;

  public LocationTaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    super(context, taskManagerUtils);
  }

  //region TaskConsumerInterface

  public void didRegister(TaskInterface task) {
    Context context = getContext();

    if (context == null) {
      Log.w(TAG, "The context has been abandoned.");
      return;
    }
    if (!isAnyProviderAvailable()) {
      Log.w(TAG, "There is no location provider available.");
      return;
    }

    mTask = task;
    mLocationRequest = prepareLocationRequest();
    mPendingIntent = preparePendingIntent();

    try {
      mLocationClient = LocationServices.getFusedLocationProviderClient(context);
      mLocationClient.requestLocationUpdates(mLocationRequest, mPendingIntent);
    } catch (SecurityException e) {
      Log.w(TAG, "Location request has been rejected.", e);
    }
  }

  public void didUnregister() {
    if (mLocationClient != null && mPendingIntent != null) {
      mLocationClient.removeLocationUpdates(mPendingIntent);
      mPendingIntent.cancel();
    }
    mTask = null;
    mPendingIntent = null;
    mLocationRequest = null;
    mLocationClient = null;
  }

  public void didReceiveBroadcast(Intent intent) {
    if (mTask == null) {
      return;
    }

    LocationResult result = LocationResult.extractResult(intent);

    if (result != null) {
      List<Location> locations = result.getLocations();
      PersistableBundle data = new PersistableBundle();

      for (int i = 0; i < locations.size(); i++) {
        Location location = locations.get(i);
        PersistableBundle bundle = LocationModule.locationToBundle(location, PersistableBundle.class);
        data.putPersistableBundle(Integer.valueOf(i).toString(), bundle);
      }

      data.putInt("length", locations.size());

      Context context = getContext().getApplicationContext();
      getTaskManagerUtils().scheduleJob(context, mTask, data);
    }
  }

  @Override
  public boolean didExecuteJob(final JobService jobService, final JobParameters params) {
    PersistableBundle data = params.getExtras().getPersistableBundle("data");
    Bundle bundleData = new Bundle();
    ArrayList<Bundle> locationBundles = new ArrayList<>();

    Integer length = data.getInt("length", 0);

    for (int i = 0; i < length; i++) {
      PersistableBundle persistableLocationBundle = data.getPersistableBundle(String.valueOf(i));
      Bundle locationBundle = new Bundle();
      Bundle coordsBundle = new Bundle();

      coordsBundle.putAll(persistableLocationBundle.getPersistableBundle("coords"));
      locationBundle.putAll(persistableLocationBundle);
      locationBundle.putBundle("coords", coordsBundle);

      locationBundles.add(locationBundle);
    }

    bundleData.putParcelableArrayList("locations", locationBundles);

    Log.i("Expo", "Executing task...");
    mTask.execute(bundleData, null, new TaskExecutionCallback() {
      @Override
      public void onFinished(Map<String, Object> response) {
        Log.i("Expo", "Job finished");
        jobService.jobFinished(params, false);
      }
    });

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true;
  }

  //region private

  private LocationRequest prepareLocationRequest() {
    Map<String, Object> options = mTask.getOptions();
    LocationParams locationParams = LocationModule.mapOptionsToLocationParams(options);

    String accuracy = options.containsKey("accuracy")
        ? (String) options.get("accuracy")
        : LocationModule.ACCURACY_BALANCED;

    return new LocationRequest()
        .setFastestInterval(locationParams.getInterval())
        .setInterval(locationParams.getInterval())
        .setSmallestDisplacement(locationParams.getDistance())
        .setPriority(mapAccuracyToPriority(accuracy));
  }

  private PendingIntent preparePendingIntent() {
    return getTaskManagerUtils().createTaskIntent(getContext(), mTask);
  }

  private int mapAccuracyToPriority(String accuracy) {
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

  private boolean isAnyProviderAvailable() {
    Context context = getContext();

    if (context == null) {
      return false;
    }

    LocationManager locationManager = (LocationManager)context.getSystemService(Context.LOCATION_SERVICE);
    return locationManager.isProviderEnabled("gps") || locationManager.isProviderEnabled("network");
  }

  //endregion
}
