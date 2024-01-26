package host.exp.exponent.notifications

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import expo.modules.jsonutils.getNullable
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.expoview.R
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.*
import javax.inject.Inject

class ExponentNotificationManager(private val context: Context) {
  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  fun maybeCreateNotificationChannelGroup(manifest: Manifest) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        val experienceScopeKey = manifest.getScopeKey()
        if (!notificationChannelGroupIds.contains(experienceScopeKey)) {
          val name = manifest.getName()
          val channelName = name ?: experienceScopeKey
          val group = NotificationChannelGroup(experienceScopeKey, channelName)
          context.getSystemService(NotificationManager::class.java).createNotificationChannelGroup(group)
          notificationChannelGroupIds.add(experienceScopeKey)
        }
      } catch (e: Exception) {
        EXL.e(TAG, "Could not create notification channel: " + e.message)
      }
    }
  }

  fun maybeCreateExpoPersistentNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (isExpoPersistentNotificationCreated) {
        return
      }

      val manager = context.getSystemService(NotificationManager::class.java)
      val channel = NotificationChannel(
        NotificationConstants.NOTIFICATION_EXPERIENCE_CHANNEL_ID,
        context.getString(R.string.persistent_notification_channel_name),
        NotificationManager.IMPORTANCE_DEFAULT
      ).apply {
        setSound(null, null)
        description = context.getString(R.string.persistent_notification_channel_desc)
      }

      val group = NotificationChannelGroup(
        NotificationConstants.NOTIFICATION_EXPERIENCE_CHANNEL_GROUP_ID,
        context.getString(R.string.persistent_notification_channel_group)
      )
      manager.createNotificationChannelGroup(group)
      channel.group = NotificationConstants.NOTIFICATION_EXPERIENCE_CHANNEL_GROUP_ID

      manager.createNotificationChannel(channel)

      isExpoPersistentNotificationCreated = true
    }
  }

  fun createNotificationChannel(experienceKey: ExperienceKey, channel: NotificationChannel) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      channel.group = experienceKey.scopeKey
      context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  fun saveChannelSettings(
    experienceKey: ExperienceKey,
    channelId: String,
    details: Map<*, *>
  ) {
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: JSONObject()
      val allChannels: JSONObject = metadata.getNullable(ExponentSharedPreferences.EXPERIENCE_METADATA_NOTIFICATION_CHANNELS) ?: JSONObject()
      allChannels.put(channelId, JSONObject(details))
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_NOTIFICATION_CHANNELS, allChannels)
      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      EXL.e(TAG, "Could not store channel in shared preferences: " + e.message)
    }
  }

  fun readChannelSettings(experienceKey: ExperienceKey, channelId: String?): JSONObject? {
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: JSONObject()
      val allChannels: JSONObject = metadata.getNullable(ExponentSharedPreferences.EXPERIENCE_METADATA_NOTIFICATION_CHANNELS) ?: JSONObject()
      return allChannels.optJSONObject(channelId)
    } catch (e: JSONException) {
      EXL.e(TAG, "Could not read channel from shared preferences: " + e.message)
    }
    return null
  }

  fun getNotificationChannel(
    experienceKey: ExperienceKey,
    channelId: String
  ): NotificationChannel? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.getSystemService(NotificationManager::class.java)
        .getNotificationChannel(
          getScopedChannelId(
            experienceKey,
            channelId
          )
        )
    } else {
      null
    }
  }

  fun deleteNotificationChannel(experienceKey: ExperienceKey, channelId: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.getSystemService(NotificationManager::class.java).deleteNotificationChannel(
        getScopedChannelId(experienceKey, channelId)
      )
    }
  }

  fun notify(experienceKey: ExperienceKey, id: Int, notification: Notification) {
    NotificationManagerCompat.from(context).notify(experienceKey.scopeKey, id, notification)
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: JSONObject()
      val notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS) ?: JSONArray()
      notifications.put(id)
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS, notifications)

      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  fun cancel(experienceKey: ExperienceKey, id: Int) {
    NotificationManagerCompat.from(context).cancel(experienceKey.scopeKey, id)
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: return
      val oldNotifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS) ?: return
      val newNotifications = JSONArray()
      for (i in 0 until oldNotifications.length()) {
        if (oldNotifications.getInt(i) != id) {
          newNotifications.put(oldNotifications.getInt(i))
        }
      }
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS, newNotifications)

      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  fun cancelAll(experienceKey: ExperienceKey) {
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: return
      val notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS) ?: return
      val manager = NotificationManagerCompat.from(context)
      for (i in 0 until notifications.length()) {
        manager.cancel(experienceKey.scopeKey, notifications.getInt(i))
      }
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS, null)
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS, null)

      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  fun getAllNotificationsIds(experienceKey: ExperienceKey): List<Int> {
    return try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: return emptyList()
      val notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS) ?: return emptyList()
      val notificationsIds = mutableListOf<Int>()
      for (i in 0 until notifications.length()) {
        notificationsIds.add(notifications.getInt(i))
      }
      notificationsIds
    } catch (e: JSONException) {
      e.printStackTrace()
      emptyList()
    }
  }

  @Throws(ClassNotFoundException::class)
  fun schedule(
    experienceKey: ExperienceKey,
    id: Int,
    details: HashMap<*, *>?,
    time: Long,
    interval: Long?
  ) {
    val notificationIntent = Intent(context, ScheduledNotificationReceiver::class.java).apply {
      type = experienceKey.scopeKey
      action = id.toString()
      putExtra(KernelConstants.NOTIFICATION_ID_KEY, id)
      putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, details)
    }

    // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
    val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
    val pendingIntent = PendingIntent.getBroadcast(context, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    if (interval != null) {
      alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP, time, interval, pendingIntent)
    } else {
      alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, time, pendingIntent)
    }
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: JSONObject()
      val notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS) ?: JSONArray()
      notifications.put(id)
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS, notifications)

      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  @Throws(ClassNotFoundException::class)
  fun cancelScheduled(experienceKey: ExperienceKey, id: Int) {
    val notificationIntent = Intent(context, ScheduledNotificationReceiver::class.java).apply {
      type = experienceKey.scopeKey
      action = id.toString()
    }
    // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
    val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
    val pendingIntent = PendingIntent.getBroadcast(context, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.cancel(pendingIntent)
    cancel(experienceKey, id)
  }

  @Throws(ClassNotFoundException::class)
  fun cancelAllScheduled(experienceKey: ExperienceKey) {
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: return
      val notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS) ?: return
      for (i in 0 until notifications.length()) {
        cancelScheduled(experienceKey, notifications.getInt(i))
      }
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS, null)

      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  companion object {
    private val TAG = ExponentNotificationManager::class.java.simpleName

    private val notificationChannelGroupIds = mutableSetOf<String>()

    private var isExpoPersistentNotificationCreated = false

    fun getScopedChannelId(experienceKey: ExperienceKey, channelId: String): String {
      return experienceKey.scopeKey + "/" + channelId
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ExponentNotificationManager::class.java, this)
  }
}
