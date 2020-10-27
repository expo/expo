package abi38_0_0.expo.modules.notifications.notifications.handling;

import android.content.Context;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import abi38_0_0.expo.modules.notifications.notifications.emitting.NotificationsEmitter;
import abi38_0_0.org.unimodules.core.ExportedModule;
import abi38_0_0.org.unimodules.core.ModuleRegistry;
import abi38_0_0.org.unimodules.core.Promise;
import abi38_0_0.org.unimodules.core.arguments.ReadableArguments;
import abi38_0_0.org.unimodules.core.interfaces.ExpoMethod;
import expo.modules.notifications.notifications.interfaces.NotificationListener;
import expo.modules.notifications.notifications.interfaces.NotificationManager;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationResponse;

/**
 * {@link NotificationListener} responsible for managing app's reaction to incoming
 * notification.
 * <p>
 * It is responsible for managing lifecycles of {@link SingleNotificationHandlerTask}s
 * which are responsible: one for each notification. This module serves as holder
 * for all of them and a proxy through which app responds with the behavior.
 */
public class NotificationsHandler extends ExportedModule implements NotificationListener {
  private final static String EXPORTED_NAME = "ExpoNotificationsHandlerModule";

  private static final String SHOULD_SHOW_ALERT_KEY = "shouldShowAlert";
  private static final String SHOULD_PLAY_SOUND_KEY = "shouldPlaySound";
  private static final String SHOULD_SET_BADGE_KEY = "shouldSetBadge";
  private static final String PRIORITY_KEY = "priority";

  private NotificationManager mNotificationManager;
  private ModuleRegistry mModuleRegistry;

  private Map<String, SingleNotificationHandlerTask> mTasksMap = new HashMap<>();

  public NotificationsHandler(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;

    // Register the module as a listener in NotificationManager singleton module.
    // Deregistration happens in onDestroy callback.
    mNotificationManager = moduleRegistry.getSingletonModule("NotificationManager", NotificationManager.class);
    mNotificationManager.addListener(this);
  }

  @Override
  public void onDestroy() {
    mNotificationManager.removeListener(this);
    Collection<SingleNotificationHandlerTask> tasks = mTasksMap.values();
    for (SingleNotificationHandlerTask task : tasks) {
      task.stop();
    }
  }

  /**
   * Called by the app with {@link ReadableArguments} representing requested behavior
   * that should be applied to the notification.
   *
   * @param identifier Identifier of the task which asked for behavior.
   * @param behavior   Behavior to apply to the notification.
   * @param promise    Promise to resolve once the notification is successfully presented
   *                   or fails to be presented.
   */
  @ExpoMethod
  public void handleNotificationAsync(String identifier, final ReadableArguments behavior, Promise promise) {
    SingleNotificationHandlerTask task = mTasksMap.get(identifier);
    if (task == null) {
      String message = String.format("Failed to handle notification %s, it has already been handled.", identifier);
      promise.reject("ERR_NOTIFICATION_HANDLED", message);
      return;
    }
    boolean shouldShowAlert = behavior.getBoolean(SHOULD_SHOW_ALERT_KEY);
    boolean shouldPlaySound = behavior.getBoolean(SHOULD_PLAY_SOUND_KEY);
    boolean shouldSetBadge = behavior.getBoolean(SHOULD_SET_BADGE_KEY);
    String priorityOverride = behavior.getString(PRIORITY_KEY);
    task.handleResponse(new NotificationBehavior(shouldShowAlert, shouldPlaySound, shouldSetBadge, priorityOverride), promise);
  }

  /**
   * Callback called by {@link NotificationManager} to inform its listeners of new messages.
   * Starts up a new {@link SingleNotificationHandlerTask} which will take it on from here.
   *
   * @param notification Notification received
   */
  @Override
  public void onNotificationReceived(Notification notification) {
    SingleNotificationHandlerTask task = new SingleNotificationHandlerTask(getContext(), mModuleRegistry, notification, this);
    mTasksMap.put(task.getIdentifier(), task);
    task.start();
  }

  /**
   * Callback called once {@link SingleNotificationHandlerTask} finishes.
   * A cue for removal of the task.
   *
   * @param task Task that just fulfilled its responsibility.
   */
  void onTaskFinished(SingleNotificationHandlerTask task) {
    mTasksMap.remove(task.getIdentifier());
  }
}
