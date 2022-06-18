package expo.modules.notifications.service

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.*
import android.util.Log
import androidx.core.app.RemoteInput
import expo.modules.notifications.notifications.model.*
import expo.modules.notifications.service.delegates.ExpoCategoriesDelegate
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import expo.modules.notifications.service.delegates.ExpoSchedulingDelegate
import expo.modules.notifications.service.interfaces.CategoriesDelegate
import expo.modules.notifications.service.interfaces.HandlingDelegate
import expo.modules.notifications.service.interfaces.PresentationDelegate
import expo.modules.notifications.service.interfaces.SchedulingDelegate
import kotlin.concurrent.thread

/**
 * Subclass of FirebaseMessagingService, central dispatcher for all the notifications-related actions.
 */
open class NotificationsService : BroadcastReceiver() {
  companion object {
    const val NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT"
    val SETUP_ACTIONS = listOf(
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_REBOOT,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      "android.intent.action.QUICKBOOT_POWERON",
      "com.htc.intent.action.QUICKBOOT_POWERON"
    )
    const val USER_TEXT_RESPONSE_KEY = "userTextResponse"

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
    private const val SCHEDULE_TYPE = "schedule"
    private const val TRIGGER_TYPE = "trigger"
    private const val GET_ALL_SCHEDULED_TYPE = "getAllScheduled"
    private const val GET_SCHEDULED_TYPE = "getScheduled"
    private const val REMOVE_SELECTED_TYPE = "removeSelected"
    private const val REMOVE_ALL_TYPE = "removeAll"

    // Messages parts
    const val SUCCESS_CODE = 0
    const val ERROR_CODE = 1
    const val EVENT_TYPE_KEY = "type"
    const val EXCEPTION_KEY = "exception"
    const val RECEIVER_KEY = "receiver"

    // Specific messages parts
    const val NOTIFICATION_KEY = "notification"
    const val NOTIFICATION_RESPONSE_KEY = "notificationResponse"
    const val TEXT_INPUT_NOTIFICATION_RESPONSE_KEY = "textInputNotificationResponse"
    const val SUCCEEDED_KEY = "succeeded"
    const val IDENTIFIERS_KEY = "identifiers"
    const val IDENTIFIER_KEY = "identifier"
    const val NOTIFICATION_BEHAVIOR_KEY = "notificationBehavior"
    const val NOTIFICATIONS_KEY = "notifications"
    const val NOTIFICATION_CATEGORY_KEY = "notificationCategory"
    const val NOTIFICATION_CATEGORIES_KEY = "notificationCategories"
    const val NOTIFICATION_REQUEST_KEY = "notificationRequest"
    const val NOTIFICATION_REQUESTS_KEY = "notificationRequests"
    const val NOTIFICATION_ACTION_KEY = "notificationAction"

    /**
     * A helper function for dispatching a "fetch all displayed notifications" command to the service.
     *
     * @param context Context where to start the service.
     * @param receiver A receiver to which send the notifications
     */
    fun getAllPresented(context: Context, receiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION, getUriBuilder().build()).also {
          it.putExtra(EVENT_TYPE_KEY, GET_ALL_DISPLAYED_TYPE)
          it.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * A helper function for dispatching a "present notification" command to the service.
     *
     * @param context Context where to start the service.
     * @param notification Notification to present
     * @param behavior Allowed notification behavior
     * @param receiver A receiver to which send the result of presenting the notification
     */
    fun present(context: Context, notification: Notification, behavior: NotificationBehavior? = null, receiver: ResultReceiver? = null) {
      val data = getUriBuilderForIdentifier(notification.notificationRequest.identifier).appendPath("present").build()
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, PRESENT_TYPE)
          intent.putExtra(NOTIFICATION_KEY, notification)
          intent.putExtra(NOTIFICATION_BEHAVIOR_KEY, behavior)
          intent.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * A helper function for dispatching a "notification received" command to the service.
     *
     * @param context Context where to start the service.
     * @param notification Notification received
     * @param receiver Result receiver
     */
    fun receive(context: Context, notification: Notification, receiver: ResultReceiver? = null) {
      val data = getUriBuilderForIdentifier(notification.notificationRequest.identifier).appendPath("receive").build()
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, RECEIVE_TYPE)
          intent.putExtra(NOTIFICATION_KEY, notification)
          intent.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * A helper function for dispatching a "dismiss notification" command to the service.
     *
     * @param context Context where to start the service.
     * @param identifier Notification identifier
     * @param receiver A receiver to which send the result of the action
     */
    fun dismiss(context: Context, identifiers: Array<String>, receiver: ResultReceiver? = null) {
      val data = getUriBuilder().appendPath("dismiss").build()
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, DISMISS_SELECTED_TYPE)
          intent.putExtra(IDENTIFIERS_KEY, identifiers)
          intent.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * A helper function for dispatching a "dismiss notification" command to the service.
     *
     * @param context Context where to start the service.
     * @param receiver A receiver to which send the result of the action
     */
    fun dismissAll(context: Context, receiver: ResultReceiver? = null) {
      val data = getUriBuilder().appendPath("dismiss").build()
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION, data).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, DISMISS_ALL_TYPE)
          intent.putExtra(RECEIVER_KEY, receiver)
        }
      )
    }

    /**
     * A helper function for dispatching a "notifications dropped" command to the service.
     *
     * @param context Context where to start the service.
     */
    fun handleDropped(context: Context) {
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, DROPPED_TYPE)
        }
      )
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
     * @param context Context where to start the service.
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
     * @param context Context where to start the service.
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
     * Fetches all scheduled notifications asynchronously.
     *
     * @param context Context this is being called from
     * @param resultReceiver Receiver to be called with the results
     */
    fun getAllScheduledNotifications(context: Context, resultReceiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, GET_ALL_SCHEDULED_TYPE)
          intent.putExtra(RECEIVER_KEY, resultReceiver)
        }
      )
    }

    /**
     * Fetches scheduled notification asynchronously.
     *
     * @param context Context this is being called from
     * @param identifier Identifier of the notification to be fetched
     * @param resultReceiver Receiver to be called with the results
     */
    fun getScheduledNotification(context: Context, identifier: String, resultReceiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(
          NOTIFICATION_EVENT_ACTION,
          getUriBuilder()
            .appendPath("scheduled")
            .appendPath(identifier)
            .build()
        ).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, GET_SCHEDULED_TYPE)
          intent.putExtra(IDENTIFIER_KEY, identifier)
          intent.putExtra(RECEIVER_KEY, resultReceiver)
        }
      )
    }

    /**
     * Schedule notification asynchronously.
     *
     * @param context Context this is being called from
     * @param notificationRequest Notification request to schedule
     * @param resultReceiver Receiver to be called with the result
     */
    fun schedule(context: Context, notificationRequest: NotificationRequest, resultReceiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(
          NOTIFICATION_EVENT_ACTION,
          getUriBuilder()
            .appendPath("scheduled")
            .appendPath(notificationRequest.identifier)
            .build()
        ).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, SCHEDULE_TYPE)
          intent.putExtra(NOTIFICATION_REQUEST_KEY, notificationRequest as Parcelable)
          intent.putExtra(RECEIVER_KEY, resultReceiver)
        }
      )
    }

    /**
     * Cancel selected scheduled notification and remove it from the storage asynchronously.
     *
     * @param context Context this is being called from
     * @param identifier Identifier of the notification to be removed
     * @param resultReceiver Receiver to be called with the result
     */
    fun removeScheduledNotification(context: Context, identifier: String, resultReceiver: ResultReceiver? = null) =
      removeScheduledNotifications(context, listOf(identifier), resultReceiver)

    /**
     * Cancel selected scheduled notifications and remove them from the storage asynchronously.
     *
     * @param context Context this is being called from
     * @param identifiers Identifiers of selected notifications to be removed
     * @param resultReceiver Receiver to be called with the result
     */
    fun removeScheduledNotifications(context: Context, identifiers: Collection<String>, resultReceiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(
          NOTIFICATION_EVENT_ACTION,
          getUriBuilder()
            .appendPath("scheduled")
            .build()
        ).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, REMOVE_SELECTED_TYPE)
          intent.putExtra(IDENTIFIERS_KEY, identifiers.toTypedArray())
          intent.putExtra(RECEIVER_KEY, resultReceiver)
        }
      )
    }

    /**
     * Cancel all scheduled notifications and remove them from the storage asynchronously.
     *
     * @param context Context this is being called from
     * @param resultReceiver Receiver to be called with the result
     */
    fun removeAllScheduledNotifications(context: Context, resultReceiver: ResultReceiver? = null) {
      doWork(
        context,
        Intent(NOTIFICATION_EVENT_ACTION).also { intent ->
          intent.putExtra(EVENT_TYPE_KEY, REMOVE_ALL_TYPE)
          intent.putExtra(RECEIVER_KEY, resultReceiver)
        }
      )
    }

    /**
     * Sends the intent to the best service to handle the {@link #NOTIFICATION_EVENT_ACTION} intent
     * or handles the intent immediately if the service is already up.
     *
     * @param context Context where to start the service
     * @param intent Intent to dispatch
     */
    fun doWork(context: Context, intent: Intent) {
      findDesignatedBroadcastReceiver(context, intent)?.let {
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

    fun findDesignatedBroadcastReceiver(context: Context, intent: Intent): ActivityInfo? {
      val searchIntent = Intent(intent.action).setPackage(context.packageName)
      return context.packageManager.queryBroadcastReceivers(searchIntent, 0).firstOrNull()?.activityInfo
    }

    /**
     * Creates and returns a pending intent that will trigger [NotificationsService],
     * which hands off the work to this class. The intent triggers notification of the given identifier.
     *
     * @param context Context this is being called from
     * @param identifier Notification identifier
     * @return [PendingIntent] triggering [NotificationsService], triggering notification of given ID.
     */
    fun createNotificationTrigger(context: Context, identifier: String): PendingIntent {
      val intent = Intent(
        NOTIFICATION_EVENT_ACTION,
        getUriBuilder()
          .appendPath("scheduled")
          .appendPath(identifier)
          .appendPath("trigger")
          .build()
      ).also { intent ->
        findDesignatedBroadcastReceiver(context, intent)?.let {
          intent.component = ComponentName(it.packageName, it.name)
        }
        intent.putExtra(EVENT_TYPE_KEY, TRIGGER_TYPE)
        intent.putExtra(IDENTIFIER_KEY, identifier)
      }

      // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      return PendingIntent.getBroadcast(
        context,
        intent.component?.className?.hashCode() ?: NotificationsService::class.java.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag
      )
    }

    /**
     * Creates and returns a pending intent that will trigger [NotificationsService]'s "response received"
     * event.
     *
     * @param context Context this is being called from
     * @param notification Notification being responded to
     * @param action Notification action being undertaken
     * @return [PendingIntent] triggering [NotificationsService], triggering "response received" event
     */
    fun createNotificationResponseIntent(context: Context, notification: Notification, action: NotificationAction): PendingIntent {
      val intent = Intent(
        NOTIFICATION_EVENT_ACTION,
        getUriBuilder()
          .appendPath(notification.notificationRequest.identifier)
          .appendPath("actions")
          .appendPath(action.identifier)
          .build()
      ).also { intent ->
        findDesignatedBroadcastReceiver(context, intent)?.let {
          intent.component = ComponentName(it.packageName, it.name)
        }
        intent.putExtra(EVENT_TYPE_KEY, RECEIVE_RESPONSE_TYPE)
        intent.putExtra(NOTIFICATION_KEY, notification)
        intent.putExtra(NOTIFICATION_ACTION_KEY, action as Parcelable)
      }

      // Starting from Android 12,
      // [notification trampolines](https://developer.android.com/about/versions/12/behavior-changes-12#identify-notification-trampolines)
      // are not allowed. If the notification wants to open foreground app,
      // we should use the dedicated Activity pendingIntent.
      if (action.opensAppToForeground()) {
        val notificationResponse = getNotificationResponseFromBroadcastIntent(intent)
        return ExpoHandlingDelegate.createPendingIntentForOpeningApp(context, intent, notificationResponse)
      }

      // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      return PendingIntent.getBroadcast(
        context,
        intent.component?.className?.hashCode() ?: NotificationsService::class.java.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag
      )
    }

    /**
     * Recreate an Intent from [createNotificationResponseIntent] extras
     * for [NotificationForwarderActivity] to send broadcasts
     */
    fun createNotificationResponseBroadcastIntent(context: Context, extras: Bundle?): Intent {
      val notification = extras?.getParcelable<Notification>(NOTIFICATION_KEY)
      val action = extras?.getParcelable<NotificationAction>(NOTIFICATION_ACTION_KEY)
      if (notification == null || action == null) {
        throw IllegalArgumentException("notification and action should not be null")
      }
      val backgroundAction = NotificationAction(action.identifier, action.title, false)
      val intent = Intent(
        NOTIFICATION_EVENT_ACTION,
        getUriBuilder()
          .appendPath(notification.notificationRequest.identifier)
          .appendPath("actions")
          .appendPath(backgroundAction.identifier)
          .build()
      ).also { intent ->
        findDesignatedBroadcastReceiver(context, intent)?.let {
          intent.component = ComponentName(it.packageName, it.name)
        }
        intent.putExtra(EVENT_TYPE_KEY, RECEIVE_RESPONSE_TYPE)
        intent.putExtra(NOTIFICATION_KEY, notification)
        intent.putExtra(NOTIFICATION_ACTION_KEY, backgroundAction as Parcelable)
      }
      return intent
    }

    fun getNotificationResponseFromBroadcastIntent(intent: Intent): NotificationResponse {
      val notification = intent.getParcelableExtra<Notification>(NOTIFICATION_KEY) ?: throw IllegalArgumentException("$NOTIFICATION_KEY not found in the intent extras.")
      val action = intent.getParcelableExtra<NotificationAction>(NOTIFICATION_ACTION_KEY) ?: throw IllegalArgumentException("$NOTIFICATION_ACTION_KEY not found in the intent extras.")
      val response = if (action is TextInputNotificationAction) {
        val userText = action.placeholder ?: RemoteInput.getResultsFromIntent(intent).getString(USER_TEXT_RESPONSE_KEY)
        TextInputNotificationResponse(action, notification, userText)
      } else {
        NotificationResponse(action, notification)
      }
      return response
    }

    fun getNotificationResponseFromOpenIntent(intent: Intent): NotificationResponse? {
      intent.getByteArrayExtra(NOTIFICATION_RESPONSE_KEY)?.let { return unmarshalObject(NotificationResponse.CREATOR, it) }
      intent.getByteArrayExtra(TEXT_INPUT_NOTIFICATION_RESPONSE_KEY)?.let { return unmarshalObject(TextInputNotificationResponse.CREATOR, it) }
      return null
    }

    // Class loader used in BaseBundle when unmarshalling notification extras
    // cannot handle expo.modules.notifications.….NotificationResponse
    // so we go around it by marshalling and unmarshalling the object ourselves.
    fun setNotificationResponseToIntent(intent: Intent, notificationResponse: NotificationResponse) {
      try {
        val keyToPutResponseUnder = if (notificationResponse is TextInputNotificationResponse) {
          TEXT_INPUT_NOTIFICATION_RESPONSE_KEY
        } else {
          NOTIFICATION_RESPONSE_KEY
        }
        intent.putExtra(keyToPutResponseUnder, marshalObject(notificationResponse))
      } catch (e: Exception) {
        // If we couldn't marshal the request, let's not fail the whole build process.
        Log.e("expo-notifications", "Could not marshal notification response: ${notificationResponse.actionIdentifier}.")
        e.printStackTrace()
      }
    }

    /**
     * Marshals [Parcelable] into to a byte array.
     *
     * @param notificationResponse Notification response to marshall
     * @return Given request marshalled to a byte array or null if the process failed.
     */
    private fun marshalObject(objectToMarshal: Parcelable): ByteArray? {
      val parcel: Parcel = Parcel.obtain()
      objectToMarshal.writeToParcel(parcel, 0)
      val bytes: ByteArray = parcel.marshall()
      parcel.recycle()
      return bytes
    }

    /**
     * UNmarshals [Parcelable] object from a byte array given a [Parcelable.Creator].
     * @return Object instance or null if the process failed.
     */
    private fun <T> unmarshalObject(creator: Parcelable.Creator<T>, byteArray: ByteArray?): T? {
      byteArray?.let {
        try {
          val parcel = Parcel.obtain()
          parcel.unmarshall(it, 0, it.size)
          parcel.setDataPosition(0)
          val unmarshaledObject = creator.createFromParcel(parcel)
          parcel.recycle()
          return unmarshaledObject
        } catch (e: Exception) {
          Log.e("expo-notifications", "Could not unmarshall NotificationResponse from Intent.extra.", e)
        }
      }
      return null
    }
  }

  protected open fun getPresentationDelegate(context: Context): PresentationDelegate =
    ExpoPresentationDelegate(context)

  protected open fun getHandlingDelegate(context: Context): HandlingDelegate =
    ExpoHandlingDelegate(context)

  protected open fun getCategoriesDelegate(context: Context): CategoriesDelegate =
    ExpoCategoriesDelegate(context)

  protected open fun getSchedulingDelegate(context: Context): SchedulingDelegate =
    ExpoSchedulingDelegate(context)

  override fun onReceive(context: Context, intent: Intent?) {
    val pendingIntent = goAsync()
    thread {
      try {
        handleIntent(context, intent)
      } finally {
        pendingIntent.finish()
      }
    }
  }

  open fun handleIntent(context: Context, intent: Intent?) {
    if (intent != null && SETUP_ACTIONS.contains(intent.action)) {
      onSetupScheduledNotifications(context, intent)
    } else if (intent?.action === NOTIFICATION_EVENT_ACTION) {
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

          GET_ALL_SCHEDULED_TYPE ->
            resultData = onGetAllScheduledNotifications(context, intent)

          GET_SCHEDULED_TYPE ->
            resultData = onGetScheduledNotification(context, intent)

          SCHEDULE_TYPE -> onScheduleNotification(context, intent)

          REMOVE_SELECTED_TYPE -> onRemoveScheduledNotifications(context, intent)

          REMOVE_ALL_TYPE -> onRemoveAllScheduledNotifications(context, intent)

          TRIGGER_TYPE -> onNotificationTriggered(context, intent)

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

  open fun onReceiveNotificationResponse(context: Context, intent: Intent) {
    val response = getNotificationResponseFromBroadcastIntent(intent)
    getHandlingDelegate(context).handleNotificationResponse(response)
  }

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

  //region Scheduling notifications

  open fun onGetAllScheduledNotifications(context: Context, intent: Intent) =
    Bundle().also {
      it.putParcelableArrayList(
        NOTIFICATION_REQUESTS_KEY,
        ArrayList(
          getSchedulingDelegate(context).getAllScheduledNotifications()
        )
      )
    }

  open fun onGetScheduledNotification(context: Context, intent: Intent) =
    Bundle().also {
      it.putParcelable(
        NOTIFICATION_REQUEST_KEY,
        getSchedulingDelegate(context).getScheduledNotification(
          intent.extras?.getString(IDENTIFIER_KEY)!!
        )
      )
    }

  open fun onScheduleNotification(context: Context, intent: Intent) =
    getSchedulingDelegate(context).scheduleNotification(
      intent.extras?.getParcelable(NOTIFICATION_REQUEST_KEY)!!
    )

  open fun onNotificationTriggered(context: Context, intent: Intent) =
    getSchedulingDelegate(context).triggerNotification(
      intent.extras?.getString(IDENTIFIER_KEY)!!
    )

  open fun onRemoveScheduledNotifications(context: Context, intent: Intent) =
    getSchedulingDelegate(context).removeScheduledNotifications(
      intent.extras?.getStringArray(IDENTIFIERS_KEY)!!.asList()
    )

  open fun onRemoveAllScheduledNotifications(context: Context, intent: Intent) =
    getSchedulingDelegate(context).removeAllScheduledNotifications()

  open fun onSetupScheduledNotifications(context: Context, intent: Intent) =
    getSchedulingDelegate(context).setupScheduledNotifications()

  //endregion
}
