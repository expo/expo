package expo.modules.location.taskConsumers;

import android.app.PendingIntent;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.unimodules.core.MapHelper;
import org.unimodules.core.interfaces.Arguments;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.interfaces.taskManager.TaskConsumer;
import org.unimodules.interfaces.taskManager.TaskExecutionCallback;
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface;
import org.unimodules.interfaces.taskManager.TaskConsumerInterface;
import org.unimodules.interfaces.taskManager.TaskInterface;

import expo.modules.location.LocationHelpers;

public class LocationTaskConsumer extends TaskConsumer implements TaskConsumerInterface, LifecycleEventListener {
  private static final String TAG = "LocationTaskConsumer";
  private static long sLastTimestamp = 0;

  private TaskInterface mTask;
  private PendingIntent mPendingIntent;
  private LocationRequest mLocationRequest;
  private FusedLocationProviderClient mLocationClient;
  private Location mLastReportedLocation;
  private double mDeferredDistance = 0.0;
  private List<Location> mDeferredLocations = new ArrayList<>();
  private boolean mIsHostPaused = true;

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

    // Restart location updates
    stopLocationUpdates();
    startLocationUpdates();
  }

  @Override
  public void didReceiveBroadcast(Intent intent) {
    if (mTask == null) {
      return;
    }

    LocationResult result = LocationResult.extractResult(intent);

    if (result != null) {
      List<Location> locations = result.getLocations();

      deferLocations(locations);
      maybeReportDeferredLocations();
    } else {
      // If there is no result in the intent, let's try to obtain last location from location client.
      try {
        mLocationClient.getLastLocation().addOnCompleteListener(new OnCompleteListener<Location>() {
          @Override
          public void onComplete(@NonNull Task<Location> task) {
            Location location = task.getResult();

            if (location != null) {
              Log.i(TAG, "get last location: " + location);
              deferLocations(Collections.singletonList(location));
              maybeReportDeferredLocations();
            }
          }
        });
      } catch (SecurityException e) {
        Log.e(TAG, "Cannot get last location: " + e.getMessage());
      }
    }
  }

  @Override
  public boolean didExecuteJob(final JobService jobService, final JobParameters params) {
    PersistableBundle data = params.getExtras().getPersistableBundle("data");
    int length = data != null ? data.getInt("length", 0) : 0;
    ArrayList<Bundle> locationBundles = new ArrayList<>();

    for (int i = 0; i < length; i++) {
      PersistableBundle persistableLocationBundle = data.getPersistableBundle(String.valueOf(i));
      Bundle locationBundle = new Bundle();
      Bundle coordsBundle = new Bundle();

      if (persistableLocationBundle != null) {
        coordsBundle.putAll(persistableLocationBundle.getPersistableBundle("coords"));
        locationBundle.putAll(persistableLocationBundle);
        locationBundle.putBundle("coords", coordsBundle);

        locationBundles.add(locationBundle);
      }
    }

    executeTaskWithLocationBundles(locationBundles, new TaskExecutionCallback() {
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

    mLocationRequest = LocationHelpers.prepareLocationRequest(mTask.getOptions());
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

  private void deferLocations(List<Location> locations) {
    int size = mDeferredLocations.size();
    Location lastLocation = size > 0 ? mDeferredLocations.get(size - 1) : mLastReportedLocation;

    for (Location location : locations) {
      if (lastLocation != null) {
        mDeferredDistance += Math.abs(location.distanceTo(lastLocation));
      }
      lastLocation = location;
    }
    mDeferredLocations.addAll(locations);
  }

  private void maybeReportDeferredLocations() {
    if (!shouldReportDeferredLocations()) {
      // Don't report locations yet - continue deferring them.
      return;
    }

    Context context = getContext().getApplicationContext();
    PersistableBundle data = new PersistableBundle();
    int length = 0;

    for (Location location : mDeferredLocations) {
      long timestamp = location.getTime();

      // Some devices may broadcast the same location multiple times (mostly twice) so we're filtering out these locations,
      // so only one location at the specific timestamp can schedule a job.
      if (timestamp > sLastTimestamp) {
        PersistableBundle bundle = LocationHelpers.locationToBundle(location, PersistableBundle.class);
        data.putPersistableBundle(Integer.valueOf(length).toString(), bundle);

        sLastTimestamp = timestamp;
        ++length;
      }
    }

    data.putInt("length", length);

    if (length > 0) {
      // Save last reported location, reset the distance and clear a list of locations.
      mLastReportedLocation = mDeferredLocations.get(mDeferredLocations.size() - 1);
      mDeferredDistance = 0.0;
      mDeferredLocations.clear();

      // Schedule new job.
      getTaskManagerUtils().scheduleJob(context, mTask, data);
    }
  }

  private boolean shouldReportDeferredLocations() {
    if (mDeferredLocations.size() == 0) {
      return false;
    }
    if (!mIsHostPaused) {
      // Don't defer location updates when the activity is in foreground state.
      return true;
    }

    Location oldestLocation = mLastReportedLocation != null ? mLastReportedLocation : mDeferredLocations.get(0);
    Location newestLocation = mDeferredLocations.get(mDeferredLocations.size() - 1);
    Arguments options = new MapHelper(mTask.getOptions());
    double distance = options.getDouble("deferredUpdatesDistance");
    long interval = options.getLong("deferredUpdatesInterval");

    return newestLocation.getTime() - oldestLocation.getTime() >= interval && mDeferredDistance >= distance;
  }

  private PendingIntent preparePendingIntent() {
    return getTaskManagerUtils().createTaskIntent(getContext(), mTask);
  }

  private void executeTaskWithLocationBundles(ArrayList<Bundle> locationBundles, TaskExecutionCallback callback) {
    if (locationBundles.size() > 0) {
      Bundle data = new Bundle();
      data.putParcelableArrayList("locations", locationBundles);
      mTask.execute(data, null, callback);
    } else {
      callback.onFinished(null);
    }
  }

  @Override
  public void onHostResume() {
    mIsHostPaused = false;
    maybeReportDeferredLocations();
  }

  @Override
  public void onHostPause() {
    mIsHostPaused = true;
  }

  @Override
  public void onHostDestroy() {
    mIsHostPaused = true;
  }

  //endregion
}
