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

import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.unimodules.core.interfaces.SingletonModule;
import org.unimodules.interfaces.taskManager.TaskConsumerInterface;
import org.unimodules.interfaces.taskManager.TaskExecutionCallback;
import org.unimodules.interfaces.taskManager.TaskInterface;
import org.unimodules.interfaces.taskManager.TaskManagerInterface;
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface;
import org.unimodules.interfaces.taskManager.TaskServiceInterface;

import java.lang.ref.WeakReference;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import expo.modules.taskManager.exceptions.InvalidConsumerClassException;
import expo.modules.taskManager.exceptions.TaskNotFoundException;
import expo.modules.taskManager.exceptions.TaskRegisteringFailedException;
import org.unimodules.apploader.AppLoaderProvider;
import org.unimodules.apploader.HeadlessAppLoader;

// @tsapeta: TaskService is a funny kind of singleton module... because it's actually not a singleton :D
// Since it would make too much troubles in order to get the singleton instance (from ModuleRegistryProvider)
// in classes like TaskJobService and TaskBroadcastReceiver, almost all properties of TaskService are static.
// Thanks to that, we can instantiate new TaskService in those classes, that has just its own context and all other resources are shared.

public class TaskService implements SingletonModule, TaskServiceInterface {
  private static final String TAG = "TaskService";
  private static final String SHARED_PREFERENCES_NAME = "TaskManagerModule";
  private static final int MAX_TASK_EXECUTION_TIME_MS = 15000; // 15 seconds

  private WeakReference<Context> mContextRef;
  private TaskManagerUtilsInterface mTaskManagerUtils;

  // { "<appId>": { "<taskName>": TaskInterface } }
  private static Map<String, Map<String, TaskInterface>> sTasksTable = null;

  // Map with task managers of running (foregrounded) apps. { "<appId>": WeakReference(TaskManagerInterface) }
  private static final Map<String, WeakReference<TaskManagerInterface>> sTaskManagers = new HashMap<>();

  // Same as above but for headless (backgrounded) apps.
  private static final Map<String, WeakReference<TaskManagerInterface>> sHeadlessTaskManagers = new HashMap<>();

  // { "<appId>": List(eventIds...) }
  private static final Map<String, List<String>> sEvents = new HashMap<>();

  // { "<appId>": List(eventBodies...) }
  private static final Map<String, List<Bundle>> sEventsQueues = new HashMap<>();

  // Map of callbacks for task execution events. Schema: { "<eventId>": TaskExecutionCallback }
  private static final Map<String, TaskExecutionCallback> sTaskCallbacks = new HashMap<>();

  public TaskService(Context context) {
    super();
    mContextRef = new WeakReference<>(context);

    if (sTasksTable == null) {
      sTasksTable = new HashMap<>();
      restoreTasks();
    }
  }

  public String getName() {
    return "TaskService";
  }

  //region TaskServiceInterface

  @Override
  public boolean hasRegisteredTask(String taskName, String appId) {
    TaskInterface task = getTask(taskName, appId);
    return task != null;
  }

  @Override
  public void registerTask(String taskName, String appId, String appUrl, Class consumerClass, Map<String, Object> options) throws TaskRegisteringFailedException {
    TaskInterface task = getTask(taskName, appId);
    Class unversionedConsumerClass = unversionedClassForClass(consumerClass);

    if (task != null && unversionedConsumerClass != null && unversionedConsumerClass.isInstance(task.getConsumer())) {
      // Task already exists. Let's just update its options.
      task.setOptions(options);
      task.getConsumer().setOptions(options);
    } else {
      internalRegisterTask(taskName, appId, appUrl, consumerClass, options);
    }
    saveTasksForAppWithId(appId);
  }

  @Override
  public void unregisterTask(String taskName, String appId, Class consumerClass) throws TaskNotFoundException, InvalidConsumerClassException {
    TaskInterface task = getTask(taskName, appId);
    Class unversionedConsumerClass = unversionedClassForClass(consumerClass);

    // Task not found.
    if (task == null) {
      throw new TaskNotFoundException(taskName, appId);
    }

    // Check if the consumer is an instance of given consumer class.
    if (unversionedConsumerClass != null && !unversionedConsumerClass.isInstance(task.getConsumer())) {
      throw new InvalidConsumerClassException(taskName);
    }

    Map<String, TaskInterface> appTasks = sTasksTable.get(appId);

    if (appTasks != null) {
      appTasks.remove(taskName);
    }

    Log.i(TAG, "Unregistering task '" + taskName + "' for app '" + appId + "'.");

    task.getConsumer().didUnregister();
    saveTasksForAppWithId(appId);
  }

  @Override
  public void unregisterAllTasksForAppId(String appId) {
    Map<String, TaskInterface> appTasks = sTasksTable.get(appId);

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
  public boolean taskHasConsumerOfClass(String taskName, String appId, Class consumerClass) {
    TaskInterface task = getTask(taskName, appId);
    Class unversionedConsumerClass = unversionedClassForClass(consumerClass);
    return task != null && unversionedConsumerClass.isInstance(task.getConsumer());
  }

  @Override
  public Bundle getTaskOptions(String taskName, String appId) {
    TaskInterface task = getTask(taskName, appId);
    if (task != null) {
      return task.getOptionsBundle();
    }
    return null;
  }

  @Override
  public List<Bundle> getTasksForAppId(String appId) {
    Map<String, TaskInterface> appTasks = sTasksTable.get(appId);
    List<Bundle> tasks = new ArrayList<>();

    if (appTasks != null) {
      for (TaskInterface task : appTasks.values()) {
        Bundle taskBundle = new Bundle();

        taskBundle.putString("taskName", task.getName());
        taskBundle.putString("taskType", task.getConsumer().taskType());
        taskBundle.putBundle("options", task.getOptionsBundle());

        tasks.add(taskBundle);
      }
    }
    return tasks;
  }

  @Override
  public List<TaskConsumerInterface> getTaskConsumers(String appId) {
    Map<String, TaskInterface> appTasks = sTasksTable.get(appId);
    List<TaskConsumerInterface> taskConsumers = new ArrayList<>();

    if (appTasks != null) {
      for (TaskInterface task : appTasks.values()) {
        taskConsumers.add(task.getConsumer());
      }
    }
    return taskConsumers;
  }

  @Override
  public void notifyTaskFinished(String taskName, final String appId, Map<String, Object> response) {
    String eventId = (String) response.get("eventId");
    List<String> appEvents = sEvents.get(appId);

    Log.i(TAG, "Finished task '" + taskName + "' with eventId '" + eventId + "'.");

    if (appEvents != null) {
      appEvents.remove(eventId);

      if (appEvents.size() == 0) {
        sEvents.remove(appId);

        // Invalidate app record but after 2 seconds delay so we can still take batched events.
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
          @Override
          public void run() {
            if (!sEvents.containsKey(appId)) {
              invalidateAppRecord(appId);
            }
          }
        }, 2000);
      }
    }

    // Invoke task callback
    TaskExecutionCallback taskCallback = sTaskCallbacks.get(eventId);

    if (taskCallback != null) {
      taskCallback.onFinished(response);
    }
  }

  @Override
  public void setTaskManager(TaskManagerInterface taskManager, String appId, String appUrl) {
    // It may be called with null when the host activity is destroyed.
    if (taskManager == null) {
      sTaskManagers.remove(appId);
      return;
    }

    // Determine in which table the task manager will be stored.
    // Having two tables for them is to prevent race condition problems,
    // when both foreground and background apps are launching at the same time.
    boolean isHeadless = isStartedByHeadlessLoader(appId);
    Map<String, WeakReference<TaskManagerInterface>> taskManagers = isHeadless ? sHeadlessTaskManagers : sTaskManagers;

    // Set task manager in appropriate map.
    taskManagers.put(appId, new WeakReference<>(taskManager));

    // Execute events waiting for the task manager.
    List<Bundle> eventsQueue = sEventsQueues.get(appId);

    if (eventsQueue != null) {
      for (Bundle body : eventsQueue) {
        taskManager.executeTaskWithBody(body);
      }
    }

    // Remove events queue for that app.
    sEventsQueues.remove(appId);

    if (!isHeadless) {
      // Maybe update app url in user defaults. It might change only in non-headless mode.
      maybeUpdateAppUrlForAppId(appUrl, appId);
    }
  }

  @Override
  public boolean isStartedByHeadlessLoader(String appId) {
    return getAppLoader().isRunning(appId);
  }

  public void handleIntent(Intent intent) {
    String action = intent.getAction();
    Uri dataUri = intent.getData();

    if (!TaskBroadcastReceiver.INTENT_ACTION.equals(action)) {
      // Call custom broadcasts on all consumers that can handle them.

      Log.i(TAG, "Handling intent with action '" + action + "'.");

      for (String appId : sTasksTable.keySet()) {
        List<TaskConsumerInterface> taskConsumers = getTaskConsumers(appId);

        for (TaskConsumerInterface consumer : taskConsumers) {
          if (consumer.canReceiveCustomBroadcast(action)) {
            consumer.didReceiveBroadcast(intent);
          }
        }
      }
      return;
    }
    if (dataUri == null) {
      return;
    }

    String appId = dataUri.getQueryParameter("appId");
    String taskName = dataUri.getQueryParameter("taskName");

    TaskConsumerInterface consumer = getTaskConsumer(taskName, appId);

    Log.i(TAG, "Handling intent with task name '" + taskName + "' and appId '" + appId + "'.");

    if (consumer == null) {
      Log.w(TAG, "Task or consumer not found.");

      // Cancel pending intent.
      getTaskManagerUtils().cancelTaskIntent(mContextRef.get(), appId, taskName);
      return;
    }

    // executes task
    consumer.didReceiveBroadcast(intent);
  }

  public boolean handleJob(final JobService jobService, final JobParameters params) {
    PersistableBundle extras = params.getExtras();
    String appId = extras.getString("appId");
    String taskName = extras.getString("taskName");

    TaskConsumerInterface consumer = getTaskConsumer(taskName, appId);

    if (consumer == null) {
      Log.w(TAG, "Task or consumer not found.");
      return false;
    }

    Log.i(TAG, "Handling job with task name '" + taskName + "' for app with ID '" + appId + "'.");

    // executes task
    boolean isAsyncJob = consumer.didExecuteJob(jobService, params);

    if (isAsyncJob) {
      // Make sure the task doesn't take more than 15 seconds
      finishJobAfterTimeout(jobService, params, MAX_TASK_EXECUTION_TIME_MS);
    }

    return isAsyncJob;
  }

  public boolean cancelJob(JobService jobService, JobParameters params) {
    PersistableBundle extras = params.getExtras();
    String appId = extras.getString("appId");
    String taskName = extras.getString("taskName");

    TaskInterface task = getTask(taskName, appId);

    // `notifyTaskJobCancelled` notifies TaskManagerUtils about a job for task being cancelled.
    // It returns `true` if the job has been intentionally cancelled to be rescheduled,
    // in that case we don't want to inform the consumer about cancellation.
    if (task != null && !TaskManagerUtils.notifyTaskJobCancelled(task)) {
      TaskConsumerInterface consumer = task.getConsumer();

      if (consumer == null) {
        return false;
      }

      Log.i(TAG, "Job for task '" + taskName + "' has been cancelled by the system.");

      // cancels task
      return consumer.didCancelJob(jobService, params);
    }

    // `false` = don't reschedule the job.
    return false;
  }

  public void executeTask(TaskInterface task, Bundle data, Error error, TaskExecutionCallback callback) {
    TaskManagerInterface taskManager = getTaskManager(task.getAppId());
    Bundle body = createExecutionEventBody(task, data, error);
    Bundle executionInfo = body.getBundle("executionInfo");

    if (executionInfo == null) {
      // it should never happen, just to suppress warnings :)
      return;
    }

    String eventId = executionInfo.getString("eventId");
    String appId = task.getAppId();

    if (callback != null) {
      sTaskCallbacks.put(eventId, callback);
    }

    final List<String> appEvents;
    if (sEvents.get(appId) == null) {
      appEvents = new ArrayList<>();
      appEvents.add(eventId);
      sEvents.put(appId, appEvents);
    } else {
      appEvents = new ArrayList<>();
      appEvents.add(eventId);
    }

    if (taskManager != null) {
      taskManager.executeTaskWithBody(body);
      return;
    }

    // The app is not fully loaded as its task manager is not there yet.
    // We need to add event's body to the queue from which events will be executed once the task manager is ready.
    if (!sEventsQueues.containsKey(appId)) {
      sEventsQueues.put(appId, new ArrayList<>());
    }
    sEventsQueues.get(appId).add(body);

    try {
      getAppLoader().loadApp(mContextRef.get(), new HeadlessAppLoader.Params(appId, task.getAppUrl()), () -> {
      }, success -> {
        if (!success) {
          sEvents.remove(appId);
          sEventsQueues.remove(appId);

          // Host unreachable? Unregister all tasks for that app.
          unregisterAllTasksForAppId(appId);
        }
      });
    } catch (HeadlessAppLoader.AppConfigurationError ignored) {
      try {
        unregisterTask(task.getName(), appId, null);
      } catch (Exception e) {
        Log.e(TAG, "Error occurred while unregistering invalid task.", e);
      }

      appEvents.remove(eventId);
      sEventsQueues.remove(appId);
    }
  }

  //endregion
  //region helpers

  private HeadlessAppLoader getAppLoader() {
    if (mContextRef.get() != null) {
      return AppLoaderProvider.getLoader("react-native-headless", mContextRef.get());
    } else {
      return null;
    }
  }

  private void internalRegisterTask(String taskName, String appId, String appUrl, Class<TaskConsumerInterface> consumerClass, Map<String, Object> options) throws TaskRegisteringFailedException {
    Constructor<?> consumerConstructor;
    TaskConsumerInterface consumer;
    Context context = mContextRef.get();

    if (context == null) {
      return;
    }

    try {
      consumerConstructor = consumerClass.getDeclaredConstructor(Context.class, TaskManagerUtilsInterface.class);
      consumer = (TaskConsumerInterface) consumerConstructor.newInstance(context, getTaskManagerUtils());
    } catch (Exception e) {
      throw new TaskRegisteringFailedException(consumerClass, e);
    }

    Task task = new Task(taskName, appId, appUrl, consumer, options, this);

    Map<String, TaskInterface> appTasks = sTasksTable.containsKey(appId) ? sTasksTable.get(appId) : new HashMap<String, TaskInterface>();
    appTasks.put(taskName, task);
    sTasksTable.put(appId, appTasks);

    Log.i(TAG, "Registered task with name '" + taskName + "' for app with ID '" + appId + "'.");

    consumer.didRegister(task);
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

  private static TaskInterface getTask(String taskName, String appId) {
    Map<String, TaskInterface> appTasks = sTasksTable.get(appId);
    return appTasks != null ? appTasks.get(taskName) : null;
  }

  private TaskConsumerInterface getTaskConsumer(String taskName, String appId) {
    if (taskName == null || appId == null) {
      return null;
    }
    TaskInterface task = getTask(taskName, appId);
    return task != null ? task.getConsumer() : null;
  }

  private TaskManagerUtilsInterface getTaskManagerUtils() {
    if (mTaskManagerUtils == null) {
      mTaskManagerUtils = new TaskManagerUtils();
    }
    return mTaskManagerUtils;
  }

  private SharedPreferences getSharedPreferences() {
    Context context = mContextRef.get();
    return context != null ? context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE) : null;
  }

  private void maybeUpdateAppUrlForAppId(String appUrl, String appId) {
    SharedPreferences preferences = getSharedPreferences();
    Map<String, Object> appConfig = preferences != null ? jsonToMap(preferences.getString(appId, "")) : null;

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
    SharedPreferences preferences = getSharedPreferences();
    Map<String, ?> config = preferences.getAll();

    for (Map.Entry<String, ?> entry : config.entrySet()) {
      Map<String, Object> appConfig = jsonToMap(entry.getValue().toString());
      Map<String, Object> tasksConfig = (HashMap<String, Object>) appConfig.get("tasks");
      String appUrl = (String) appConfig.get("appUrl");

      if (appUrl != null && tasksConfig != null && tasksConfig.size() > 0) {
        for (String taskName : tasksConfig.keySet()) {
          Map<String, Object> taskConfig = (HashMap<String, Object>) tasksConfig.get(taskName);
          String consumerClassString = (String) taskConfig.get("consumerClass");

          try {
            Class consumerClass = Class.forName(consumerClassString);
            int currentConsumerVersion = getConsumerVersion(consumerClass);
            int previousConsumerVersion = (Integer) taskConfig.get("consumerVersion");

            // Check whether the current consumer class is compatible with the saved version
            if (currentConsumerVersion == previousConsumerVersion) {
              Map<String, Object> options = (HashMap<String, Object>) taskConfig.get("options");

              try {
                // register the task using internal method which doesn't change shared preferences.
                internalRegisterTask(taskName, entry.getKey(), appUrl, consumerClass, options);
              } catch (TaskRegisteringFailedException e) {
                Log.e(TAG, e.getMessage());
              }
            } else {
              Log.w(TAG, "Task consumer '" + consumerClassString + "' has version '" + currentConsumerVersion + "' that is not compatible with the saved version '" + previousConsumerVersion + "'.");
            }
          } catch (ClassNotFoundException | NullPointerException e) {
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
            // nothing, just skip it.
          }
        }
      }

      // Update tasks for the app to unregister tasks that couldn't be restored.
      saveTasksForAppWithId(entry.getKey());
    }
  }

  private void saveTasksForAppWithId(String appId) {
    SharedPreferences preferences = getSharedPreferences();
    Map<String, TaskInterface> appRow = sTasksTable.get(appId);

    if (preferences == null) {
      return;
    }
    if (appRow == null || appRow.size() == 0) {
      preferences.edit().remove(appId).apply();
      return;
    }

    Map<String, Object> appConfig = new HashMap<>();
    Map<String, Object> tasks = new HashMap<>();
    String appUrl = null;

    for (TaskInterface task : appRow.values()) {
      Map<String, Object> taskConfig = exportTaskToMap(task);
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
   * Returns task manager for given appId. Task managers initialized in non-headless contexts have precedence over headless one.
   */
  @Nullable
  private TaskManagerInterface getTaskManager(String appId) {
    WeakReference<TaskManagerInterface> weakRef = sTaskManagers.get(appId);
    TaskManagerInterface taskManager = weakRef == null ? null : weakRef.get();

    if (taskManager == null) {
      weakRef = sHeadlessTaskManagers.get(appId);
    }
    return weakRef == null ? null : weakRef.get();
  }

  private Map<String, Object> exportTaskToMap(TaskInterface task) {
    Map<String, Object> map = new HashMap<>();
    Class consumerClass = task.getConsumer().getClass();
    String consumerClassName = unversionedClassNameForClass(consumerClass);

    map.put("name", task.getName());
    map.put("consumerClass", consumerClassName);
    map.put("consumerVersion", getConsumerVersion(consumerClass));
    map.put("options", task.getOptions());

    return map;
  }

  private void invalidateAppRecord(String appId) {
    if (getAppLoader().invalidateApp(appId)) {
      sHeadlessTaskManagers.remove(appId);
    }
  }

  private void finishJobAfterTimeout(final JobService jobService, final JobParameters params, long timeout) {
    Handler handler = new Handler();
    handler.postDelayed(new Runnable() {
      @Override
      public void run() {
        jobService.jobFinished(params, false);
      }
    }, timeout);
  }

  private static Map<String, Object> jsonToMap(String jsonStr) {
    try {
      return jsonToMap(new JSONObject(jsonStr));
    } catch (JSONException e) {
      return new HashMap<>();
    }
  }

  private static Map<String, Object> jsonToMap(JSONObject json) {
    Map<String, Object> map = new HashMap<>();

    try {
      Iterator<?> keys = json.keys();

      while (keys.hasNext()) {
        String key = (String) keys.next();
        Object value = jsonObjectToObject(json.get(key));

        map.put(key, value);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return map;
  }

  private static List<Object> jsonToList(JSONArray json) {
    List<Object> list = new ArrayList<>();

    try {
      for (int i = 0; i < json.length(); i++) {
        Object value = json.get(i);

        if (value instanceof JSONArray) {
          value = jsonToList((JSONArray) value);
        } else if (value instanceof JSONObject) {
          value = jsonToMap((JSONObject) value);
        }
        list.add(value);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return list;
  }

  private static Object jsonObjectToObject(Object json) {
    if (json instanceof JSONObject) {
      return jsonToMap((JSONObject) json);
    }
    if (json instanceof JSONArray) {
      return jsonToList((JSONArray) json);
    }
    return json;
  }

  /**
   * Returns task consumer's version. Defaults to 0 if `VERSION` static field is not implemented.
   */
  private static int getConsumerVersion(Class consumerClass) {
    try {
      Field versionField = consumerClass.getDeclaredField("VERSION");
      return (Integer) versionField.get(null);
    } catch (NoSuchFieldException | IllegalAccessException e) {
      return 0;
    }
  }

  /**
   * Method that unversions class names, so we can always use unversioned task consumer classes.
   */
  private static String unversionedClassNameForClass(Class versionedClass) {
    String className = versionedClass.getName();
    return className.replaceFirst("\\^abi\\d+_\\d+_\\d+\\.", "");
  }

  /**
   * Returns unversioned class from versioned one.
   */
  private static Class unversionedClassForClass(Class versionedClass) {
    if (versionedClass == null) {
      return null;
    }

    String unversionedClassName = unversionedClassNameForClass(versionedClass);

    try {
      return Class.forName(unversionedClassName);
    } catch (ClassNotFoundException e) {
      Log.e(TAG, "Class with name '" + unversionedClassName + "' not found.");
      e.printStackTrace();
      return null;
    }
  }

  //endregion
}
