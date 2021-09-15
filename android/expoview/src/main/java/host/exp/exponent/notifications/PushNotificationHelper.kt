package host.exp.exponent.notifications

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import de.greenrobot.event.EventBus
import expo.modules.jsonutils.getNullable
import expo.modules.manifests.core.Manifest
import host.exp.exponent.Constants
import host.exp.exponent.ExponentManifest
import host.exp.exponent.ExponentManifest.BitmapListener
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.storage.ExponentDB
import host.exp.exponent.storage.ExponentDB.ExperienceResultListener
import host.exp.exponent.storage.ExponentDBObject
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.expoview.R
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.*
import javax.inject.Inject
import kotlin.math.min

class PushNotificationHelper {
  private enum class Mode {
    DEFAULT, COLLAPSE
  }

  @Inject
  lateinit var exponentManifest: ExponentManifest

  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  fun onMessageReceived(
    context: Context,
    experienceScopeKey: String,
    channelId: String?,
    message: String?,
    body: String?,
    title: String?,
    categoryId: String?
  ) {
    ExponentDB.experienceScopeKeyToExperience(
      experienceScopeKey,
      object : ExperienceResultListener {
        override fun onSuccess(exponentDBObject: ExponentDBObject) {
          try {
            sendNotification(
              context,
              message,
              channelId,
              exponentDBObject.manifestUrl,
              exponentDBObject.manifest,
              body,
              title,
              categoryId
            )
          } catch (e: JSONException) {
            EXL.e(TAG, "Couldn't deserialize JSON for experience scope key $experienceScopeKey")
          }
        }

        override fun onFailure() {
          EXL.e(TAG, "No experience found or invalid manifest for scope key $experienceScopeKey")
        }
      }
    )
  }

  @Throws(JSONException::class)
  private fun sendNotification(
    context: Context,
    message: String?,
    channelId: String?,
    manifestUrl: String,
    manifest: Manifest,
    body: String?,
    title: String?,
    categoryId: String?
  ) {
    val experienceKey = ExperienceKey.fromManifest(manifest)
    val name = manifest.getName()
    if (name == null) {
      EXL.e(TAG, "No name found for experience scope key " + experienceKey.scopeKey)
      return
    }

    val manager = ExponentNotificationManager(context)
    val notificationPreferences = manifest.getNotificationPreferences()

    NotificationHelper.loadIcon(
      null,
      manifest,
      exponentManifest,
      object : BitmapListener {
        override fun onLoadBitmap(bitmap: Bitmap?) {
          var mode = Mode.DEFAULT
          var collapsedTitle: String? = null
          var unreadNotifications = JSONArray()

          // Modes
          if (notificationPreferences != null) {
            val modeString = notificationPreferences.getNullable<String>(ExponentManifest.MANIFEST_NOTIFICATION_ANDROID_MODE)
            if (NotificationConstants.NOTIFICATION_COLLAPSE_MODE == modeString) {
              mode = Mode.COLLAPSE
            }
          }

          // Update metadata
          val notificationId = if (mode == Mode.COLLAPSE) experienceKey.scopeKey.hashCode() else Random().nextInt()
          addUnreadNotificationToMetadata(experienceKey, message, notificationId)

          // Collapse mode fields
          if (mode == Mode.COLLAPSE) {
            unreadNotifications = getUnreadNotificationsFromMetadata(experienceKey)
            val collapsedTitleRaw = notificationPreferences!!.getNullable<String>(ExponentManifest.MANIFEST_NOTIFICATION_ANDROID_COLLAPSED_TITLE)
            if (collapsedTitleRaw != null) {
              collapsedTitle = collapsedTitleRaw.replace(NotificationConstants.NOTIFICATION_UNREAD_COUNT_KEY, "" + unreadNotifications.length())
            }
          }

          val scopedChannelId: String
          var defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
          if (channelId != null) {
            scopedChannelId = ExponentNotificationManager.getScopedChannelId(experienceKey, channelId)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              // if we don't yet have a channel matching this ID, check shared preferences --
              // it's possible this device has just been upgraded to Android 8+ and the channel
              // needs to be created in the system
              if (manager.getNotificationChannel(experienceKey, channelId) == null) {
                val storedChannelDetails = manager.readChannelSettings(experienceKey, channelId)
                if (storedChannelDetails != null) {
                  NotificationHelper.createChannel(context, experienceKey, channelId, storedChannelDetails)
                }
              }
            } else {
              // on Android 7.1 and below, read channel settings for sound from shared preferences
              // and apply this to the notification individually, since channels do not exist
              val storedChannelDetails = manager.readChannelSettings(experienceKey, channelId)
              if (storedChannelDetails != null) {
                // Default to `sound: true` if nothing is stored for this channel
                // to match old behavior of push notifications on Android 7.1 and below (always had sound)
                if (!storedChannelDetails.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_SOUND, true)) {
                  defaultSoundUri = null
                }
              }
            }
          } else {
            scopedChannelId = ExponentNotificationManager.getScopedChannelId(
              experienceKey,
              NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID
            )
            NotificationHelper.createChannel(
              context,
              experienceKey,
              NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID,
              context.getString(R.string.default_notification_channel_group),
              hashMapOf<Any, Any>()
            )
          }
          val color = NotificationHelper.getColor(null, manifest, exponentManifest)

          // Create notification object
          val isMultiple = mode == Mode.COLLAPSE && unreadNotifications.length() > 1
          val notificationEvent = ReceivedNotificationEvent(experienceKey.scopeKey, body, notificationId, isMultiple, true)

          // Create pending intent
          val intent = Intent(context, KernelConstants.MAIN_ACTIVITY_CLASS).apply {
            putExtra(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY, manifestUrl)
            putExtra(KernelConstants.NOTIFICATION_KEY, body) // deprecated
            putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, notificationEvent.toJSONObject(null).toString())
          }
          val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_ONE_SHOT
          )

          // Build notification
          val notificationBuilder = if (isMultiple) {
            val style = NotificationCompat.InboxStyle().setBigContentTitle(collapsedTitle)

            for (i in 0 until min(unreadNotifications.length(), NotificationConstants.MAX_COLLAPSED_NOTIFICATIONS)) {
              try {
                val unreadNotification = unreadNotifications[i] as JSONObject
                style.addLine(unreadNotification.getString(NotificationConstants.NOTIFICATION_MESSAGE_KEY))
              } catch (e: JSONException) {
                e.printStackTrace()
              }
            }

            if (unreadNotifications.length() > NotificationConstants.MAX_COLLAPSED_NOTIFICATIONS) {
              style.addLine("and " + (unreadNotifications.length() - NotificationConstants.MAX_COLLAPSED_NOTIFICATIONS) + " more...")
            }

            NotificationCompat.Builder(context, scopedChannelId)
              .setSmallIcon(if (Constants.isStandaloneApp()) R.drawable.shell_notification_icon else R.drawable.notification_icon)
              .setContentTitle(collapsedTitle)
              .setColor(color)
              .setContentText(name)
              .setAutoCancel(true)
              .setSound(defaultSoundUri)
              .setContentIntent(pendingIntent)
              .setStyle(style)
          } else {
            val contentTitle: String = if (title == null) {
              name
            } else {
              if (Constants.isStandaloneApp()) title else "$name - $title"
            }

            NotificationCompat.Builder(context, scopedChannelId)
              .setSmallIcon(if (Constants.isStandaloneApp()) R.drawable.shell_notification_icon else R.drawable.notification_icon)
              .setContentTitle(contentTitle)
              .setColor(color)
              .setContentText(message)
              .setStyle(NotificationCompat.BigTextStyle().bigText(message))
              .setAutoCancel(true)
              .setSound(defaultSoundUri)
              .setContentIntent(pendingIntent)
          }

          Thread { // Add actions
            if (categoryId != null) {
              NotificationActionCenter.setCategory(
                categoryId,
                notificationBuilder,
                context,
                object : IntentProvider {
                  override fun provide(): Intent {
                    return Intent(context, KernelConstants.MAIN_ACTIVITY_CLASS).apply {
                      putExtra(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY, manifestUrl)
                      putExtra(KernelConstants.NOTIFICATION_KEY, body) // deprecated
                      putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, notificationEvent.toJSONObject(null).toString())
                    }
                  }
                }
              )
            }

            // Add icon
            val notification: Notification = if (manifestUrl != Constants.INITIAL_URL) {
              notificationBuilder.setLargeIcon(bitmap).build()
            } else {
              // TODO: don't actually need to load bitmap in this case
              notificationBuilder.build()
            }

            // Display
            manager.notify(experienceKey, notificationId, notification)

            // Send event. Will be consumed if experience is already open.
            EventBus.getDefault().post(notificationEvent)
          }.start()
        }
      }
    )
  }

  private fun addUnreadNotificationToMetadata(
    experienceKey: ExperienceKey,
    message: String?,
    notificationId: Int
  ) {
    try {
      val notification = JSONObject().apply {
        put(NotificationConstants.NOTIFICATION_MESSAGE_KEY, message)
        put(NotificationConstants.NOTIFICATION_ID_KEY, notificationId)
      }

      val metadata = (exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: JSONObject()).apply {
        val unreadNotifications = (optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS) ?: JSONArray()).apply {
          put(notification)
        }
        put(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS, unreadNotifications)
      }

      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  private fun getUnreadNotificationsFromMetadata(experienceKey: ExperienceKey): JSONArray {
    val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: return JSONArray()
    if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS)) {
      try {
        return metadata.getJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS)
      } catch (e: JSONException) {
        e.printStackTrace()
      }
    }
    return JSONArray()
  }

  fun removeNotifications(context: Context, unreadNotifications: JSONArray?) {
    if (unreadNotifications == null) {
      return
    }

    val notificationManager = NotificationManagerCompat.from(context)
    for (i in 0 until unreadNotifications.length()) {
      try {
        notificationManager.cancel(
          (unreadNotifications[i] as JSONObject).getString(
            NotificationConstants.NOTIFICATION_ID_KEY
          ).toInt()
        )
      } catch (e: JSONException) {
        e.printStackTrace()
      }
    }
  }

  companion object {
    private val TAG = PushNotificationHelper::class.java.simpleName

    val instance by lazy {
      PushNotificationHelper()
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(PushNotificationHelper::class.java, this)
  }
}
