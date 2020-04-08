package expo.modules.location.taskConsumers;

import android.app.PendingIntent;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.util.Log;

import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofenceStatusCodes;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.GeofencingEvent;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationServices;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.unimodules.interfaces.taskManager.TaskConsumer;
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface;
import org.unimodules.interfaces.taskManager.TaskConsumerInterface;
import org.unimodules.interfaces.taskManager.TaskInterface;
import expo.modules.location.LocationHelpers;
import expo.modules.location.LocationModule;

public class GeofencingTaskConsumer extends TaskConsumer implements TaskConsumerInterface {
  public static int VERSION = 1;

  private static final String TAG = "GeofencingTaskConsumer";

  private TaskInterface mTask;
  private PendingIntent mPendingIntent;
  private GeofencingClient mGeofencingClient;
  private GeofencingRequest mGeofencingRequest;
  private List<Geofence> mGeofencingList;
  private Map<String, PersistableBundle> mRegions;

  public GeofencingTaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    super(context, taskManagerUtils);
  }

  //region TaskConsumerInterface

  public String taskType() {
    return "geofencing";
  }

  @Override
  @SuppressWarnings("unchecked")
  public void didRegister(TaskInterface task) {
    if (task == null) {
      return;
    }
    mTask = task;
    startGeofencing();
  }

  @Override
  public void didUnregister() {
    stopGeofencing();
    mTask = null;
    mPendingIntent = null;
    mGeofencingClient = null;
    mGeofencingRequest = null;
    mGeofencingList = null;
  }

  @Override
  public void setOptions(Map<String, Object> options) {
    super.setOptions(options);
    stopGeofencing();
    startGeofencing();
  }

  @Override
  public void didReceiveBroadcast(Intent intent) {
    GeofencingEvent event = GeofencingEvent.fromIntent(intent);

    if (event.hasError()) {
      String errorMessage = getErrorString(event.getErrorCode());
      Error error = new Error(errorMessage);
      mTask.execute(null, error);
      return;
    }

    // Get region state and event type from given transition type.
    int geofenceTransition = event.getGeofenceTransition();
    int regionState = regionStateForTransitionType(geofenceTransition);
    int eventType = eventTypeFromTransitionType(geofenceTransition);

    // Get the geofences that were triggered. A single event can trigger multiple geofences.
    List<Geofence> triggeringGeofences = event.getTriggeringGeofences();

    for (Geofence geofence : triggeringGeofences) {
      PersistableBundle region = mRegions.get(geofence.getRequestId());

      if (region != null) {
        PersistableBundle data = new PersistableBundle();

        // Update region state in region bundle.
        region.putInt("state", regionState);

        data.putInt("eventType", eventType);
        data.putPersistableBundle("region", region);

        Context context = getContext().getApplicationContext();
        getTaskManagerUtils().scheduleJob(context, mTask, Collections.singletonList(data));
      }
    }
  }

  @Override
  public boolean didExecuteJob(JobService jobService, JobParameters params) {
    if (mTask == null) {
      return false;
    }


    List<PersistableBundle> data = getTaskManagerUtils().extractDataFromJobParams(params);

    for (PersistableBundle item : data) {
      Bundle bundle = new Bundle();
      Bundle region = new Bundle();

      region.putAll(item.getPersistableBundle("region"));
      bundle.putInt("eventType", item.getInt("eventType"));
      bundle.putBundle("region", region);
      if (mTask == null) {
        return false;
      }
      mTask.execute(bundle, null);
    }
    return true;
  }

  //endregion
  //region helpers

  private void startGeofencing() {
    Context context = getContext();

    if (context == null) {
      Log.w(TAG, "The context has been abandoned.");
      return;
    }
    if (!LocationHelpers.isAnyProviderAvailable(context)) {
      Log.w(TAG, "There is no location provider available.");
      return;
    }

    mRegions = new HashMap<>();
    mGeofencingList = new ArrayList<>();

    // Create geofences from task options.
    Map<String, Object> options = mTask.getOptions();
    List<HashMap<String, Object>> regions = (ArrayList<HashMap<String, Object>>) options.get("regions");

    for (Map<String, Object> region : regions) {
      Geofence geofence = geofenceFromRegion(region);
      String regionIdentifier = geofence.getRequestId();

      // Make a bundle for the region to remember its attributes. Only request ID is public in Geofence object.
      mRegions.put(regionIdentifier, bundleFromRegion(regionIdentifier, region));

      // Add geofence to the list of observed regions.
      mGeofencingList.add(geofence);
    }

    // Prepare pending intent, geofencing request and client.
    mPendingIntent = preparePendingIntent();
    mGeofencingRequest = prepareGeofencingRequest(mGeofencingList);
    mGeofencingClient = LocationServices.getGeofencingClient(getContext());

    try {
      mGeofencingClient.addGeofences(mGeofencingRequest, mPendingIntent);
    } catch (SecurityException e) {
      Log.w(TAG, "Geofencing request has been rejected.", e);
    }
  }

  private void stopGeofencing() {
    if (mGeofencingClient != null && mPendingIntent != null) {
      mGeofencingClient.removeGeofences(mPendingIntent);
      mPendingIntent.cancel();
    }
  }

  private GeofencingRequest prepareGeofencingRequest(List<Geofence> geofences) {
    return new GeofencingRequest.Builder()
        .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER | GeofencingRequest.INITIAL_TRIGGER_EXIT)
        .addGeofences(geofences)
        .build();
  }

  private PendingIntent preparePendingIntent() {
    return getTaskManagerUtils().createTaskIntent(getContext(), mTask);
  }

  private Geofence geofenceFromRegion(Map<String, Object> region) {
    String identifier = region.containsKey("identifier") ? (String) region.get("identifier") : UUID.randomUUID().toString();
    double latitude = doubleFromObject(region.get("latitude"));
    double longitude = doubleFromObject(region.get("longitude"));
    double radius = doubleFromObject(region.get("radius"));

    boolean notifyOnEnter = !region.containsKey("notifyOnEnter") || (boolean) region.get("notifyOnEnter");
    boolean notifyOnExit = !region.containsKey("notifyOnExit") || (boolean) region.get("notifyOnExit");
    int transitionTypes = (notifyOnEnter ? Geofence.GEOFENCE_TRANSITION_ENTER : 0) | (notifyOnExit ? Geofence.GEOFENCE_TRANSITION_EXIT : 0);

    return new Geofence.Builder()
        .setRequestId(identifier)
        .setCircularRegion(latitude, longitude, (float) radius)
        .setExpirationDuration(Geofence.NEVER_EXPIRE)
        .setTransitionTypes(transitionTypes)
        .build();
  }

  private PersistableBundle bundleFromRegion(String identifier, Map<String, Object> region) {
    PersistableBundle bundle = new PersistableBundle();

    bundle.putString("identifier", identifier);
    bundle.putDouble("radius", doubleFromObject(region.get("radius")));
    bundle.putDouble("latitude", doubleFromObject(region.get("latitude")));
    bundle.putDouble("longitude", doubleFromObject(region.get("longitude")));
    bundle.putInt("state", LocationModule.GEOFENCING_REGION_STATE_UNKNOWN);

    return bundle;
  }

  private static double doubleFromObject(Object object) {
    if (object instanceof Integer) {
      return ((Integer) object).doubleValue();
    }
    return (Double) object;
  }

  private int regionStateForTransitionType(int transitionType) {
    switch (transitionType) {
      case Geofence.GEOFENCE_TRANSITION_ENTER:
      case Geofence.GEOFENCE_TRANSITION_DWELL:
        return LocationModule.GEOFENCING_REGION_STATE_INSIDE;
      case Geofence.GEOFENCE_TRANSITION_EXIT:
        return LocationModule.GEOFENCING_REGION_STATE_OUTSIDE;
      default:
        return LocationModule.GEOFENCING_REGION_STATE_UNKNOWN;
    }
  }

  private int eventTypeFromTransitionType(int transitionType) {
    switch (transitionType) {
      case Geofence.GEOFENCE_TRANSITION_ENTER:
        return LocationModule.GEOFENCING_EVENT_ENTER;
      case Geofence.GEOFENCE_TRANSITION_EXIT:
        return LocationModule.GEOFENCING_EVENT_EXIT;
      default:
        return 0;
    }
  }

  private static String getErrorString(int errorCode) {
    switch (errorCode) {
      case GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE:
        return "Geofencing not available.";
      case GeofenceStatusCodes.GEOFENCE_TOO_MANY_GEOFENCES:
        return "Too many geofences.";
      case GeofenceStatusCodes.GEOFENCE_TOO_MANY_PENDING_INTENTS:
        return "Too many pending intents.";
      default:
        return "Unknown geofencing error.";
    }
  }

  //endregion
}
