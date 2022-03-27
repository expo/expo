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

import org.json.JSONObject;
import expo.modules.apploader.AppLoaderProvider;
import expo.modules.apploader.HeadlessAppLoader;
import expo.modules.core.interfaces.SingletonModule;

import java.lang.ref.WeakReference;
import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import androidx.annotation.Nullable;

import expo.modules.interfaces.taskManager.TaskConsumerInterface;
import expo.modules.interfaces.taskManager.TaskExecutionCallback;
import expo.modules.interfaces.taskManager.TaskInterface;
import expo.modules.interfaces.taskManager.TaskManagerInterface;
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface;
import expo.modules.interfaces.taskManager.TaskServiceInterface;
import expo.modules.taskManager.exceptions.InvalidConsumerClassException;
import expo.modules.taskManager.exceptions.TaskNotFoundException;
import expo.modules.taskManager.exceptions.TaskRegisteringFailedException;
import expo.modules.taskManager.repository.TasksAndEventsRepository;

import static expo.modules.taskManager.Utils.getConsumerVersion;
import static expo.modules.taskManager.Utils.jsonToMap;
import static expo.modules.taskManager.Utils.unversionedClassForClass;

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

  // Map with task managers of running (foregrounded) apps. { "<appScopeKey>": WeakReference(TaskManagerInterface) }
  private static final Map<String, WeakReference<TaskManagerInterface>> sTaskManagers = new HashMap<>();

  // Same as above but for headless (backgrounded) apps.
  private static final Map<String, WeakReference<TaskManagerInterface>> sHeadlessTaskManagers = new HashMap<>();

  // { "<appScopeKey>": List(eventIds...) }
  private static final Map<String, List<String>> sEvents = new HashMap<>();

  private TasksAndEventsRepository mTasksAndEventsRepository;

  // Map of callbacks for task execution events. Schema: { "<eventId>": TaskExecutionCallback }
  private static final Map<String, TaskExecutionCallback> sTaskCallbacks = new HashMap<>();

  public TaskService(Context context) {
    super();
    mContextRef = new WeakReference<>(context);
    mTasksAndEventsRepository = TasksAndEventsRepository.create(context);

    if (!mTasksAndEventsRepository.tasksExist()) {
      mTasksAndEventsRepository.createTasks();
      restoreTasks();
    }
  }

  public String getName() {
    return "TaskService";
  }

  //region TaskServiceInterface

  @Override
  public boolean hasRegisteredTask(String taskName, String appScopeKey) {
    TaskInterface task = getTask(taskName, appScopeKey);
    return task != null;
  }

  @Override
  public void registerTask(String taskName, String appScopeKey, String appUrl, Class consumerClass, Map<String, Object> options) throws TaskRegisteringFailedException {
    TaskInterface task = getTask(taskName, appScopeKey);
    Class unversionedConsumerClass = unversionedClassForClass(consumerClass);

    if (task != null && unversionedConsumerClass != null && unversionedConsumerClass.isInstance(task.getConsumer())) {
      // Task already exists. Let's just update its options.
      task.setOptions(options);
      task.getConsumer().setOptions(options);
    } else {
      internalRegisterTask(taskName, appScopeKey, appUrl, consumerClass, options);
    }
    mTasksAndEventsRepository.persistTasksForAppScopeKey(getSharedPreferences(), appScopeKey);
  }

  @Override
  public void unregisterTask(String taskName, String appScopeKey, Class consumerClass) throws TaskNotFoundException, InvalidConsumerClassException {
    TaskInterface task = getTask(taskName, appScopeKey);
    Class unversionedConsumerClass = unversionedClassForClass(consumerClass);

    // Task not found.
    if (task == null) {
      throw new TaskNotFoundException(taskName, appScopeKey);
    }

    // Check if the consumer is an instance of given consumer class.
    if (unversionedConsumerClass != null && !unversionedConsumerClass.isInstance(task.getConsumer())) {
      throw new InvalidConsumerClassException(taskName);
    }

    mTasksAndEventsRepository.removeTask(appScopeKey, taskName);

    Log.i(TAG, "Unregistering task '" + taskName + "' for app with scoping identifier '" + appScopeKey + "'.");

    task.getConsumer().didUnregister();
    mTasksAndEventsRepository.persistTasksForAppScopeKey(getSharedPreferences(), appScopeKey);
  }

  @Override
  public void unregisterAllTasksForAppScopeKey(String appScopeKey) {
    Map<String, TaskInterface> appTasks = mTasksAndEventsRepository.getTasks(appScopeKey);

    if (appTasks != null) {
      Log.i(TAG, "Unregistering all tasks for app with scoping identifier '" + appScopeKey + "'.");

      for (TaskInterface task : appTasks.values()) {
        task.getConsumer().didUnregister();
      }

      mTasksAndEventsRepository.removeTasks(appScopeKey);
      removeAppFromConfig(appScopeKey);
    }
  }

  @Override
  public boolean taskHasConsumerOfClass(String taskName, String appScopeKey, Class consumerClass) {
    TaskInterface task = getTask(taskName, appScopeKey);
    Class unversionedConsumerClass = unversionedClassForClass(consumerClass);
    return task != null && unversionedConsumerClass.isInstance(task.getConsumer());
  }

  @Override
  public Bundle getTaskOptions(String taskName, String appScopeKey) {
    TaskInterface task = getTask(taskName, appScopeKey);
    if (task != null) {
      return task.getOptionsBundle();
    }
    return null;
  }

  @Override
  public List<Bundle> getTasksForAppScopeKey(String appScopeKey) {
    Map<String, TaskInterface> appTasks = mTasksAndEventsRepository.getTasks(appScopeKey);
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
  public List<TaskConsumerInterface> getTaskConsumers(String appScopeKey) {
    Map<String, TaskInterface> appTasks = mTasksAndEventsRepository.getTasks(appScopeKey);
    List<TaskConsumerInterface> taskConsumers = new ArrayList<>();

    if (appTasks != null) {
      for (TaskInterface task : appTasks.values()) {
        taskConsumers.add(task.getConsumer());
      }
    }
    return taskConsumers;
  }

  @Override
  public void notifyTaskFinished(String taskName, final String appScopeKey, Map<String, Object> response) {
    String eventId = (String) response.get("eventId");
    List<String> appEvents = sEvents.get(appScopeKey);

    Log.i(TAG, "Finished task '" + taskName + "' with eventId '" + eventId + "'.");

    if (appEvents != null) {
      appEvents.remove(eventId);

      if (appEvents.size() == 0) {
        sEvents.remove(appScopeKey);

        // Invalidate app record but after 2 seconds delay so we can still take batched events.
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
          @Override
          public void run() {
            if (!sEvents.containsKey(appScopeKey)) {
              invalidateAppRecord(appScopeKey);
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
  public void setTaskManager(TaskManagerInterface taskManager, String appScopeKey, String appUrl) {
    // It may be called with null when the host activity is destroyed.
    if (taskManager == null) {
      sTaskManagers.remove(appScopeKey);
      return;
    }

    // Determine in which table the task manager will be stored.
    // Having two tables for them is to prevent race condition problems,
    // when both foreground and background apps are launching at the same time.
    boolean isHeadless = isStartedByHeadlessLoader(appScopeKey);
    Map<String, WeakReference<TaskManagerInterface>> taskManagers = isHeadless ? sHeadlessTaskManagers : sTaskManagers;

    // Set task manager in appropriate map.
    taskManagers.put(appScopeKey, new WeakReference<>(taskManager));

    // Execute events waiting for the task manager.
    List<Bundle> eventsQueue = mTasksAndEventsRepository.getEvents(appScopeKey);

    if (eventsQueue != null) {
      for (Bundle body : eventsQueue) {
        taskManager.executeTaskWithBody(body);
      }
    }

    // Remove events queue for that app.
    mTasksAndEventsRepository.removeEvents(appScopeKey);

    if (!isHeadless) {
      // Maybe update app url in user defaults. It might change only in non-headless mode.
      maybeUpdateAppUrlForAppScopeKey(appUrl, appScopeKey);
    }
  }

  @Override
  public boolean isStartedByHeadlessLoader(String appScopeKey) {
    HeadlessAppLoader appLoader = getAppLoader();
    if (appLoader != null) {
      return appLoader.isRunning(appScopeKey);
    }
    return false;
  }

  public void handleIntent(Intent intent) {
    String action = intent.getAction();
    Uri dataUri = intent.getData();

    if (!TaskBroadcastReceiver.INTENT_ACTION.equals(action)) {
      // Call custom broadcasts on all consumers that can handle them.

      Log.i(TAG, "Handling intent with action '" + action + "'.");

      for (String appScopeKey : mTasksAndEventsRepository.allAppScopeKeysWithTasks()) {
        List<TaskConsumerInterface> taskConsumers = getTaskConsumers(appScopeKey);

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

    // Data URI param name is appId for legacy reasons
    String appScopeKey = dataUri.getQueryParameter("appId");
    String taskName = dataUri.getQueryParameter("taskName");

    TaskConsumerInterface consumer = getTaskConsumer(taskName, appScopeKey);

    Log.i(TAG, "Handling intent with task name '" + taskName + "' and app scoping identifier '" + appScopeKey + "'.");

    if (consumer == null) {
      Log.w(TAG, "Task or consumer not found.");

      // Cancel pending intent.
      getTaskManagerUtils().cancelTaskIntent(mContextRef.get(), appScopeKey, taskName);
      return;
    }

    // executes task
    consumer.didReceiveBroadcast(intent);
  }

  public boolean handleJob(final JobService jobService, final JobParameters params) {
    PersistableBundle extras = params.getExtras();
    // persistable bundle extras param name is appId for legacy reasons
    String appScopeKey = extras.getString("appId");
    String taskName = extras.getString("taskName");

    TaskConsumerInterface consumer = getTaskConsumer(taskName, appScopeKey);

    if (consumer == null) {
      Log.w(TAG, "Task or consumer not found.");
      return false;
    }

    Log.i(TAG, "Handling job with task name '" + taskName + "' for app with scoping identifier '" + appScopeKey + "'.");

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
    // persistable bundle extras param name is appId for legacy reasons
    String appScopeKey = extras.getString("appId");
    String taskName = extras.getString("taskName");

    TaskInterface task = getTask(taskName, appScopeKey);

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
    TaskManagerInterface taskManager = getTaskManager(task.getAppScopeKey());
    Bundle body = createExecutionEventBody(task, data, error);
    Bundle executionInfo = body.getBundle("executionInfo");

    if (executionInfo == null) {
      // it should never happen, just to suppress warnings :)
      return;
    }

    String eventId = executionInfo.getString("eventId");
    String appScopeKey = task.getAppScopeKey();

    if (callback != null) {
      sTaskCallbacks.put(eventId, callback);
    }

    final List<String> appEvents;
    if (sEvents.get(appScopeKey) == null) {
      appEvents = new ArrayList<>();
      appEvents.add(eventId);
      sEvents.put(appScopeKey, appEvents);
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
    if (!mTasksAndEventsRepository.hasEvents(appScopeKey)) {
      mTasksAndEventsRepository.putEvents(appScopeKey, new ArrayList<>());
    }
    mTasksAndEventsRepository.putEventForAppScopeKey(appScopeKey, body);

    try {
      getAppLoader().loadApp(mContextRef.get(), new HeadlessAppLoader.Params(appScopeKey, task.getAppUrl()), () -> {
      }, success -> {
        if (!success) {
          sEvents.remove(appScopeKey);
          mTasksAndEventsRepository.removeEvents(appScopeKey);

          // Host unreachable? Unregister all tasks for that app.
          unregisterAllTasksForAppScopeKey(appScopeKey);
        }
      });
    } catch (HeadlessAppLoader.AppConfigurationError ignored) {
      try {
        unregisterTask(task.getName(), appScopeKey, null);
      } catch (Exception e) {
        Log.e(TAG, "Error occurred while unregistering invalid task.", e);
      }

      appEvents.remove(eventId);
      mTasksAndEventsRepository.removeEvents(appScopeKey);
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

  private void internalRegisterTask(String taskName, String appScopeKey, String appUrl, Class<TaskConsumerInterface> consumerClass, Map<String, Object> options) throws TaskRegisteringFailedException {
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

    Task task = new Task(taskName, appScopeKey, appUrl, consumer, options, this);

    Map<String, TaskInterface> appTasks = mTasksAndEventsRepository.hasTasks(appScopeKey) ? mTasksAndEventsRepository.getTasks(appScopeKey) : new HashMap<String, TaskInterface>();
    appTasks.put(taskName, task);
    mTasksAndEventsRepository.putTasks(appScopeKey, appTasks);

    Log.i(TAG, "Registered task with name '" + taskName + "' for app with scoping identifier '" + appScopeKey + "'.");

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

  private TaskInterface getTask(String taskName, String appScopeKey) {
    Map<String, TaskInterface> appTasks = mTasksAndEventsRepository.getTasks(appScopeKey);
    return appTasks != null ? appTasks.get(taskName) : null;
  }

  private TaskConsumerInterface getTaskConsumer(String taskName, String appScopeKey) {
    if (taskName == null || appScopeKey == null) {
      return null;
    }
    TaskInterface task = getTask(taskName, appScopeKey);
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

  private void maybeUpdateAppUrlForAppScopeKey(String appUrl, String appScopeKey) {
    SharedPreferences preferences = getSharedPreferences();
    Map<String, Object> appConfig = preferences != null ? jsonToMap(preferences.getString(appScopeKey, "")) : null;

    if (appConfig != null && appConfig.size() > 0) {
      String oldAppUrl = (String) appConfig.get("appUrl");

      if (oldAppUrl == null || !oldAppUrl.equals(appUrl)) {
        appConfig.put("appUrl", appUrl);

        preferences
          .edit()
          .putString(appScopeKey, new JSONObject(appConfig).toString())
          .apply();
      }
    }
  }

  @SuppressWarnings("unchecked")
  private void restoreTasks() {
    Map<String, TasksAndEventsRepository.AppConfig> apps = mTasksAndEventsRepository.readPersistedTasks(getSharedPreferences());

    for (Map.Entry<String, TasksAndEventsRepository.AppConfig> entry : apps.entrySet()) {
      String appScopeKey = entry.getKey();
      String appUrl = entry.getValue().appUrl;
      Map<String, Object> tasksConfig = entry.getValue().tasks;

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
                internalRegisterTask(taskName, appScopeKey, appUrl, consumerClass, options);
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
      mTasksAndEventsRepository.persistTasksForAppScopeKey(getSharedPreferences(), entry.getKey());
    }
  }

  private void removeAppFromConfig(String appScopeKey) {
    getSharedPreferences().edit().remove(appScopeKey).apply();
  }

  /**
   * Returns task manager for given appScopeKey. Task managers initialized in non-headless contexts have precedence over headless one.
   */
  @Nullable
  private TaskManagerInterface getTaskManager(String appScopeKey) {
    WeakReference<TaskManagerInterface> weakRef = sTaskManagers.get(appScopeKey);
    TaskManagerInterface taskManager = weakRef == null ? null : weakRef.get();

    if (taskManager == null) {
      weakRef = sHeadlessTaskManagers.get(appScopeKey);
    }
    return weakRef == null ? null : weakRef.get();
  }

  private void invalidateAppRecord(String appScopeKey) {
    HeadlessAppLoader appLoader = getAppLoader();
    if (appLoader != null) {
      if (getAppLoader().invalidateApp(appScopeKey)) {
        sHeadlessTaskManagers.remove(appScopeKey);
      }
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

}
