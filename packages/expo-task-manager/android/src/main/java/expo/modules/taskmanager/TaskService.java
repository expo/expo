package expo.modules.taskmanager;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PersistableBundle;
import android.os.SystemClock;
import android.util.Log;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactInstanceEventListener;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import expo.modules.apploader.AppLoaderProvider;
import expo.modules.apploader.HeadlessAppLoader;
import expo.modules.core.interfaces.SingletonModule;
import expo.modules.interfaces.taskManager.TaskConsumerInterface;
import expo.modules.interfaces.taskManager.TaskExecutionCallback;
import expo.modules.interfaces.taskManager.TaskInterface;
import expo.modules.interfaces.taskManager.TaskManagerInterface;
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface;
import expo.modules.interfaces.taskManager.TaskServiceInterface;
import expo.modules.taskmanager.exceptions.InvalidConsumerClassException;
import expo.modules.taskmanager.exceptions.TaskNotFoundException;
import expo.modules.taskmanager.exceptions.TaskRegisteringFailedException;
import expo.modules.taskmanager.repository.TasksAndEventsRepository;

import static expo.modules.taskmanager.Utils.getConsumerVersion;
import static expo.modules.taskmanager.Utils.jsonToMap;
import static expo.modules.taskmanager.Utils.unversionedClassForClass;

// @tsapeta: TaskService is a funny kind of singleton module... because it's actually not a singleton :D
// Since it would make too much troubles in order to get the singleton instance (from ModuleRegistryProvider)
// in classes like TaskJobService and TaskBroadcastReceiver, almost all properties of TaskService are static.
// Thanks to that, we can instantiate new TaskService in those classes, that has just its own context and all other resources are shared.

public class TaskService implements SingletonModule, TaskServiceInterface {
  private static final String TAG = "TaskService";
  private static final String SHARED_PREFERENCES_NAME = "TaskManagerModule";
  private static final int MAX_TASK_EXECUTION_TIME_MS = 15000; // 15 seconds

  // Android can stop a job or a worker after 10 minutes, so no consumer waits longer for a task.
  private static final long HEADLESS_TASK_TIMEOUT_MS = 10 * 60 * 1000;
  private static final long EVENT_DELIVERY_TIMEOUT_MS = 2 * 60 * 1000;

  static final String ERR_TASK_NOT_DELIVERED = "ERR_TASK_NOT_DELIVERED";
  static final String ERR_TASK_INTERRUPTED = "ERR_TASK_INTERRUPTED";

  // The owner of an event that is failing, so that no task manager can claim it.
  private static final Object FAILED_EVENT_OWNER = new Object();

  private static final Handler sMainHandler = new Handler(Looper.getMainLooper());

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

  // { "<eventId>": EventState }
  // A lock on sEvents guards sEvents, sEventStates, sTaskCallbacks, the task manager maps and the events
  // queue of mTasksAndEventsRepository. Do not call a task manager, a callback or React Native under it.
  private static final Map<String, EventState> sEventStates = new HashMap<>();

  // Tracks headless JS task IDs per eventId, used to keep JS timers alive
  // during background task execution. See ensureKeepalive(). Accessed only from the UI thread.
  private static final Map<String, HeadlessTask> sHeadlessTaskIds = new HashMap<>();

  // App scope keys that wait for a React context to start their headless JS tasks. Accessed only from the UI thread.
  private static final Set<String> sAppsWaitingForReactContext = new HashSet<>();

  private static class EventState {
    final String appScopeKey;
    final String taskName;
    // The task manager that delivers the event to JS, or null while the event is pending.
    Object owner;

    EventState(String appScopeKey, String taskName) {
      this.appScopeKey = appScopeKey;
      this.taskName = taskName;
    }
  }

  private static class HeadlessTask {
    final int taskId;
    final WeakReference<ReactContext> reactContextRef;

    HeadlessTask(int taskId, ReactContext reactContext) {
      this.taskId = taskId;
      this.reactContextRef = new WeakReference<>(reactContext);
    }
  }

  public TaskService(Context context) {
    super();
    mContextRef = new WeakReference<>(context.getApplicationContext());
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

    Log.i(TAG, "Finished task '" + taskName + "' with eventId '" + eventId + "'.");

    finishEvent(eventId, response);
  }

  @Override
  public void setTaskManager(TaskManagerInterface taskManager, String appScopeKey, String appUrl) {
    // It may be called with null when the host activity is destroyed.
    if (taskManager == null) {
      synchronized (sEvents) {
        sTaskManagers.remove(appScopeKey);
        sHeadlessTaskManagers.remove(appScopeKey);
      }
      return;
    }

    // Determine in which table the task manager will be stored.
    // Having two tables for them is to prevent race condition problems,
    // when both foreground and background apps are launching at the same time.
    boolean isHeadless = isStartedByHeadlessLoader(appScopeKey);
    Map<String, WeakReference<TaskManagerInterface>> taskManagers = isHeadless ? sHeadlessTaskManagers : sTaskManagers;
    List<Bundle> eventsQueue;

    synchronized (sEvents) {
      // Set task manager in appropriate map.
      taskManagers.put(appScopeKey, new WeakReference<>(taskManager));

      eventsQueue = mTasksAndEventsRepository.getEvents(appScopeKey);

      // Remove events queue for that app.
      mTasksAndEventsRepository.removeEvents(appScopeKey);
    }

    // Execute events waiting for the task manager.
    if (eventsQueue != null) {
      for (Bundle body : eventsQueue) {
        if (taskManager instanceof TaskManagerInternalModule || claimEvent(getEventId(body), taskManager)) {
          taskManager.executeTaskWithBody(body);
        }
      }
    }

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

    if (task != null) {
      TaskConsumerInterface consumer = task.getConsumer();

      if (consumer == null) {
        return false;
      }

      Log.i(TAG, "Job for task '" + taskName + "' has been cancelled by the system.");

      return consumer.didCancelJob(jobService, params);
    }

    // `false` = don't reschedule the job.
    return false;
  }

  public void executeTask(TaskInterface task, Bundle data, Error error, TaskExecutionCallback callback) {
    String appScopeKey = task.getAppScopeKey();
    Bundle body = createExecutionEventBody(task, data, error);
    Bundle executionInfo = body.getBundle("executionInfo");

    if (executionInfo == null) {
      // it should never happen, just to suppress warnings :)
      return;
    }

    String eventId = executionInfo.getString("eventId");
    EventState state = new EventState(appScopeKey, task.getName());
    TaskManagerInterface taskManager;

    synchronized (sEvents) {
      if (callback != null) {
        sTaskCallbacks.put(eventId, callback);
      }
      sEventStates.put(eventId, state);

      List<String> appEvents = sEvents.get(appScopeKey);
      if (appEvents == null) {
        appEvents = new ArrayList<>();
        sEvents.put(appScopeKey, appEvents);
      }
      appEvents.add(eventId);

      taskManager = getTaskManager(appScopeKey);

      if (taskManager == null) {
        // The app is not fully loaded as its task manager is not there yet.
        // We need to add event's body to the queue from which events will be executed once the task manager is ready.
        if (!mTasksAndEventsRepository.hasEvents(appScopeKey)) {
          mTasksAndEventsRepository.putEvents(appScopeKey, new ArrayList<>());
        }
        mTasksAndEventsRepository.putEventForAppScopeKey(appScopeKey, body);
      } else if (!(taskManager instanceof TaskManagerInternalModule)) {
        // TaskManagerInternalModule claims the event when JS observes it.
        state.owner = taskManager;
      }
    }

    // Arm the timeout before loadApp, which can throw.
    sMainHandler.postAtTime(() -> failIfUndelivered(eventId), state, SystemClock.uptimeMillis() + EVENT_DELIVERY_TIMEOUT_MS);

    // Register with HeadlessJsTaskContext to keep JS timers alive while
    // the app is backgrounded. Without this, JavaTimerManager pauses all
    // timers when the Activity is paused (isPaused=true && isRunningTasks=false),
    // causing all async JS operations (promises, setTimeout) to hang.
    ensureKeepalive(eventId);

    if (taskManager != null) {
      taskManager.executeTaskWithBody(body);
      return;
    }

    getAppLoader().loadApp(mContextRef.get(),
      new HeadlessAppLoader.Params(appScopeKey, task.getAppUrl()),
      () -> {
      },
      success -> {
        if (!success) {
          List<String> pendingEventIds = new ArrayList<>();
          synchronized (sEvents) {
            for (Map.Entry<String, EventState> entry : sEventStates.entrySet()) {
              if (entry.getValue().owner == null && Objects.equals(entry.getValue().appScopeKey, appScopeKey)) {
                pendingEventIds.add(entry.getKey());
              }
            }
            mTasksAndEventsRepository.removeEvents(appScopeKey);
          }
          for (String pendingEventId : pendingEventIds) {
            failEventNow(pendingEventId, null, ERR_TASK_NOT_DELIVERED, "did not run, because the app did not load.");
          }

          // Host unreachable? Unregister all tasks for that app.
          unregisterAllTasksForAppScopeKey(appScopeKey);
        }
      }
    );
  }

  /**
   * Marks a pending event as delivered by the given task manager. Returns false if the event already finished or
   * another task manager claimed it.
   */
  boolean claimEvent(String eventId, Object owner) {
    synchronized (sEvents) {
      EventState state = sEventStates.get(eventId);
      if (state == null || state.owner != null) {
        return false;
      }
      state.owner = owner;
    }
    ensureKeepalive(eventId);
    return true;
  }

  /**
   * Fails the event on the UI thread if it is pending or the given task manager claimed it.
   */
  void failEvent(String eventId, Object owner, String code, String reason) {
    sMainHandler.post(() -> failEventNow(eventId, owner, code, reason));
  }

  /**
   * Fails the events that the given task manager claimed, on the UI thread.
   */
  void failEventsClaimedBy(Object owner, String code, String reason) {
    sMainHandler.post(() -> {
      List<String> claimedEventIds = new ArrayList<>();
      synchronized (sEvents) {
        for (Map.Entry<String, EventState> entry : sEventStates.entrySet()) {
          if (entry.getValue().owner == owner) {
            claimedEventIds.add(entry.getKey());
          }
        }
      }
      for (String claimedEventId : claimedEventIds) {
        failEventNow(claimedEventId, owner, code, reason);
      }
    });
  }

  private void finishEvent(String eventId, Map<String, Object> response) {
    EventState state;
    TaskExecutionCallback taskCallback;
    boolean isLastAppEvent = false;

    synchronized (sEvents) {
      state = sEventStates.remove(eventId);
      if (state == null) {
        return;
      }
      taskCallback = sTaskCallbacks.remove(eventId);

      List<String> appEvents = sEvents.get(state.appScopeKey);
      if (appEvents != null) {
        appEvents.remove(eventId);
        if (appEvents.isEmpty()) {
          sEvents.remove(state.appScopeKey);
          isLastAppEvent = true;
        }
      }
    }

    sMainHandler.removeCallbacksAndMessages(state);
    maybeFinishHeadlessTask(eventId);

    if (isLastAppEvent) {
      // Invalidate app record but after 2 seconds delay so we can still take batched events.
      sMainHandler.postDelayed(() -> {
        boolean hasEvents;
        synchronized (sEvents) {
          hasEvents = sEvents.containsKey(state.appScopeKey);
        }
        if (!hasEvents) {
          invalidateAppRecord(state.appScopeKey);
        }
      }, 2000);
    }

    // Invoke task callback
    if (taskCallback != null) {
      taskCallback.onFinished(response);
    }
  }

  static String getEventId(Bundle body) {
    Bundle executionInfo = body.getBundle("executionInfo");
    return executionInfo != null ? executionInfo.getString("eventId") : null;
  }

  //endregion
  //region helpers

  private void failIfUndelivered(String eventId) {
    failEventNow(eventId, null, ERR_TASK_NOT_DELIVERED, "did not run, because its event '" + eventId
      + "' did not reach JavaScript in " + EVENT_DELIVERY_TIMEOUT_MS / 1000 + " seconds. "
      + "Make sure that a module the app imports at startup calls TaskManager.defineTask in the global scope.");
  }

  private void failEventNow(String eventId, @Nullable Object owner, String code, String reason) {
    String taskName;
    synchronized (sEvents) {
      EventState state = sEventStates.get(eventId);
      if (state == null || (state.owner != null && state.owner != owner)) {
        return;
      }
      state.owner = FAILED_EVENT_OWNER;
      taskName = state.taskName;
    }

    String message = "Task '" + taskName + "' " + reason;
    Log.w(TAG, message + " Error code: " + code + ".");

    Map<String, Object> error = new HashMap<>();
    error.put("code", code);
    error.put("message", message);
    Map<String, Object> response = new HashMap<>();
    response.put("eventId", eventId);
    response.put("result", null);
    response.put("error", error);
    finishEvent(eventId, response);
  }

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

    if (appConfig != null && !appConfig.isEmpty()) {
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

      if (appUrl != null && tasksConfig != null && !tasksConfig.isEmpty()) {
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
      appLoader.invalidateApp(appScopeKey);
    }
  }

  private void finishJobAfterTimeout(final JobService jobService, final JobParameters params, long timeout) {
    Handler handler = new Handler();
    handler.postDelayed(() -> jobService.jobFinished(params, false), timeout);
  }

  /**
   * Registers a headless JS task with React Native's HeadlessJsTaskContext to signal that
   * background work is in progress. This prevents JavaTimerManager from pausing JS timers
   * when the Activity is backgrounded (isPaused=true), which would cause all async JS
   * operations (promises, setTimeout, etc.) to hang indefinitely.
   *
   * @see <a href="https://github.com/facebook/react-native/blob/63800af9438ea9ddaec84b6f17793a4f1bffe342/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/core/JavaTimerManager.kt#L291">JavaTimerManager timer guard</a>
   */
  private void ensureKeepalive(String eventId) {
    sMainHandler.post(() -> {
      String appScopeKey;
      synchronized (sEvents) {
        EventState state = sEventStates.get(eventId);
        if (state == null) {
          return;
        }
        appScopeKey = state.appScopeKey;
      }

      try {
        Context context = mContextRef.get();
        if (context == null) return;

        ReactContext reactContext = getReactContext(context);
        if (reactContext != null) {
          invokeStartHeadlessTask(reactContext, eventId);
        } else {
          // App was killed — context not ready yet. Listen for creation and start then.
          waitForReactContextAndStartTasks(context, appScopeKey);
        }
      } catch (Exception e) {
        Log.w(TAG, "Failed to start headless task: " + e.getMessage());
      }
    });
  }

  private void invokeStartHeadlessTask(ReactContext reactContext, String eventId) {
    HeadlessJsTaskContext headlessContext = HeadlessJsTaskContext.getInstance(reactContext);
    HeadlessTask headlessTask = sHeadlessTaskIds.get(eventId);
    if (headlessTask != null && headlessTask.reactContextRef.get() == reactContext && headlessContext.isTaskRunning(headlessTask.taskId)) {
      return;
    }
    synchronized (sEvents) {
      if (!sEventStates.containsKey(eventId)) {
        return;
      }
    }

    HeadlessJsTaskConfig taskConfig = new HeadlessJsTaskConfig(
      "expo-task-manager",
      new WritableNativeMap(),
      HEADLESS_TASK_TIMEOUT_MS,
      true // allow in foreground to avoid exceptions if app returns
    );

    try {
      int taskId = headlessContext.startTask(taskConfig);
      sHeadlessTaskIds.put(eventId, new HeadlessTask(taskId, reactContext));
      Log.i(TAG, "Started headless task " + taskId + " to keep JS timers alive for event '" + eventId + "'");
    } catch (Exception e) {
      Log.w(TAG, "Failed to start headless task: " + e.getMessage());
    }
  }

  private void waitForReactContextAndStartTasks(Context context, String appScopeKey) {
    if (sAppsWaitingForReactContext.contains(appScopeKey)) return;

    ReactApplication app = (ReactApplication) context.getApplicationContext();
    ReactHost reactHost = app.getReactHost();
    if (reactHost == null) return;

    sAppsWaitingForReactContext.add(appScopeKey);
    reactHost.addReactInstanceEventListener(new ReactInstanceEventListener() {
      @Override
      public void onReactContextInitialized(@NonNull ReactContext reactContext) {
        reactHost.removeReactInstanceEventListener(this);
        UiThreadUtil.runOnUiThread(() -> {
          sAppsWaitingForReactContext.remove(appScopeKey);
          List<String> eventIds;
          synchronized (sEvents) {
            List<String> appEvents = sEvents.get(appScopeKey);
            eventIds = appEvents != null ? new ArrayList<>(appEvents) : new ArrayList<>();
          }
          for (String eventId : eventIds) {
            invokeStartHeadlessTask(reactContext, eventId);
          }
        });
      }
    });
  }

  /**
   * Finishes the headless JS task for the given event, allowing JavaTimerManager
   * to pause timers again when all background tasks are complete.
   */
  private void maybeFinishHeadlessTask(String eventId) {
    // Run on UI thread to match startTask and ensure sHeadlessTaskIds
    // is only accessed from the UI thread.
    UiThreadUtil.runOnUiThread(() -> {
      HeadlessTask headlessTask = sHeadlessTaskIds.remove(eventId);
      if (headlessTask == null) return;

      try {
        ReactContext reactContext = headlessTask.reactContextRef.get();
        if (reactContext == null) return;

        HeadlessJsTaskContext headlessContext = HeadlessJsTaskContext.getInstance(reactContext);
        headlessContext.finishTask(headlessTask.taskId);
        Log.i(TAG, "Finished headless task " + headlessTask.taskId + " for event '" + eventId + "'");
      } catch (Exception e) {
        Log.w(TAG, "Failed to finish headless task: " + e.getMessage());
      }
    });
  }

  /**
   * Gets the current ReactContext via ReactHost.
   */
  @Nullable
  private ReactContext getReactContext(Context context) {
    ReactApplication app = (ReactApplication) context.getApplicationContext();
    ReactHost reactHost = app.getReactHost();
    return reactHost != null ? reactHost.getCurrentReactContext() : null;
  }
}
