package host.exp.exponent.notifications

import android.content.Context
import android.util.Log
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager
import expo.modules.notifications.notifications.interfaces.NotificationBuilder
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.presentation.builders.CategoryAwareNotificationBuilder
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import expo.modules.manifests.core.Manifest
import host.exp.exponent.ExponentManifest
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import host.exp.exponent.storage.ExponentDB
import host.exp.expoview.R
import org.json.JSONException
import versioned.host.exp.exponent.modules.api.notifications.channels.ScopedNotificationsChannelManager
import versioned.host.exp.exponent.modules.api.notifications.channels.ScopedNotificationsGroupManager
import javax.inject.Inject

open class ScopedExpoNotificationBuilder(
  context: Context,
  store: SharedPreferencesNotificationCategoriesStore?
) : CategoryAwareNotificationBuilder(context, store!!) {
  @Inject
  lateinit var exponentManifest: ExponentManifest

  var manifest: Manifest? = null
  var experienceKey: ExperienceKey? = null

  override fun setNotification(notification: Notification): NotificationBuilder {
    super.setNotification(notification)

    // We parse manifest here to have easy access to it from other methods.
    val requester = getNotification().notificationRequest
    if (requester is ScopedNotificationRequest) {
      val experienceScopeKey = requester.experienceScopeKeyString
      try {
        val exponentDBObject = ExponentDB.experienceScopeKeyToExperienceSync(experienceScopeKey!!)
        manifest = exponentDBObject!!.manifest
        experienceKey = ExperienceKey.fromManifest(manifest!!)
      } catch (e: JSONException) {
        Log.e("notifications", "Couldn't parse manifest.", e)
        e.printStackTrace()
      }
    }
    return this
  }

  override fun getNotificationsChannelManager(): NotificationsChannelManager {
    return if (experienceKey == null) {
      super.getNotificationsChannelManager()
    } else {
      ScopedNotificationsChannelManager(
        context,
        experienceKey,
        ScopedNotificationsGroupManager(
          context,
          experienceKey
        )
      )
    }
  }

  override fun getIcon(): Int {
    return R.drawable.notification_icon
  }

  override fun getColor(): Number? {
    // Try to use color defined in notification content
    if (notificationContent.color != null) {
      return notificationContent.color
    }
    return if (manifest == null) {
      super.getColor()
    } else {
      NotificationHelper.getColor(null, manifest!!, exponentManifest)
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ScopedExpoNotificationBuilder::class.java, this)
  }
}
