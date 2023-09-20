package expo.modules.notifications.notifications.handling

import android.content.Context
import android.os.Handler
import android.os.HandlerThread
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.notifications.notifications.interfaces.NotificationListener
import expo.modules.notifications.notifications.interfaces.NotificationManager
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior

private const val SHOULD_SHOW_ALERT_KEY = "shouldShowAlert"
private const val SHOULD_PLAY_SOUND_KEY = "shouldPlaySound"
private const val SHOULD_SET_BADGE_KEY = "shouldSetBadge"
private const val PRIORITY_KEY = "priority"

/**
 * [NotificationListener] responsible for managing app's reaction to incoming
 * notification.
 *
 *
 * It is responsible for managing lifecycles of [SingleNotificationHandlerTask]s
 * which are responsible: one for each notification. This module serves as holder
 * for all of them and a proxy through which app responds with the behavior.
 */
open class NotificationsHandler(context: Context) : ExportedModule(context), NotificationListener {
  private lateinit var notificationManager: NotificationManager
  private lateinit var moduleRegistry: ModuleRegistry

  /**
   * [HandlerThread] which is the host to the notifications handler.
   */
  private lateinit var notificationsHandlerThread: HandlerThread

  /**
   * [Handler] on which lifecycle events are executed.
   */
  private lateinit var handler: Handler

  private val tasksMap = mutableMapOf<String, SingleNotificationHandlerTask>()

  override fun getName(): String = "ExpoNotificationsHandlerModule"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry

    // Register the module as a listener in NotificationManager singleton module.
    // Deregistration happens in onDestroy callback.
    notificationManager = requireNotNull(moduleRegistry.getSingletonModule("NotificationManager", NotificationManager::class.java))
    notificationManager.addListener(this)
    notificationsHandlerThread = HandlerThread("NotificationsHandlerThread - " + this.javaClass.toString())
    notificationsHandlerThread.start()
    handler = Handler(notificationsHandlerThread.looper)
  }

  override fun onDestroy() {
    notificationManager.removeListener(this)

    tasksMap.values.forEach(SingleNotificationHandlerTask::stop)

    // We don't have to use `quitSafely` here, cause all tasks were stopped
    notificationsHandlerThread.quit()
  }

  /**
   * Called by the app with [ReadableArguments] representing requested behavior
   * that should be applied to the notification.
   *
   * @param identifier Identifier of the task which asked for behavior.
   * @param behavior   Behavior to apply to the notification.
   * @param promise    Promise to resolve once the notification is successfully presented
   * or fails to be presented.
   */
  @ExpoMethod
  fun handleNotificationAsync(identifier: String, behavior: ReadableArguments, promise: Promise) {
    val task = tasksMap[identifier]
    if (task == null) {
      promise.reject("ERR_NOTIFICATION_HANDLED", "Failed to handle notification $identifier, it has already been handled.")
      return
    }
    val shouldShowAlert = behavior.getBoolean(SHOULD_SHOW_ALERT_KEY)
    val shouldPlaySound = behavior.getBoolean(SHOULD_PLAY_SOUND_KEY)
    val shouldSetBadge = behavior.getBoolean(SHOULD_SET_BADGE_KEY)
    val priorityOverride = behavior.getString(PRIORITY_KEY)
    task.handleResponse(NotificationBehavior(shouldShowAlert, shouldPlaySound, shouldSetBadge, priorityOverride), promise)
  }

  /**
   * Callback called by [NotificationManager] to inform its listeners of new messages.
   * Starts up a new [SingleNotificationHandlerTask] which will take it on from here.
   *
   * @param notification Notification received
   */
  override fun onNotificationReceived(notification: Notification) {
    val task = SingleNotificationHandlerTask(context, handler, moduleRegistry, notification, this)
    tasksMap[task.identifier] = task
    task.start()
  }

  /**
   * Callback called once [SingleNotificationHandlerTask] finishes.
   * A cue for removal of the task.
   *
   * @param task Task that just fulfilled its responsibility.
   */
  fun onTaskFinished(task: SingleNotificationHandlerTask) {
    tasksMap.remove(task.identifier)
  }
}
