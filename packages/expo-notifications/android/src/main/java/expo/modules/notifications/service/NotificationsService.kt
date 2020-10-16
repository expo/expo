package expo.modules.notifications.service

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Parcelable
import android.os.ResultReceiver
import android.util.Log
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.service.delegates.ExpoCategoriesDelegate
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import expo.modules.notifications.service.interfaces.CategoriesDelegate
import expo.modules.notifications.service.interfaces.HandlingDelegate
import expo.modules.notifications.service.interfaces.PresentationDelegate

/**
 * Subclass of FirebaseMessagingService, central dispatcher for all the notifications-related actions.
 */
open class NotificationsService : BroadcastReceiver() {
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
    private const val GET_CATEGORIES_TYPE = "getCategories"
    private const val SET_CATEGORY_TYPE = "setCategory"
    private const val DELETE_CATEGORY_TYPE = "deleteCategory"

    // Messages parts
    const val SUCCESS_CODE = 0
    const val ERROR_CODE = 1
    const val EVENT_TYPE_KEY = "type"
    const val EXCEPTION_KEY = "exception"
    const val RECEIVER_KEY = "receiver"

    // Specific messages parts
    const val NOTIFICATION_KEY = "notification"
    const val NOTIFICATION_RESPONSE_KEY = "notificationResponse"
    const val SUCCEEDED_KEY = "succeeded"
    const val IDENTIFIERS_KEY = "identifiers"
    const val IDENTIFIER_KEY = "identifier"
    const val NOTIFICATION_BEHAVIOR_KEY = "notificationBehavior"
    const val NOTIFICATIONS_KEY = "notifications"
    const val NOTIFICATION_CATEGORY_KEY = "notificationCategory"
    const val NOTIFICATION_CATEGORIES_KEY = "notificationCategories"

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
     * A helper function for dispatching a "get notification categories" command to the service.
     *
     * @param context Context where to start the service.
     */
    fun getCategories(context: Context, receiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(
          NOTIFICATION_EVENT_ACTION,
          getUriBuilder()
            .appendPath("categories")
            .build()
        ).also {
          it.putExtra(EVENT_TYPE_KEY, GET_CATEGORIES_TYPE)
          it.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * A helper function for dispatching a "set notification category" command to the service.
     *
     * @param context  Context where to start the service.
     * @param category Notification category to be set
     */
    fun setCategory(context: Context, category: NotificationCategory, receiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(
          NOTIFICATION_EVENT_ACTION,
          getUriBuilder()
            .appendPath("categories")
            .appendPath(category.identifier)
            .build()
        ).also {
          it.putExtra(EVENT_TYPE_KEY, SET_CATEGORY_TYPE)
          it.putExtra(NOTIFICATION_CATEGORY_KEY, category as Parcelable)
          it.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * A helper function for dispatching a "delete notification category" command to the service.
     *
     * @param context    Context where to start the service.
     * @param identifier Category Identifier
     */
    fun deleteCategory(context: Context, identifier: String, receiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(
          NOTIFICATION_EVENT_ACTION,
          getUriBuilder()
            .appendPath("categories")
            .appendPath(identifier)
            .build()
        ).also {
          it.putExtra(EVENT_TYPE_KEY, DELETE_CATEGORY_TYPE)
          it.putExtra(IDENTIFIER_KEY, identifier)
          it.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * Sends the intent to the best service to handle the {@link #NOTIFICATION_EVENT_ACTION} intent
     * or handles the intent immediately if the service is already up.
     *
     * @param context Context where to start the service
     * @param intent  Intent to dispatch
     */
    fun doWork(context: Context, intent: Intent) {
      val searchIntent = Intent(intent.action).setPackage(context.packageName)
      context.packageManager.queryBroadcastReceivers(searchIntent, 0).firstOrNull()?.activityInfo?.let {
        intent.component = ComponentName(it.packageName, it.name)
        context.sendBroadcast(intent)
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
  }

  protected open fun getPresentationDelegate(context: Context): PresentationDelegate =
    ExpoPresentationDelegate(context)

  protected open fun getHandlingDelegate(context: Context): HandlingDelegate =
    ExpoHandlingDelegate(context)

  protected open fun getCategoriesDelegate(context: Context): CategoriesDelegate =
    ExpoCategoriesDelegate(context)

  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action === NOTIFICATION_EVENT_ACTION) {
      val receiver: ResultReceiver? = intent.extras?.get(RECEIVER_KEY) as? ResultReceiver
      try {
        var resultData: Bundle? = null
        when (val eventType = intent.getStringExtra(EVENT_TYPE_KEY)) {
          GET_ALL_DISPLAYED_TYPE ->
            resultData = onGetAllPresentedNotifications(context, intent)

          RECEIVE_TYPE -> onReceiveNotification(context, intent)

          RECEIVE_RESPONSE_TYPE -> onReceiveNotificationResponse(context, intent)

          DROPPED_TYPE -> onNotificationsDropped(context, intent)

          PRESENT_TYPE -> onPresentNotification(context, intent)

          DISMISS_SELECTED_TYPE -> onDismissNotifications(context, intent)

          DISMISS_ALL_TYPE -> onDismissAllNotifications(context, intent)

          GET_CATEGORIES_TYPE ->
            resultData = onGetCategories(context, intent)

          SET_CATEGORY_TYPE ->
            resultData = onSetCategory(context, intent)

          DELETE_CATEGORY_TYPE ->
            resultData = onDeleteCategory(context, intent)

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
      throw IllegalArgumentException("Received intent of unrecognized action: ${intent?.action}. Ignoring.")
    }
  }

  //region Presenting notifications

  open fun onPresentNotification(context: Context, intent: Intent) =
    getPresentationDelegate(context).presentNotification(
      intent.extras?.getParcelable(NOTIFICATION_KEY)!!,
      intent.extras?.getParcelable(NOTIFICATION_BEHAVIOR_KEY)
    )

  open fun onGetAllPresentedNotifications(context: Context, intent: Intent) =
    Bundle().also {
      it.putParcelableArrayList(
        NOTIFICATIONS_KEY,
        ArrayList(
          getPresentationDelegate(context).getAllPresentedNotifications()
        )
      )
    }

  open fun onDismissNotifications(context: Context, intent: Intent) =
    getPresentationDelegate(context).dismissNotifications(
      intent.extras?.getStringArray(IDENTIFIERS_KEY)!!.asList()
    )

  open fun onDismissAllNotifications(context: Context, intent: Intent) =
    getPresentationDelegate(context).dismissAllNotifications()

  //endregion

  //region Handling notifications

  open fun onReceiveNotification(context: Context, intent: Intent) =
    getHandlingDelegate(context).handleNotification(
      intent.getParcelableExtra(NOTIFICATION_KEY)!!
    )

  open fun onReceiveNotificationResponse(context: Context, intent: Intent) =
    getHandlingDelegate(context).handleNotificationResponse(
      intent.getParcelableExtra(NOTIFICATION_RESPONSE_KEY)!!
    )

  open fun onNotificationsDropped(context: Context, intent: Intent) =
    getHandlingDelegate(context).handleNotificationsDropped()

  //endregion

  //region Category handling

  open fun onGetCategories(context: Context, intent: Intent) =
    Bundle().also {
      it.putParcelableArrayList(
        NOTIFICATION_CATEGORIES_KEY,
        ArrayList(
          getCategoriesDelegate(context).getCategories()
        )
      )
    }

  open fun onSetCategory(context: Context, intent: Intent) =
    Bundle().also {
      it.putParcelable(
        NOTIFICATION_CATEGORY_KEY,
        getCategoriesDelegate(context).setCategory(
          intent.getParcelableExtra(NOTIFICATION_CATEGORY_KEY)!!
        )
      )
    }

  open fun onDeleteCategory(context: Context, intent: Intent) =
    Bundle().also {
      it.putBoolean(
        SUCCEEDED_KEY,
        getCategoriesDelegate(context).deleteCategory(
          intent.extras?.getString(IDENTIFIER_KEY)!!
        )
      )
    }
  //endregion
}
