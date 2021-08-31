// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent.modules.api.notifications

import com.facebook.react.bridge.*
import com.google.firebase.iid.FirebaseInstanceId
import host.exp.exponent.Constants
import host.exp.exponent.ExponentManifest
import host.exp.exponent.analytics.EXL.e
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.network.ExponentNetwork
import host.exp.exponent.notifications.ExponentNotificationManager
import host.exp.exponent.notifications.NotificationActionCenter
import host.exp.exponent.notifications.NotificationConstants
import host.exp.exponent.notifications.NotificationHelper
import host.exp.exponent.notifications.NotificationHelper.TokenListener
import host.exp.exponent.notifications.exceptions.UnableToScheduleException
import host.exp.exponent.notifications.helpers.ExpoCronParser.createCronInstance
import host.exp.exponent.notifications.managers.SchedulersManagerProxy
import host.exp.exponent.notifications.schedulers.CalendarSchedulerModel
import host.exp.exponent.notifications.schedulers.IntervalSchedulerModel
import host.exp.exponent.notifications.schedulers.SchedulerImpl
import host.exp.exponent.storage.ExponentSharedPreferences
import java.io.Serializable
import java.util.*
import javax.inject.Inject
import kotlin.math.abs

class NotificationsModule(
  reactContext: ReactApplicationContext,
  private val experienceKey: ExperienceKey,
  private val experienceStableLegacyId: String,
) : ReactContextBaseJavaModule(reactContext) {
  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  @Inject
  lateinit var exponentManifest: ExponentManifest

  @Inject
  lateinit var exponentNetwork: ExponentNetwork

  override fun getName(): String {
    return "ExponentNotifications"
  }

  @ReactMethod
  fun createCategoryAsync(categoryIdParam: String?, actions: ReadableArray, promise: Promise) {
    val categoryId = getScopedIdIfNotDetached(categoryIdParam)

    val newActions = mutableListOf<MutableMap<String?, Any?>>()
    for (actionObject in actions.toArrayList()) {
      if (actionObject is Map<*, *>) {
        val action = actionObject as Map<String?, Any?>
        newActions.add(action.toMutableMap())
      }
    }

    NotificationActionCenter.putCategory(categoryId, newActions)
    promise.resolve(null)
  }

  @ReactMethod
  fun deleteCategoryAsync(categoryIdParam: String?, promise: Promise) {
    val categoryId = getScopedIdIfNotDetached(categoryIdParam)
    NotificationActionCenter.removeCategory(categoryId)
    promise.resolve(null)
  }

  private fun getScopedIdIfNotDetached(categoryId: String?): String? {
    if (!Constants.isStandaloneApp()) {
      val experienceScopeKey = experienceKey.scopeKey
      return "$experienceScopeKey:$categoryId"
    }
    return categoryId
  }

  @ReactMethod
  fun getDevicePushTokenAsync(config: ReadableMap?, promise: Promise) {
    if (!Constants.isStandaloneApp()) {
      promise.reject("getDevicePushTokenAsync is only accessible within standalone applications")
    }
    try {
      if (Constants.FCM_ENABLED) {
        val token = FirebaseInstanceId.getInstance().token
        if (token == null) {
          promise.reject("FCM token has not been set")
        } else {
          val params = Arguments.createMap().apply {
            putString("type", "fcm")
            putString("data", token)
          }
          promise.resolve(params)
        }
      } else {
        promise.reject(
          "ERR_NOTIFICATIONS_FCM_NOT_ENABLED",
          "FCM must be enabled in order to get the device push token"
        )
      }
    } catch (e: Exception) {
      e(TAG, e.message)
      promise.reject(e.message)
    }
  }

  @ReactMethod
  fun getExponentPushTokenAsync(promise: Promise) {
    val uuid = exponentSharedPreferences.getUUID()
    if (uuid == null) {
      // This should have been set by ExponentNotificationIntentService via
      // ExpoFcmMessagingService#onNewToken -> FcmRegistrationIntentService.registerForeground -> ExponentNotificationIntentService#onHandleIntent
      // (#onNewToken is supposed to be called when a token is generated after app install, see
      // https://developers.google.com/android/reference/com/google/firebase/messaging/FirebaseMessagingService#onNewToken(java.lang.String)).
      // If it hasn't been set, the app probably couldn't register at FCM (invalid configuration?).
      promise.reject(
        "E_GET_PUSH_TOKEN_FAILED",
        "Couldn't get push token on device. Check that your FCM configuration is valid."
      )
      return
    }

    try {
      val experienceId = experienceStableLegacyId
      NotificationHelper.getPushNotificationToken(
        uuid,
        experienceId,
        exponentNetwork,
        exponentSharedPreferences,
        object : TokenListener {
          override fun onSuccess(token: String) {
            promise.resolve(token)
          }

          override fun onFailure(e: Exception) {
            promise.reject(
              "E_GET_PUSH_TOKEN_FAILED",
              "Couldn't get push token for device. Check that your FCM configuration is valid.",
              e
            )
          }
        }
      )
    } catch (e: Exception) {
      promise.reject(
        "E_GET_PUSH_TOKEN_FAILED",
        "Couldn't get push token for device. Check that your FCM configuration is valid.",
        e
      )
    }
  }

  @ReactMethod
  fun createChannel(channelId: String, data: ReadableMap, promise: Promise) {
    val channelName = if (data.hasKey(NotificationConstants.NOTIFICATION_CHANNEL_NAME)) {
      data.getString(NotificationConstants.NOTIFICATION_CHANNEL_NAME)!!
    } else {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Requires channel name")
      return
    }

    try {
      NotificationHelper.createChannel(
        reactApplicationContext,
        experienceKey,
        channelId,
        channelName,
        data.toHashMap()
      )
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Could not create channel", e)
    }
  }

  @ReactMethod
  fun deleteChannel(channelId: String, promise: Promise) {
    try {
      NotificationHelper.deleteChannel(
        reactApplicationContext,
        experienceKey,
        channelId
      )
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_FAILED_DELETING_CHANNEL", "Could not delete channel", e)
    }
  }

  @ReactMethod
  fun presentLocalNotification(data: ReadableMap, promise: Promise) {
    presentLocalNotificationWithChannel(data, null, promise)
  }

  @ReactMethod
  fun presentLocalNotificationWithChannel(
    data: ReadableMap,
    legacyChannelData: ReadableMap?,
    promise: Promise
  ) {
    val details = hashMapOf<String, Serializable>(
      "data" to data.toHashMap().apply {
        if (data.hasKey("categoryId")) {
          this["categoryId"] = getScopedIdIfNotDetached(data.getString("categoryId"))
        }
      },
      NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY to experienceKey.scopeKey,
      NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY to experienceKey.scopeKey
    )

    if (legacyChannelData != null) {
      val channelId = data.getString("channelId")
      if (channelId == null) {
        promise.reject(
          "E_FAILED_PRESENTING_NOTIFICATION",
          "legacyChannelData was nonnull with no channelId"
        )
        return
      }
      NotificationHelper.maybeCreateLegacyStoredChannel(
        reactApplicationContext,
        experienceKey,
        channelId,
        legacyChannelData.toHashMap()
      )
    }

    val notificationId = Random().nextInt()

    NotificationHelper.showNotification(
      reactApplicationContext,
      notificationId,
      details,
      exponentManifest,
      object : NotificationHelper.Listener {
        override fun onSuccess(id: Int) {
          promise.resolve(id)
        }

        override fun onFailure(e: Exception) {
          promise.reject(e)
        }
      }
    )
  }

  @ReactMethod
  fun scheduleLocalNotification(data: ReadableMap, options: ReadableMap, promise: Promise) {
    scheduleLocalNotificationWithChannel(data, options, null, promise)
  }

  @ReactMethod
  fun scheduleLocalNotificationWithChannel(
    data: ReadableMap,
    options: ReadableMap,
    legacyChannelData: ReadableMap?,
    promise: Promise
  ) {
    if (legacyChannelData != null) {
      val channelId = data.getString("channelId")
      if (channelId == null) {
        promise.reject(
          "E_FAILED_PRESENTING_NOTIFICATION",
          "legacyChannelData was nonnull with no channelId or no experienceId"
        )
        return
      }
      NotificationHelper.maybeCreateLegacyStoredChannel(
        reactApplicationContext,
        experienceKey,
        channelId,
        legacyChannelData.toHashMap()
      )
    }

    val notificationId = Random().nextInt()

    val hashMap = data.toHashMap().apply {
      if (data.hasKey("categoryId")) {
        this["categoryId"] = getScopedIdIfNotDetached(data.getString("categoryId"))
      }
    }

    NotificationHelper.scheduleLocalNotification(
      reactApplicationContext,
      notificationId,
      hashMap,
      options.toHashMap(),
      experienceKey,
      object : NotificationHelper.Listener {
        override fun onSuccess(id: Int) {
          promise.resolve(id)
        }

        override fun onFailure(e: Exception) {
          promise.reject(e)
        }
      }
    )
  }

  @ReactMethod
  fun dismissNotification(notificationId: Int, promise: Promise) {
    val manager = ExponentNotificationManager(reactApplicationContext)
    manager.cancel(experienceKey, notificationId)
    promise.resolve(true)
  }

  @ReactMethod
  fun dismissAllNotifications(promise: Promise) {
    val manager = ExponentNotificationManager(reactApplicationContext)
    manager.cancelAll(experienceKey)
    promise.resolve(true)
  }

  @ReactMethod
  fun cancelScheduledNotificationAsync(notificationId: Int, promise: Promise) {
    try {
      val manager = ExponentNotificationManager(reactApplicationContext)
      manager.cancelScheduled(experienceKey, notificationId)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun cancelScheduledNotificationWithStringIdAsync(id: String?, promise: Promise) {
    try {
      SchedulersManagerProxy.getInstance(reactApplicationContext.applicationContext)
        .removeScheduler(id)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun cancelAllScheduledNotificationsAsync(promise: Promise) {
    try {
      val manager = ExponentNotificationManager(reactApplicationContext)
      manager.cancelAllScheduled(experienceKey)
      SchedulersManagerProxy.getInstance(reactApplicationContext.applicationContext)
        .removeAll(experienceKey)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun scheduleNotificationWithTimer(data: ReadableMap, optionsMap: ReadableMap, promise: Promise) {
    val options = optionsMap.toHashMap()
    val notificationId = abs(Random().nextInt())

    val details = hashMapOf<String, Any>(
      "data" to data.toHashMap().apply {
        if (data.hasKey("categoryId")) {
          this["categoryId"] = getScopedIdIfNotDetached(data.getString("categoryId"))
        }
      },
      NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY to experienceKey.scopeKey,
      NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY to experienceKey.scopeKey,
    )

    val intervalSchedulerModel = IntervalSchedulerModel().apply {
      experienceScopeKey = experienceKey.scopeKey
      this.notificationId = notificationId
      setDetailsFromMap(details)
      isRepeat = options.containsKey("repeat") && (options["repeat"] as Boolean?)!!
      scheduledTime = System.currentTimeMillis() + (options["interval"] as Double?)!!.toLong()
      interval = (options["interval"] as Double?)!!.toLong() // on iOS we cannot change interval
    }
    val scheduler = SchedulerImpl(intervalSchedulerModel)
    SchedulersManagerProxy.getInstance(reactApplicationContext.applicationContext).addScheduler(
      scheduler
    ) { id: String? ->
      if (id == null) {
        promise.reject(UnableToScheduleException())
        return@addScheduler false
      }
      promise.resolve(id)
      true
    }
  }

  @ReactMethod
  fun scheduleNotificationWithCalendar(
    data: ReadableMap,
    optionsMap: ReadableMap,
    promise: Promise
  ) {
    val options = optionsMap.toHashMap()
    val notificationId = abs(Random().nextInt())

    val details = hashMapOf<String, Any>(
      "data" to data.toHashMap().apply {
        if (data.hasKey("categoryId")) {
          this["categoryId"] = getScopedIdIfNotDetached(data.getString("categoryId"))
        }
      },
      NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY to experienceKey.scopeKey,
      NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY to experienceKey.scopeKey
    )
    val cron = createCronInstance(options)
    val calendarSchedulerModel = CalendarSchedulerModel().apply {
      experienceScopeKey = experienceKey.scopeKey
      this.notificationId = notificationId
      setDetailsFromMap(details)
      isRepeat = options.containsKey("repeat") && (options["repeat"] as Boolean?)!!
      calendarData = cron.asString()
    }
    val scheduler = SchedulerImpl(calendarSchedulerModel)
    SchedulersManagerProxy.getInstance(reactApplicationContext.applicationContext).addScheduler(
      scheduler
    ) { id: String? ->
      if (id == null) {
        promise.reject(UnableToScheduleException())
        return@addScheduler false
      }
      promise.resolve(id)
      true
    }
  }

  companion object {
    private val TAG = NotificationsModule::class.java.simpleName
  }

  init {
    NativeModuleDepsProvider.instance.inject(NotificationsModule::class.java, this)
  }
}
