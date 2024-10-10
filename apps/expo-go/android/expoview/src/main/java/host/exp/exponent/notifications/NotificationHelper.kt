package host.exp.exponent.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.text.format.DateUtils
import androidx.core.app.NotificationCompat
import de.greenrobot.event.EventBus
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.jsonutils.getNullable
import expo.modules.manifests.core.Manifest
import host.exp.exponent.Constants
import host.exp.exponent.ExponentManifest
import host.exp.exponent.ExponentManifest.BitmapListener
import host.exp.exponent.analytics.EXL
import host.exp.exponent.fcm.FcmRegistrationIntentService
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.ExponentUrls
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.network.ExpoHttpCallback
import host.exp.exponent.network.ExpoResponse
import host.exp.exponent.network.ExponentNetwork
import host.exp.exponent.storage.ExponentDB
import host.exp.exponent.storage.ExponentDB.ExperienceResultListener
import host.exp.exponent.storage.ExponentDBObject
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.utils.AsyncCondition
import host.exp.exponent.utils.AsyncCondition.AsyncConditionListener
import host.exp.exponent.utils.ColorParser
import host.exp.exponent.utils.JSONUtils.getJSONString
import host.exp.expoview.R
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.*

object NotificationHelper {
  private val TAG = NotificationHelper::class.java.simpleName

  fun getColor(
    colorString: String?,
    manifest: Manifest,
    exponentManifest: ExponentManifest
  ): Int {
    val colorStringLocal = colorString ?: manifest.getNotificationPreferences()?.getNullable(ExponentManifest.MANIFEST_NOTIFICATION_COLOR_KEY)
    return if (colorString != null && ColorParser.isValid(colorStringLocal)) {
      Color.parseColor(colorString)
    } else {
      exponentManifest.getColorFromManifest(manifest)
    }
  }

  fun loadIcon(
    url: String?,
    manifest: Manifest,
    exponentManifest: ExponentManifest,
    bitmapListener: BitmapListener?
  ) {
    val notificationPreferences = manifest.getNotificationPreferences()
    var iconUrl: String?
    if (url == null) {
      iconUrl = manifest.getIconUrl()
      if (notificationPreferences != null) {
        iconUrl = notificationPreferences.getNullable(ExponentManifest.MANIFEST_NOTIFICATION_ICON_URL_KEY)
      }
    } else {
      iconUrl = url
    }

    exponentManifest.loadIconBitmap(iconUrl, bitmapListener!!)
  }

  @JvmStatic fun getPushNotificationToken(
    deviceId: String,
    experienceId: String?,
    projectId: String?,
    exponentNetwork: ExponentNetwork,
    exponentSharedPreferences: ExponentSharedPreferences,
    listener: TokenListener
  ) {
    if (Constants.FCM_ENABLED) {
      FcmRegistrationIntentService.getTokenAndRegister(exponentSharedPreferences.context)
    }

    AsyncCondition.wait(
      ExponentNotificationIntentService.DEVICE_PUSH_TOKEN_KEY,
      object : AsyncConditionListener {
        override fun isReady(): Boolean {
          return (exponentSharedPreferences.getString(ExponentSharedPreferences.ExponentSharedPreferencesKey.FCM_TOKEN_KEY) != null || ExponentNotificationIntentService.hasTokenError)
        }

        override fun execute() {
          val sharedPreferencesToken = exponentSharedPreferences.getString(ExponentSharedPreferences.ExponentSharedPreferencesKey.FCM_TOKEN_KEY)
          if (sharedPreferencesToken.isNullOrEmpty()) {
            var message = "No device token found."
            if (!Constants.FCM_ENABLED) {
              message += " You need to enable FCM in order to get a push token. Follow this guide to set up FCM for your standalone app: https://docs.expo.io/versions/latest/guides/using-fcm"
            }
            listener.onFailure(Exception(message))
            return
          }

          val params = JSONObject().apply {
            try {
              put("deviceId", deviceId)
              put("appId", exponentSharedPreferences.context.applicationContext.packageName)
              put("deviceToken", sharedPreferencesToken)
              put("type", "fcm")
              put("development", false)

              when {
                projectId !== null -> {
                  put("projectId", projectId)
                }
                experienceId !== null -> {
                  put("experienceId", experienceId)
                }
                else -> {
                  listener.onFailure(Exception("Must supply either experienceId or projectId"))
                  return
                }
              }
            } catch (e: JSONException) {
              listener.onFailure(Exception("Error constructing request"))
              return@execute
            }
          }

          val body = params.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
          val request = ExponentUrls.addExponentHeadersToUrl("https://exp.host/--/api/v2/push/getExpoPushToken")
            .header("Content-Type", "application/json")
            .post(body)
            .build()
          exponentNetwork.client.call(
            request,
            object : ExpoHttpCallback {
              override fun onFailure(e: IOException) {
                listener.onFailure(e)
              }

              @Throws(IOException::class)
              override fun onResponse(response: ExpoResponse) {
                if (!response.isSuccessful) {
                  listener.onFailure(Exception("Couldn't get android push token for device"))
                  return
                }

                try {
                  val result = JSONObject(response.body().string())
                  val data = result.getJSONObject("data")
                  listener.onSuccess(data.getString("expoPushToken"))
                } catch (e: Exception) {
                  listener.onFailure(e)
                }
              }
            }
          )
        }
      }
    )
  }

  @JvmStatic fun createChannel(
    context: Context,
    experienceKey: ExperienceKey,
    channelId: String,
    channelName: String?,
    details: HashMap<*, *>
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val description: String? = if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION)) {
        details[NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION] as String?
      } else {
        null
      }
      val importance: String? = if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY)) {
        details[NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY] as String?
      } else {
        null
      }
      val sound: Boolean? = if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_SOUND)) {
        details[NotificationConstants.NOTIFICATION_CHANNEL_SOUND] as Boolean?
      } else {
        null
      }
      val vibrate: Any? = if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE)) {
        details[NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE]
      } else {
        null
      }
      val badge: Boolean? = if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_BADGE)) {
        details[NotificationConstants.NOTIFICATION_CHANNEL_BADGE] as Boolean?
      } else {
        null
      }

      createChannel(
        context,
        experienceKey,
        channelId,
        channelName,
        description,
        importance,
        sound,
        vibrate,
        badge
      )
    } else {
      // since channels do not exist on Android 7.1 and below, we'll save the settings in shared
      // preferences and apply them to individual notifications that have this channelId from now on
      // this is essentially a "polyfill" of notification channels for Android 7.1 and below
      // and means that devs don't have to worry about supporting both versions of Android at once
      ExponentNotificationManager(context).saveChannelSettings(experienceKey, channelId, details)
    }
  }

  @JvmStatic fun createChannel(
    context: Context,
    experienceKey: ExperienceKey,
    channelId: String,
    details: JSONObject
  ) {
    try {
      // we want to throw immediately if there is no channel name
      val channelName = details.getString(NotificationConstants.NOTIFICATION_CHANNEL_NAME)
      val description: String? = details.getNullable(NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION)
      val priority: String? = details.getNullable(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY)
      val sound: Boolean? = details.getNullable(NotificationConstants.NOTIFICATION_CHANNEL_SOUND)
      val badge: Boolean? = if (!details.isNull(NotificationConstants.NOTIFICATION_CHANNEL_BADGE)) {
        details.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_BADGE, true)
      } else {
        null
      }

      val vibrateJsonArray = details.optJSONArray(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE)
      val vibrate = if (vibrateJsonArray != null) {
        val vibrateArrayList = ArrayList<Double>()
        for (i in 0 until vibrateJsonArray.length()) {
          vibrateArrayList.add(vibrateJsonArray.getDouble(i))
        }
        vibrateArrayList
      } else {
        details.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE, false)
      }

      createChannel(
        context,
        experienceKey,
        channelId,
        channelName,
        description,
        priority,
        sound,
        vibrate,
        badge
      )
    } catch (e: Exception) {
      EXL.e(TAG, "Could not create channel from stored JSON Object: " + e.message)
    }
  }

  private fun createChannel(
    context: Context,
    experienceKey: ExperienceKey,
    channelId: String,
    channelName: String?,
    description: String?,
    importanceString: String?,
    sound: Boolean?,
    vibrate: Any?,
    badge: Boolean?
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val importance = when (importanceString) {
        NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_MAX -> NotificationManager.IMPORTANCE_MAX
        NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_HIGH -> NotificationManager.IMPORTANCE_HIGH
        NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_LOW -> NotificationManager.IMPORTANCE_LOW
        NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_MIN -> NotificationManager.IMPORTANCE_MIN
        else -> NotificationManager.IMPORTANCE_DEFAULT
      }

      val channel = NotificationChannel(
        ExponentNotificationManager.getScopedChannelId(experienceKey, channelId),
        channelName,
        importance
      )

      // sound is now on by default for channels
      if (sound == null || !sound) {
        channel.setSound(null, null)
      }

      if (vibrate != null) {
        if (vibrate is ArrayList<*>) {
          val pattern = LongArray(vibrate.size)
          for (i in vibrate.indices) {
            pattern[i] = (vibrate[i] as Double).toInt().toLong()
          }
          channel.vibrationPattern = pattern
        } else if (vibrate is Boolean && vibrate) {
          channel.vibrationPattern = longArrayOf(0, 500)
        }
      }

      if (description != null) {
        channel.description = description
      }

      if (badge != null) {
        channel.setShowBadge(badge)
      }

      ExponentNotificationManager(context).createNotificationChannel(experienceKey, channel)
    }
  }

  @JvmStatic fun maybeCreateLegacyStoredChannel(
    context: Context,
    experienceKey: ExperienceKey,
    channelId: String,
    details: HashMap<*, *>
  ) {
    // no version check here because if we're on Android 7.1 or below, we still want to save
    // the channel in shared preferences
    val existingChannel = ExponentNotificationManager(context).getNotificationChannel(experienceKey, channelId)
    if (existingChannel == null && details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_NAME)) {
      createChannel(
        context,
        experienceKey,
        channelId,
        details[NotificationConstants.NOTIFICATION_CHANNEL_NAME] as String?,
        details
      )
    }
  }

  @JvmStatic fun deleteChannel(context: Context?, experienceKey: ExperienceKey?, channelId: String?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ExponentNotificationManager(context!!).deleteNotificationChannel(experienceKey!!, channelId!!)
    } else {
      // deleting a channel on O+ still retains all its settings, so doing nothing here emulates that
    }
  }

  @JvmStatic fun showNotification(
    context: Context,
    id: Int,
    details: HashMap<*, *>,
    exponentManifest: ExponentManifest,
    listener: Listener
  ) {
    val manager = ExponentNotificationManager(context)
    val notificationScopeKey = details[NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY] as String?
    val experienceScopeKey = notificationScopeKey ?: (details[NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY] as String?)!!

    ExponentDB.experienceScopeKeyToExperience(
      experienceScopeKey,
      object : ExperienceResultListener {
        override fun onSuccess(exponentDBObject: ExponentDBObject) {
          Thread(
            Runnable {
              val manifest = exponentDBObject.manifest
              val experienceKey = try {
                ExperienceKey.fromManifest(manifest)
              } catch (e: JSONException) {
                listener.onFailure(Exception("Couldn't deserialize JSON for experience scope key $experienceScopeKey"))
                return@Runnable
              }

              val builder = NotificationCompat.Builder(
                context,
                ExponentNotificationManager.getScopedChannelId(
                  experienceKey,
                  NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID
                )
              ).apply {
                setSmallIcon(R.drawable.notification_icon)
                setAutoCancel(true)
              }

              val data = details["data"] as HashMap<*, *>
              if (data.containsKey("channelId")) {
                val channelId = data["channelId"] as String
                builder.setChannelId(
                  ExponentNotificationManager.getScopedChannelId(
                    experienceKey,
                    channelId
                  )
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                  // if we don't yet have a channel matching this ID, check shared preferences --
                  // it's possible this device has just been upgraded to Android 8+ and the channel
                  // needs to be created in the system
                  if (manager.getNotificationChannel(experienceKey, channelId) == null) {
                    val storedChannelDetails = manager.readChannelSettings(experienceKey, channelId)
                    if (storedChannelDetails != null) {
                      createChannel(context, experienceKey, channelId, storedChannelDetails)
                    }
                  }
                } else {
                  // on Android 7.1 and below, read channel settings for sound, priority, and vibrate from shared preferences
                  // and apply these settings to the notification individually, since channels do not exist
                  val storedChannelDetails = manager.readChannelSettings(experienceKey, channelId)
                  if (storedChannelDetails != null) {
                    if (storedChannelDetails.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_SOUND, false)
                    ) {
                      builder.setDefaults(NotificationCompat.DEFAULT_SOUND)
                    }

                    builder.priority = when (storedChannelDetails.getNullable<String>(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY)) {
                      "max" -> NotificationCompat.PRIORITY_MAX
                      "high" -> NotificationCompat.PRIORITY_HIGH
                      "low" -> NotificationCompat.PRIORITY_LOW
                      "min" -> NotificationCompat.PRIORITY_MIN
                      else -> NotificationCompat.PRIORITY_DEFAULT
                    }

                    try {
                      val vibrateJsonArray = storedChannelDetails.optJSONArray(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE)
                      if (vibrateJsonArray != null) {
                        val pattern = LongArray(vibrateJsonArray.length())
                        for (i in 0 until vibrateJsonArray.length()) {
                          pattern[i] = vibrateJsonArray.getDouble(i).toInt().toLong()
                        }
                        builder.setVibrate(pattern)
                      } else if (storedChannelDetails.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE, false)) {
                        builder.setVibrate(longArrayOf(0, 500))
                      }
                    } catch (e: Exception) {
                      EXL.e(
                        TAG,
                        "Failed to set vibrate settings on notification from stored channel: " + e.message
                      )
                    }
                  } else {
                    EXL.e(TAG, "No stored channel found for $experienceScopeKey: $channelId")
                  }
                }
              } else {
                // make a default channel so that people don't have to explicitly create a channel to see notifications
                createChannel(
                  context,
                  experienceKey,
                  NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID,
                  context.getString(R.string.default_notification_channel_group),
                  HashMap<Any?, Any?>()
                )
              }

              if (data.containsKey("title")) {
                val title = data["title"] as String
                builder.setContentTitle(title)
                builder.setTicker(title)
              }

              if (data.containsKey("body")) {
                val body = data["body"] as String
                builder.setContentText(body)
                builder.setStyle(NotificationCompat.BigTextStyle().bigText(body))
              }

              if (data.containsKey("count")) {
                builder.setNumber((data["count"] as Double).toInt())
              }

              if (data.containsKey("sticky")) {
                builder.setOngoing((data["sticky"] as Boolean))
              }

              val intent = if (data.containsKey("link")) {
                Intent(Intent.ACTION_VIEW, Uri.parse(data["link"] as String))
              } else {
                val activityClass = KernelConstants.MAIN_ACTIVITY_CLASS
                Intent(context, activityClass).apply {
                  putExtra(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY, exponentDBObject.manifestUrl)
                }
              }

              val body: String = try {
                if (data.containsKey("data")) getJSONString(data["data"]!!) else ""
              } catch (e: JSONException) {
                listener.onFailure(Exception("Couldn't deserialize JSON for experience scope key $experienceScopeKey"))
                return@Runnable
              }

              val notificationEvent = ReceivedNotificationEvent(experienceScopeKey, body, id, isMultiple = false, isRemote = false)

              intent.putExtra(KernelConstants.NOTIFICATION_KEY, body) // deprecated
              intent.putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, notificationEvent.toJSONObject(null).toString())

              // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
              val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
              val contentIntent = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
              builder.setContentIntent(contentIntent)

              if (data.containsKey("categoryId")) {
                val manifestUrl = exponentDBObject.manifestUrl

                NotificationActionCenter.setCategory(
                  data["categoryId"] as String,
                  builder,
                  context,
                  object : IntentProvider {
                    override fun provide(): Intent {
                      return Intent(context, KernelConstants.MAIN_ACTIVITY_CLASS).apply {
                        putExtra(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY, manifestUrl)

                        val notificationEventInner = ReceivedNotificationEvent(experienceScopeKey, body, id, isMultiple = false, isRemote = false)
                        putExtra(KernelConstants.NOTIFICATION_KEY, body) // deprecated
                        putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, notificationEventInner.toJSONObject(null).toString())
                      }
                    }
                  }
                )
              }

              builder.color = getColor(
                if (data.containsKey("color")) data["color"] as String? else null,
                manifest,
                exponentManifest
              )

              loadIcon(
                if (data.containsKey("icon")) data["icon"] as String? else null,
                manifest,
                exponentManifest,
                object : BitmapListener {
                  override fun onLoadBitmap(bitmap: Bitmap?) {
                    if (data.containsKey("icon")) {
                      builder.setLargeIcon(bitmap)
                    }
                    manager.notify(experienceKey, id, builder.build())
                    EventBus.getDefault().post(notificationEvent)
                    listener.onSuccess(id)
                  }
                }
              )
            }
          ).start()
        }

        override fun onFailure() {
          listener.onFailure(Exception("No experience found or invalid manifest for scope key $experienceScopeKey"))
        }
      }
    )
  }

  @JvmStatic fun scheduleLocalNotification(
    context: Context?,
    id: Int,
    data: HashMap<String?, Any?>,
    options: HashMap<*, *>,
    experienceKey: ExperienceKey,
    listener: Listener
  ) {
    val details = hashMapOf(
      "data" to data,
      NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY to experienceKey.scopeKey,
      NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY to experienceKey.scopeKey
    )

    var time: Long = 0

    if (options.containsKey("time")) {
      try {
        when (val suppliedTime = options["time"]) {
          is Number -> time = suppliedTime.toLong() - System.currentTimeMillis()
          is String -> { // TODO: DELETE WHEN SDK 32 IS DEPRECATED
            val format: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            format.timeZone = TimeZone.getTimeZone("UTC")
            time = format.parse(suppliedTime as String?).time - System.currentTimeMillis()
          }
          else -> throw InvalidArgumentException("Invalid time provided: $suppliedTime")
        }
      } catch (e: Exception) {
        listener.onFailure(e)
        return
      }
    }

    time += SystemClock.elapsedRealtime()

    val manager = ExponentNotificationManager(context!!)

    val interval = when {
      options.containsKey("repeat") -> {
        when (options["repeat"] as String?) {
          "minute" -> DateUtils.MINUTE_IN_MILLIS
          "hour" -> DateUtils.HOUR_IN_MILLIS
          "day" -> DateUtils.DAY_IN_MILLIS
          "week" -> DateUtils.WEEK_IN_MILLIS
          "month" -> DateUtils.DAY_IN_MILLIS * 30
          "year" -> DateUtils.DAY_IN_MILLIS * 365
          else -> {
            listener.onFailure(Exception("Invalid repeat interval specified"))
            return
          }
        }
      }
      options.containsKey("intervalMs") -> options["intervalMs"] as Long?
      else -> null
    }

    try {
      manager.schedule(experienceKey, id, details, time, interval)
      listener.onSuccess(id)
    } catch (e: Exception) {
      listener.onFailure(e)
    }
  }

  interface Listener {
    fun onSuccess(id: Int)
    fun onFailure(e: Exception)
  }

  interface TokenListener {
    fun onSuccess(token: String)
    fun onFailure(e: Exception)
  }
}
