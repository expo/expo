package expo.modules.notifications.notifications.handling

import android.os.Handler
import android.os.HandlerThread
import expo.modules.core.ModuleRegistry
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.notifications.NotificationWasAlreadyHandledException
import expo.modules.notifications.notifications.interfaces.NotificationListener
import expo.modules.notifications.notifications.interfaces.NotificationManager
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior

class NotificationBehaviourRecord : Record {
  @Field
  val shouldShowAlert: Boolean = false

  @Field
  val shouldPlaySound: Boolean = false

  @Field
  val shouldSetBadge: Boolean = false

  @Field
  val priority: String? = null
}

/**
 * [NotificationListener] responsible for managing app's reaction to incoming
 * notification.
 *
 *
 * It is responsible for managing lifecycles of [SingleNotificationHandlerTask]s
 * which are responsible: one for each notification. This module serves as holder
 * for all of them and a proxy through which app responds with the behavior.
 */
open class NotificationsHandler : Module(), NotificationListener {
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

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationsHandlerModule")

    Events(
      "onHandleNotification",
      "onHandleNotificationTimeout"
    )

    OnCreate {
      moduleRegistry = appContext.legacyModuleRegistry

      // Register the module as a listener in NotificationManager singleton module.
      // Deregistration happens in onDestroy callback.
      notificationManager = requireNotNull(moduleRegistry.getSingletonModule("NotificationManager", NotificationManager::class.java))
      notificationManager.addListener(this@NotificationsHandler)
      notificationsHandlerThread = HandlerThread("NotificationsHandlerThread - " + this.javaClass.toString())
      notificationsHandlerThread.start()
      handler = Handler(notificationsHandlerThread.looper)
    }

    OnDestroy {
      notificationManager.removeListener(this@NotificationsHandler)

      tasksMap.values.forEach(SingleNotificationHandlerTask::stop)

      // We don't have to use `quitSafely` here, cause all tasks were stopped
      notificationsHandlerThread.quit()
    }

    AsyncFunction("handleNotificationAsync", this@NotificationsHandler::handleNotificationAsync)
  }

  /**
   * Called by the app with [NotificationBehaviourRecord] representing requested behavior
   * that should be applied to the notification.
   *
   * @param identifier Identifier of the task which asked for behavior.
   * @param behavior   Behavior to apply to the notification.
   * @param promise    Promise to resolve once the notification is successfully presented
   * or fails to be presented.
   */
  private fun handleNotificationAsync(identifier: String, behavior: NotificationBehaviourRecord, promise: Promise) {
    val task = tasksMap[identifier]
      ?: throw NotificationWasAlreadyHandledException(identifier)

    with(behavior) {
      task.processNotificationWithBehavior(
        NotificationBehavior(shouldShowAlert, shouldPlaySound, shouldSetBadge, priority),
        promise
      )
    }
  }

  /**
   * Callback called by [NotificationManager] to inform its listeners of new messages.
   * Starts up a new [SingleNotificationHandlerTask] which will take it on from here.
   *
   * SingleNotificationHandlerTask.processNotificationWithBehavior can then present it
   *
   * @param notification Notification received
   */
  override fun onNotificationReceived(notification: Notification) {
    val context = appContext.reactContext ?: return
    val task = SingleNotificationHandlerTask(
      context,
      appContext.eventEmitter(this),
      handler,
      notification,
      this
    )
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
