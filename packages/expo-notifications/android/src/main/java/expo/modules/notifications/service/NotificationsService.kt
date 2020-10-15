package expo.modules.notifications.service

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.ResultReceiver
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate
import expo.modules.notifications.service.interfaces.HandlingDelegate
import expo.modules.notifications.service.interfaces.PresentationDelegate

/**
 * Subclass of FirebaseMessagingService, central dispatcher for all the notifications-related actions.
 */
open class NotificationsService : FirebaseMessagingService() {
  companion object {
    const val NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT"

    // Event types
    private const val GET_ALL_DISPLAYED_TYPE = "getAllDisplayed"
    private const val PRESENT_TYPE = "present"
    private const val DISMISS_SELECTED_TYPE = "dismissSelected"
    private const val DISMISS_ALL_TYPE = "dismissAll"
    private const val RECEIVE_TYPE = "receive"
    private const val RECEIVE_RESPONSE_TYPE = "receiveResponse"
    private const val DROPPED_TYPE = "dropped"

    // Messages parts
    const val SUCCESS_CODE = 0
    const val ERROR_CODE = 1
    const val EVENT_TYPE_KEY = "type"
    const val EXCEPTION_KEY = "exception"
    const val RECEIVER_KEY = "receiver"

    // Specific messages parts
    const val NOTIFICATION_KEY = "notification"
    const val NOTIFICATION_RESPONSE_KEY = "notificationResponse"
    const val IDENTIFIERS_KEY = "identifiers"
    const val NOTIFICATION_BEHAVIOR_KEY = "notificationBehavior"
    const val NOTIFICATIONS_KEY = "notifications"

    /**
     * A helper function for dispatching a "fetch all displayed notifications" command to the service.
     *
     * @param context  Context where to start the service.
     * @param receiver A receiver to which send the notifications
     */
    fun getAllPresented(context: Context, receiver: ResultReceiver? = null) {
      doWork(context, Intent(NOTIFICATION_EVENT_ACTION, getUriBuilder().build()).also {
        it.putExtra(EVENT_TYPE_KEY, GET_ALL_DISPLAYED_TYPE)
        it.putExtra(RECEIVER_KEY, receiver)
      })
    }

    /**
     * A helper function for dispatching a "present notification" command to the service.
     *
     * @param context      Context where to start the service.
     * @param notification Notification to present
     * @param behavior     Allowed notification behavior
     * @param receiver     A receiver to which send the result of presenting the notification
     */
    fun present(context: Context, notification: Notification, behavior: NotificationBehavior? = null, receiver: ResultReceiver? = null) {
      val data = getUriBuilderForIdentifier(notification.notificationRequest.identifier).appendPath("present").build()
      doWork(context, Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
        intent.putExtra(EVENT_TYPE_KEY, PRESENT_TYPE)
        intent.putExtra(NOTIFICATION_KEY, notification)
        intent.putExtra(NOTIFICATION_BEHAVIOR_KEY, behavior)
        intent.putExtra(RECEIVER_KEY, receiver)
      })
    }

    /**
     * A helper function for dispatching a "notification received" command to the service.
     *
     * @param context      Context where to start the service.
     * @param notification Notification received
     * @param receiver     Result receiver
     */
    fun receive(context: Context, notification: Notification, receiver: ResultReceiver? = null) {
      val data = getUriBuilderForIdentifier(notification.notificationRequest.identifier).appendPath("receive").build()
      doWork(context, Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
        intent.putExtra(EVENT_TYPE_KEY, RECEIVE_TYPE)
        intent.putExtra(NOTIFICATION_KEY, notification)
        intent.putExtra(RECEIVER_KEY, receiver)
      })
    }

    /**
     * A helper function for dispatching a "notification response received" command to the service.
     *
     * @param context      Context where to start the service.
     * @param notificationResponse Notification response received
     * @param receiver     Result receiver
     */
    fun handleResponseReceived(context: Context, response: NotificationResponse, receiver: ResultReceiver? = null) {
      val data = getUriBuilderForIdentifier(response.notification.notificationRequest.identifier).appendPath("response").build()
      doWork(context, Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
        intent.putExtra(EVENT_TYPE_KEY, RECEIVE_TYPE)
        intent.putExtra(NOTIFICATION_RESPONSE_KEY, response)
        intent.putExtra(RECEIVER_KEY, receiver)
      })
    }

    /**
     * A helper function for dispatching a "dismiss notification" command to the service.
     *
     * @param context    Context where to start the service.
     * @param identifier Notification identifier
     * @param receiver   A receiver to which send the result of the action
     */
    fun dismiss(context: Context, identifiers: Array<String>, receiver: ResultReceiver? = null) {
      val data = getUriBuilder().appendPath("dismiss").build()
      doWork(context, Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
        intent.putExtra(EVENT_TYPE_KEY, DISMISS_SELECTED_TYPE)
        intent.putExtra(IDENTIFIERS_KEY, identifiers)
        intent.putExtra(RECEIVER_KEY, receiver)
      })
    }

    /**
     * A helper function for dispatching a "dismiss notification" command to the service.
     *
     * @param context    Context where to start the service.
     * @param receiver   A receiver to which send the result of the action
     */
    fun dismissAll(context: Context, receiver: ResultReceiver? = null) {
      val data = getUriBuilder().appendPath("dismiss").build()
      doWork(context, Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
        intent.putExtra(EVENT_TYPE_KEY, DISMISS_ALL_TYPE)
        intent.putExtra(RECEIVER_KEY, receiver)
      })
    }

    /**
     * A helper function for dispatching a "notifications dropped" command to the service.
     *
     * @param context Context where to start the service.
     */
    fun handleDropped(context: Context) {
      doWork(context, Intent(NOTIFICATION_EVENT_ACTION).also { intent ->
        intent.putExtra(EVENT_TYPE_KEY, DROPPED_TYPE)
      })
    }

    /**
     * Sends the intent to the best service to handle the {@link #NOTIFICATION_EVENT_ACTION} intent
     * or handles the intent immediately if the service is already up.
     *
     * @param context Context where to start the service
     * @param intent  Intent to dispatch
     */
    fun doWork(context: Context, intent: Intent) {
      currentService?.let {
        it.handleIntent(it.getStartCommandIntent(intent))
        return
      }
      val searchIntent = Intent(intent.action).setPackage(context.packageName)
      context.packageManager.resolveService(searchIntent, 0)?.serviceInfo?.let {
        intent.component = ComponentName(it.packageName, it.name)
        context.startService(intent)
        return
      }
      Log.e("expo-notifications", "No service capable of handling notifications found (intent = ${intent.action}). Ensure that you have configured your AndroidManifest.xml properly.")
    }

    protected fun getUriBuilder(): Uri.Builder {
      return Uri.parse("expo-notifications://notifications/").buildUpon()
    }

    protected fun getUriBuilderForIdentifier(identifier: String): Uri.Builder {
      return getUriBuilder().appendPath(identifier)
    }

    /**
     * Since starting new background services while the app is in background
     * is forbidden since Android 8 (see https://developer.android.com/about/versions/oreo/background#services),
     * we aren't allowed to use [startService] while the app is in background to dispatch actions,
     * otherwise the app is killed with "java.lang.IllegalStateException: Not allowed to start service".
     *
     * In order to overcome this we're going to hold a reference to this service
     * while it's alive (see [onCreate] and [onDestroy]). If the service is alive,
     * work that otherwise would have been dispatched via Android service system,
     * triggering the background execution limits or not, will be done immediately
     * and synchronously on the current service instance (see [doWork]).
     */
    private var currentService: NotificationsService? = null
  }

  protected open val firebaseMessagingDelegate: FirebaseMessagingDelegate by lazy {
    expo.modules.notifications.service.delegates.FirebaseMessagingDelegate(this)
  }
  protected open val presentationDelegate: PresentationDelegate by lazy {
    ExpoPresentationDelegate(this)
  }
  protected open val handlingDelegate: HandlingDelegate by lazy {
    ExpoHandlingDelegate(this)
  }

  override fun onCreate() {
    super.onCreate()
    currentService = this
  }

  override fun onDestroy() {
    currentService = null
    super.onDestroy()
  }

  override fun getStartCommandIntent(intent: Intent?): Intent {
    if (intent?.action === NOTIFICATION_EVENT_ACTION) {
      return intent
    }
    return super.getStartCommandIntent(intent)
  }

  override fun handleIntent(intent: Intent?) {
    if (intent?.action === NOTIFICATION_EVENT_ACTION) {
      val receiver: ResultReceiver? = intent.extras?.get(RECEIVER_KEY) as? ResultReceiver
      try {
        var resultData: Bundle? = null
        when (val eventType = intent.getStringExtra(EVENT_TYPE_KEY)) {
          GET_ALL_DISPLAYED_TYPE -> {
            resultData = Bundle().also {
              it.putParcelableArrayList(NOTIFICATIONS_KEY, ArrayList(onGetAllPresentedNotifications()))
            }
          }

          RECEIVE_TYPE -> onReceiveNotification(intent.getParcelableExtra(NOTIFICATION_KEY)!!)

          RECEIVE_RESPONSE_TYPE -> onReceiveNotificationResponse(intent.getParcelableExtra(NOTIFICATION_RESPONSE_KEY)!!)

          DROPPED_TYPE -> onNotificationsDropped()

          PRESENT_TYPE -> onPresentNotification(
            intent.extras?.getParcelable(NOTIFICATION_KEY)!!, // throw exception if empty
            intent.extras?.getParcelable(NOTIFICATION_BEHAVIOR_KEY)
          )

          DISMISS_SELECTED_TYPE -> onDismissNotifications(
            intent.extras?.getStringArray(IDENTIFIERS_KEY)!!.asList() // throw exception if empty
          )

          DISMISS_ALL_TYPE -> onDismissAllNotifications()

          else -> throw IllegalArgumentException("Received event of unrecognized type: $eventType. Ignoring.")
        }

        // If we ended up here, the callbacks must have completed successfully
        receiver?.send(SUCCESS_CODE, resultData)
      } catch (e: Exception) {
        Log.e("expo-notifications", "Action ${intent.action} failed: ${e.message}")
        e.printStackTrace()

        receiver?.send(ERROR_CODE, Bundle().also { it.putSerializable(EXCEPTION_KEY, e) })
      }
    } else {
      super.handleIntent(intent)
    }
  }

  open fun onPresentNotification(notification: Notification, behavior: NotificationBehavior?) = presentationDelegate.presentNotification(notification, behavior)
  open fun onGetAllPresentedNotifications() = presentationDelegate.getAllPresentedNotifications()
  open fun onDismissNotifications(identifiers: Collection<String>) = presentationDelegate.dismissNotifications(identifiers)
  open fun onDismissAllNotifications() = presentationDelegate.dismissAllNotifications()

  open fun onReceiveNotification(notification: Notification) = handlingDelegate.handleNotification(notification)
  open fun onReceiveNotificationResponse(response: NotificationResponse) = handlingDelegate.handleNotificationResponse(response)
  open fun onNotificationsDropped() = handlingDelegate.handleNotificationsDropped()

  override fun onMessageReceived(remoteMessage: RemoteMessage) = firebaseMessagingDelegate.onMessageReceived(remoteMessage)
  override fun onNewToken(token: String) = firebaseMessagingDelegate.onNewToken(token)
  override fun onDeletedMessages() = firebaseMessagingDelegate.onDeletedMessages()
}
