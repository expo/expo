package expo.modules.location.taskConsumers;

import android.app.PendingIntent;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
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
import expo.modules.location.LocationHelpers;
import expo.modules.location.LocationModule;
import io.nlopez.smartlocation.location.config.LocationParams;

public class LocationTaskConsumer extends TaskConsumer implements TaskConsumerInterface {
  private static final String TAG = "LocationTaskConsumer";
  private static long sLastTimestamp = 0;

  private TaskInterface mTask;
  private PendingIntent mPendingIntent;
  private LocationRequest mLocationRequest;
  private FusedLocationProviderClient mLocationClient;

  public LocationTaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    super(context, taskManagerUtils);
  }

  //region TaskConsumerInterface

  public String taskType() {
    return "location";
  }

  @Override
  public void didRegister(TaskInterface task) {
    mTask = task;
    startLocationUpdates();
  }

  @Override
  public void didUnregister() {
    stopLocationUpdates();
    mTask = null;
    mPendingIntent = null;
    mLocationRequest = null;
    mLocationClient = null;
  }

  @Override
  public void setOptions(Map<String, Object> options) {
    super.setOptions(options);
    stopLocationUpdates();
    startLocationUpdates();
  }

  @Override
  public void didReceiveBroadcast(Intent intent) {
    if (mTask == null) {
      return;
    }

    Context context = getContext().getApplicationContext();
    LocationResult result = LocationResult.extractResult(intent);

    if (result != null) {
      PersistableBundle data = new PersistableBundle();
      List<Location> locations = result.getLocations();
      int length = 0;

      for (Location location : locations) {
        long timestamp = location.getTime();

        // Some devices may broadcast the same location multiple times (mostly twice) so we're filtering out these locations,
        // so only one location at the specific timestamp can schedule a job.
        if (timestamp > sLastTimestamp) {
          PersistableBundle bundle = LocationModule.locationToBundle(location, PersistableBundle.class);
          data.putPersistableBundle(Integer.valueOf(length).toString(), bundle);

          sLastTimestamp = timestamp;
          ++length;
        }
      }

      data.putInt("length", length);

      if (length > 0) {
        // Schedule new job.
        getTaskManagerUtils().scheduleJob(context, mTask, data);
      }
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

    mTask.execute(bundleData, null, new TaskExecutionCallback() {
      @Override
      public void onFinished(Map<String, Object> response) {
        jobService.jobFinished(params, false);
      }
    });

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true;
  }

  //region private

  private void startLocationUpdates() {
    Context context = getContext();

    if (context == null) {
      Log.w(TAG, "The context has been abandoned.");
      return;
    }
    if (!LocationHelpers.isAnyProviderAvailable(context)) {
      Log.w(TAG, "There is no location provider available.");
      return;
    }

    mLocationRequest = prepareLocationRequest();
    mPendingIntent = preparePendingIntent();

    try {
      mLocationClient = LocationServices.getFusedLocationProviderClient(context);
      mLocationClient.requestLocationUpdates(mLocationRequest, mPendingIntent);
    } catch (SecurityException e) {
      Log.w(TAG, "Location request has been rejected.", e);
    }
  }

  private void stopLocationUpdates() {
    if (mLocationClient != null && mPendingIntent != null) {
      mLocationClient.removeLocationUpdates(mPendingIntent);
      mPendingIntent.cancel();
    }
  }

  private LocationRequest prepareLocationRequest() {
    Map<String, Object> options = mTask.getOptions();
    LocationParams locationParams = LocationHelpers.mapOptionsToLocationParams(options);
    int accuracy = LocationHelpers.getAccuracyFromOptions(options);

    return new LocationRequest()
        .setFastestInterval(locationParams.getInterval())
        .setInterval(locationParams.getInterval())
        .setSmallestDisplacement(locationParams.getDistance())
        .setPriority(mapAccuracyToPriority(accuracy));
  }

  private PendingIntent preparePendingIntent() {
    return getTaskManagerUtils().createTaskIntent(getContext(), mTask);
  }

  private int mapAccuracyToPriority(int accuracy) {
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
