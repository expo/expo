package expo.modules.notifications.notifications.handling;

import android.content.Context;

import org.json.JSONObject;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import expo.modules.notifications.notifications.emitting.NotificationsEmitter;
import expo.modules.notifications.notifications.interfaces.NotificationListener;
import expo.modules.notifications.notifications.interfaces.NotificationManager;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;

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
    task.handleResponse(new ExpoNotificationBehavior(behavior), promise);
  }

  /**
   * Callback called by {@link NotificationManager} to inform its listeners of new messages.
   * Starts up a new {@link SingleNotificationHandlerTask} which will take it on from here.
   *
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param trigger    Notification trigger
   */
  @Override
  public void onNotificationReceived(String identifier, JSONObject request, NotificationTrigger trigger) {
    SingleNotificationHandlerTask task = new SingleNotificationHandlerTask(getContext(), mModuleRegistry, identifier, request, trigger, this);
    mTasksMap.put(task.getIdentifier(), task);
    task.start();
  }

  /**
   * Callback called by {@link NotificationManager} to inform that some push notifications
   * haven't been delivered to the app. It doesn't make sense to react to this event in this class.
   * Apps get notified of this event by {@link NotificationsEmitter}.
   */
  @Override
  public void onNotificationsDropped() {
    // do nothing
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
