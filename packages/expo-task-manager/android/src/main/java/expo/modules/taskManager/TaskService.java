package expo.modules.taskManager;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.PersistableBundle;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import expo.core.interfaces.SingletonModule;
import expo.interfaces.taskManager.TaskExecutionCallback;
import expo.interfaces.taskManager.TaskManagerUtilsInterface;
import expo.interfaces.taskManager.TaskServiceInterface;
import expo.interfaces.taskManager.TaskConsumerInterface;
import expo.interfaces.taskManager.TaskInterface;
import expo.interfaces.taskManager.TaskManagerInterface;
import expo.loaders.provider.interfaces.AppLoaderInterface;
import expo.loaders.provider.AppLoaderProvider;
import expo.loaders.provider.interfaces.AppRecordInterface;

public class TaskService implements SingletonModule, TaskServiceInterface {
  private static final String TAG = "TaskService";
  private static final String SHARED_PREFERENCES_NAME = "TaskManagerModule";
  private static TaskService sInstance;

  private Context mContext;

  // { "<appId>": { "<taskName>": TaskInterface } }
  private final Map<String, Map<String, TaskInterface>> mTasksTable = new HashMap<>();

  // Map with task managers of running (foregrounded) apps. { "<appId>": WeakReference(TaskManagerInterface) }
  private static final Map<String, WeakReference<TaskManagerInterface>> mTaskManagers = new HashMap<>();

  // Same as above buf for headless (backgrounded) apps.
  private static final Map<String, WeakReference<TaskManagerInterface>> mHeadlessTaskManagers = new HashMap<>();

  // { "<appId>": List(eventIds...) }
  private static final Map<String, List<String>> mEvents = new HashMap<>();

  // { "<appId>": List(eventBodies...) }
  private static final Map<String, List<Bundle>> mEventsQueues = new HashMap<>();

  // { "<appId>": AppRecordInterface }
  private static final Map<String, AppRecordInterface> mAppRecords = new HashMap<>();

  // Map of callbacks for task execution events. Schema: { "<eventId>": TaskExecutionCallback }
  private static final Map<String, TaskExecutionCallback> mTaskCallbacks = new HashMap<>();

  public TaskService(Context context) {
    super();
    mContext = context;

    if (sInstance == null) {
      sInstance = this;
    }
    restoreTasks();
  }

  public String getName() {
    return "TaskService";
  }

  //region statics

  public static TaskService getInstance(Context context) {
    if (sInstance == null) {
      sInstance = new TaskService(context);
    }
    return sInstance;
  }

  //endregion
  //region TaskServiceInterface

  @Override
  public boolean hasRegisteredTask(String taskName, String appId) {
    TaskInterface task = getTask(taskName, appId);
    return task != null;
  }

  @Override
  public void registerTask(String taskName, String appId, String appUrl, Class<TaskConsumerInterface> consumerClass, Map<String, Object> options) throws Exception {
    TaskInterface task = internalRegisterTask(taskName, appId, appUrl, consumerClass, options);
    saveTasksForAppWithId(appId);
  }

  @Override
  public void unregisterTask(String taskName, String appId, Class<TaskConsumerInterface> consumerClass) throws Exception {
    TaskInterface task = getTask(taskName, appId);

    // Task not found.
    if (task == null) {
      throw new Exception("Task '" + taskName + "' not found for app ID '" + appId + "'.");
    }

    // Check if the consumer is an instance of given consumer class.
    if (consumerClass != null && !consumerClass.isInstance(task.getConsumer())) {
      throw new Exception("Cannot unregister task with name '" + taskName + "' because it is associated with different consumer class.");
    }

    Map<String, TaskInterface> appTasks = mTasksTable.get(appId);

    if (appTasks != null) {
      appTasks.remove(taskName);
    }

    Log.i(TAG, "Unregistering task '" + taskName + "' for app '" + appId + "'.");

    task.getConsumer().didUnregister();
    saveTasksForAppWithId(appId);
  }

  @Override
  public void unregisterAllTasksForAppId(String appId) {
    Map<String, TaskInterface> appTasks = mTasksTable.get(appId);

    if (appTasks != null) {
      Log.i(TAG, "Unregistering all tasks for app '" + appId + "'.");

      for (TaskInterface task : appTasks.values()) {
        task.getConsumer().didUnregister();
      }

      appTasks.clear();
      removeAppFromConfig(appId);
    }
  }

  @Override
  public boolean taskHasConsumerOfClass(String taskName, String appId, Class<TaskConsumerInterface> consumerClass) {
    TaskInterface task = getTask(taskName, appId);
    return task != null && consumerClass.isInstance(task.getConsumer());
  }

  @Override
  public Bundle getTasksForAppId(String appId) {
    Map<String, TaskInterface> appTasks = mTasksTable.get(appId);
    Bundle resultBundle = new Bundle();

    if (appTasks != null) {
      for (TaskInterface task : appTasks.values()) {
        resultBundle.putBundle(task.getName(), task.getOptionsBundle());
      }
    }
    return resultBundle;
  }

  @Override
  public void notifyTaskDidFinish(String taskName, final String appId, Map<String, Object> response) {
    String eventId = (String) response.get("eventId");
    List<String> appEvents = mEvents.get(appId);

    Log.i(TAG, "Finished task '" + taskName + "' with eventId '" + eventId + "'.");

    if (appEvents != null) {
      appEvents.remove(eventId);

      if (appEvents.size() == 0) {
        mEvents.remove(appId);

        // Invalidate app record but after 1 seconds delay so we can still take batched events.
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
          @Override
          public void run() {
            if (!mEvents.containsKey(appId)) {
              invalidateAppRecord(appId);
            }
          }
        }, 2000);
      }
    }

    // Invoke task callback
    TaskExecutionCallback taskCallback = mTaskCallbacks.get(eventId);

    if (taskCallback != null) {
      Log.i(TAG, "Task finished execution, calling onFinished callback...");
      taskCallback.onFinished(response);
    }
  }

  @Override
  public void setTaskOptions(String taskName, String appId, Map<String, Object> options, Class<TaskConsumerInterface> consumerClass) {
    TaskInterface task = getTask(taskName, appId);

    if (task != null) {
      TaskConsumerInterface consumer = task.getConsumer();

      task.setOptions(options);
      consumer.setOptions(options);
    }
  }

  @Override
  public void setTaskManager(TaskManagerInterface taskManager, String appId, String appUrl) {
    Log.i("Expo", "TaskService.setTaskManager: " + appId + " " + appUrl);
    // Determine in which table the task manager will be stored.
    // Having two tables for them is to prevent race condition problems,
    // when both foreground and background apps are launching at the same time.
    boolean isHeadless = taskManager.isRunningInHeadlessMode();
    Map<String, WeakReference<TaskManagerInterface>> taskManagers = isHeadless ? mHeadlessTaskManagers : mTaskManagers;

    // Set task manager in appropriate map.
    taskManagers.put(appId, new WeakReference<>(taskManager));

    // Execute events waiting for the task manager.
    List<Bundle> eventsQueue = mEventsQueues.get(appId);

    if (eventsQueue != null) {
      Log.i("Expo", "Moving events from TaskService to the respective TaskManager: " + eventsQueue.size());
      for (Bundle body : eventsQueue) {
        taskManager.executeTaskWithBody(body);
      }
    }

    // Remove events queue for that app.
    mEventsQueues.remove(appId);

    if (!isHeadless) {
      // Maybe update app url in user defaults. It might change only in non-headless mode.
      maybeUpdateAppUrlForAppId(appUrl, appId);
    }
  }

  public void handleIntent(Intent intent) {
    String action = intent.getAction();
    Uri dataUri = intent.getData();

    if (!action.equals(TaskBroadcastReceiver.INTENT_ACTION)) {
      return;
    }

    String appId = dataUri.getQueryParameter("appId");
    String taskName = dataUri.getQueryParameter("taskName");

    TaskConsumerInterface consumer = getTaskConsumer(taskName, appId);

    Log.i(TAG, "Handling TaskService intent with task name '" + taskName + "' for app with ID '" + appId + "'.");

    if (consumer == null) {
      Log.w(TAG, "Task or consumer not found.");
      return;
    }

    // executes task
    consumer.didReceiveBroadcast(intent);
  }

  public boolean handleJob(JobService jobService, JobParameters params) {
    PersistableBundle extras = params.getExtras();
    String appId = extras.getString("appId");
    String taskName = extras.getString("taskName");

    TaskConsumerInterface consumer = getTaskConsumer(taskName, appId);

    if (consumer == null) {
      Log.w(TAG, "Task or consumer not found.");
      return false;
    }

    Log.i(TAG, "Handling TaskService job with task name '" + taskName + "' for app with ID '" + appId + "'.");

    // executes task
    return consumer.didExecuteJob(jobService, params);
  }

  public boolean cancelJob(JobService jobService, JobParameters params) {
    PersistableBundle extras = params.getExtras();
    String appId = extras.getString("appId");
    String taskName = extras.getString("taskName");

    TaskConsumerInterface consumer = getTaskConsumer(taskName, appId);

    if (consumer == null) {
      return false;
    }

    Log.i(TAG, "Job for task '" + taskName + "' has been cancelled by the system.");

    // cancels task
    return consumer.didCancelJob(jobService, params);
  }

  public void executeTask(TaskInterface task, Bundle data, Error error, TaskExecutionCallback callback) {
    TaskManagerInterface taskManager = getTaskManager(task.getAppId());
    Bundle body = createExecutionEventBody(task, data, error);
    String eventId = body.getBundle("executionInfo").getString("eventId");
    String appId = task.getAppId();
    List<String> appEvents = mEvents.get(appId);

    if (callback != null) {
      Log.i("Expo", "Adding task callback for event " + eventId);
      mTaskCallbacks.put(eventId, callback);
    }

    if (appEvents == null) {
      appEvents = new ArrayList<>();
      appEvents.add(eventId);
      mEvents.put(appId, appEvents);
    } else {
      appEvents.add(eventId);
    }

    if (taskManager != null) {
      Log.i("Expo", "Executing task with body");
      taskManager.executeTaskWithBody(body);
      return;
    }

    // The app is not fully loaded as its task manager is not there yet.
    // We need to add event's body to the queue from which events will be executed once the task manager is ready.
    if (!mEventsQueues.containsKey(appId)) {
      mEventsQueues.put(appId, new ArrayList<Bundle>());
    }
    mEventsQueues.get(appId).add(body);

    if (!mAppRecords.containsKey(appId)) {
      // No app record yet - let's spin it up!

      if (!loadApp(appId, task.getAppUrl())) {
        // Loading failed because parameters are invalid - unregister the task.
        Log.i("Expo", "loading failed :(");
        try {
          unregisterTask(task.getName(), appId, null);
        } catch (Exception e) {
          Log.e(TAG, "Error occurred while unregistering invalid task.", e);
        }
        appEvents.remove(eventId);
        mEventsQueues.remove(appId);
        return;
      }
    }
    Log.i("Expo", "Added event body to the queue");
  }

  //endregion
  //region helpers

  private TaskInterface internalRegisterTask(String taskName, String appId, String appUrl, Class<TaskConsumerInterface> consumerClass, Map<String, Object> options) throws Exception {
    TaskManagerUtilsInterface taskManagerUtils = new TaskManagerUtils();
    TaskConsumerInterface consumer = consumerClass.getDeclaredConstructor(Context.class, TaskManagerUtilsInterface.class).newInstance(mContext, taskManagerUtils);
    Task task = new Task(taskName, appId, appUrl, consumer, options, this);

    consumer.didRegister(task);

    Map<String, TaskInterface> appTasks = mTasksTable.containsKey(appId) ? mTasksTable.get(appId) : new HashMap<String, TaskInterface>();
    appTasks.put(taskName, task);
    mTasksTable.put(appId, appTasks);

    Log.i(TAG, "Registered task with name '" + taskName + "' for app with ID '" + appId + "'.");

    return task;
  }

  private Bundle createExecutionEventBody(TaskInterface task, Bundle data, Error error) {
    Bundle body = new Bundle();
    Bundle executionInfo = new Bundle();
    Bundle errorBundle = errorBundleForError(error);
    String eventId = UUID.randomUUID().toString();

    executionInfo.putString("eventId", eventId);
    executionInfo.putString("taskName", task.getName());

    body.putBundle("executionInfo", executionInfo);
    body.putBundle("data", data != null ? data : new Bundle());
    body.putBundle("error", errorBundle);

    return body;
  }

  private Bundle errorBundleForError(Error error) {
    if (error == null) {
      return null;
    }
    Bundle errorBundle = new Bundle();
    errorBundle.putString("message", error.getMessage());
    return errorBundle;
  }

  private TaskInterface getTask(String taskName, String appId) {
    Map<String, TaskInterface> appTasks = mTasksTable.get(appId);
    return appTasks != null ? appTasks.get(taskName) : null;
  }

  private TaskConsumerInterface getTaskConsumer(String taskName, String appId) {
    if (taskName == null || appId == null) {
      return null;
    }
    TaskInterface task = getTask(taskName, appId);
    TaskConsumerInterface consumer = task != null ? task.getConsumer() : null;
    return consumer;
  }

  private SharedPreferences getSharedPreferences() {
    return mContext.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);
  }

  private void maybeUpdateAppUrlForAppId(String appUrl, String appId) {
    SharedPreferences preferences = getSharedPreferences();
    Map<String, Object> appConfig = jsonToMap(preferences.getString(appId, ""), true);

    if (appConfig != null && appConfig.size() > 0) {
      String oldAppUrl = (String) appConfig.get("appUrl");

      if (oldAppUrl == null || !oldAppUrl.equals(appUrl)) {
        appConfig.put("appUrl", appUrl);

        preferences
            .edit()
            .putString(appId, new JSONObject(appConfig).toString())
            .apply();
      }
    }
  }

  @SuppressWarnings("unchecked")
  private void restoreTasks() {
    Log.i("Expo", "restoring tasks... " + this.hashCode());

    SharedPreferences preferences = getSharedPreferences();
    Map<String, ?> config = preferences.getAll();

    for (Map.Entry<String, ?> entry : config.entrySet()) {
      Map<String, Object> appConfig = jsonToMap(entry.getValue().toString(), true);
      Map<String, Object> tasksConfig = (HashMap<String, Object>) appConfig.get("tasks");
      String appUrl = (String) appConfig.get("appUrl");

      if (appUrl != null && tasksConfig != null && tasksConfig.size() > 0) {
        for (String taskName : tasksConfig.keySet()) {
          Map<String, Object> taskConfig = (HashMap<String, Object>) tasksConfig.get(taskName);
          Map<String, Object> options = (HashMap<String, Object>) taskConfig.get("options");
          String consumerClassString = (String) taskConfig.get("consumerClass");

          try {
            Class consumerClass = Class.forName(consumerClassString);

            // register the task using internal method which doesn't change shared preferences.
            internalRegisterTask(taskName, entry.getKey(), appUrl, consumerClass, options);
          } catch (Exception e) {
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
            // nothing, just skip it.
          }
        }
      }
    }
  }

  private void saveTasksForAppWithId(String appId) {
    SharedPreferences preferences = getSharedPreferences();
    Map<String, TaskInterface> appRow = mTasksTable.get(appId);

    if (appRow == null || appRow.size() == 0) {
      preferences.edit().remove(appId).apply();
      return;
    }

    Map<String, Object> appConfig = new HashMap<>();
    Map<String, Object> tasks = new HashMap<>();
    String appUrl = null;

    for (TaskInterface task : appRow.values()) {
      Map<String, Object> taskConfig = exportTaskToHashmap(task);
      tasks.put(task.getName(), taskConfig);
      appUrl = task.getAppUrl();
    }

    appConfig.put("appUrl", appUrl);
    appConfig.put("tasks", tasks);

    preferences
        .edit()
        .putString(appId, new JSONObject(appConfig).toString())
        .apply();
  }

  private void removeAppFromConfig(String appId) {
    getSharedPreferences().edit().remove(appId).apply();
  }

  /**
   *  Returns task manager for given appId. Task managers initialized in non-headless contexts have precedence over headless one.
   */
  private TaskManagerInterface getTaskManager(String appId) {
    WeakReference<TaskManagerInterface> weakRef = mTaskManagers.get(appId);
    TaskManagerInterface taskManager = weakRef == null ? null : weakRef.get();

    if (taskManager == null) {
      weakRef = mHeadlessTaskManagers.get(appId);
    }
    return weakRef == null ? null : weakRef.get();
  }

  private Map<String, Object> exportTaskToHashmap(TaskInterface task) {
    Map<String, Object> map = new HashMap<>();

    map.put("name", task.getName());
    map.put("consumerClass", task.getConsumer().getClass().getName());
    map.put("options", task.getOptions());

    return map;
  }

  private AppLoaderInterface createAppLoader() {
    // for now only react-native apps in Expo are supported
    return AppLoaderProvider.createLoader("react-native-experience", mContext);
  }

  private boolean loadApp(final String appId, String appUrl) {
    AppLoaderInterface appLoader = createAppLoader();

    if (appLoader == null) {
      Log.e(TAG, "Cannot execute background task because application loader can't be found.");
      return false;
    }
    if (appUrl == null) {
      Log.e(TAG, "Cannot execute background task because application URL is invalid: " + appUrl);
      return false;
    }

    // TODO(@tsapeta): add timeout option;
    Map<String, Object> options = new HashMap<>();

    Log.i(TAG, "Loading headless app '" + appId + "' with url '" + appUrl + "'.");

    AppRecordInterface appRecord = appLoader.loadApp(appUrl, options, new AppLoaderProvider.Callback() {
      @Override
      public void onComplete(boolean success, Error error) {
        if (error != null) {
          error.printStackTrace();
          Log.e(TAG, error.getMessage());
        }
        if (!success) {
          mEvents.remove(appId);
          mEventsQueues.remove(appId);
          mAppRecords.remove(appId);

          // Host unreachable? Unregister all tasks for that app.
          unregisterAllTasksForAppId(appId);
        }
      }
    });

    mAppRecords.put(appId, appRecord);
    return true;
  }

  private void invalidateAppRecord(String appId) {
    AppRecordInterface appRecord = mAppRecords.get(appId);

    if (appRecord != null) {
      appRecord.invalidate();
      mAppRecords.remove(appId);
      mHeadlessTaskManagers.remove(appId);
      Log.i(TAG, "Invalidated headless app '" + appId + "'.");
    }
  }

  public static Map<String, Object> jsonToMap(String jsonStr, boolean recursive) {
    try {
      return jsonToMap(new JSONObject(jsonStr), recursive);
    } catch (JSONException e) {
      return new HashMap<>();
    }
  }

  private static Map<String, Object> jsonToMap(JSONObject json, boolean recursive) {
    Map<String, Object> map = new HashMap<>();

    try {
      Iterator<?> keys = json.keys();

      while (keys.hasNext()) {
        String key = (String) keys.next();
        Object value = json.get(key);

        if (recursive) {
          value = jsonObjectToObject(value, recursive);
        }

        map.put(key, value);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return map;
  }

  private static List<Object> jsonToList(JSONArray json, boolean recursive) {
    List<Object> list = new ArrayList<>();

    try {
      for (int i = 0; i < json.length(); i++) {
        Object value = json.get(i);

        if (recursive) {
          if (value instanceof JSONArray) {
            value = jsonToList((JSONArray) value, recursive);
          } else if (value instanceof JSONObject) {
            value = jsonToMap((JSONObject) value, recursive);
          }
        }
        list.add(value);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return list;
  }

  private static Object jsonObjectToObject(Object json, boolean recursive) {
    if (json instanceof JSONObject) {
      return jsonToMap((JSONObject) json, recursive);
    }
    if (json instanceof JSONArray) {
      return jsonToList((JSONArray) json, recursive);
    }
    return json;
  }

  //endregion
}
