package expo.modules.location.services

import android.annotation.TargetApi
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder

class LocationTaskService : Service() {
  private var mChannelId: String? = null
  private var mKillService = false
  private lateinit var mParentContext: Context
  private val mServiceId = sServiceId++
  private val mBinder: IBinder = ServiceBinder()

  inner class ServiceBinder : Binder() {
    val service: LocationTaskService
      get() = this@LocationTaskService
  }

  override fun onBind(intent: Intent): IBinder {
    return mBinder
  }

  @TargetApi(26)
  override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
    val extras = intent.extras
    if (extras != null) {
      mChannelId = extras.getString("appId") + ":" + extras.getString("taskName")
      mKillService = extras.getBoolean("killService", false)
    }
    return START_REDELIVER_INTENT
  }

  fun setParentContext(context: Context) {
    // Background location logic is still outside LocationTaskService,
    // so we have to save parent context in order to make sure it won't be destroyed by the OS.
    mParentContext = context
  }

  fun stop() {
    stopForeground(true)
    stopSelf()
  }

  override fun onTaskRemoved(rootIntent: Intent) {
    if (mKillService) {
      super.onTaskRemoved(rootIntent)
      stop()
    }
  }

  fun startForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    startForeground(mServiceId, notification)
  }

  //region private
  @TargetApi(26)
  private fun buildServiceNotification(serviceOptions: Bundle): Notification {
    prepareChannel(mChannelId)
    val builder = Notification.Builder(this, mChannelId)
    val title = serviceOptions.getString("notificationTitle")
    val body = serviceOptions.getString("notificationBody")
    val color = colorStringToInteger(serviceOptions.getString("notificationColor"))

    title?.let { builder.setContentTitle(title) }
    body?.let { builder.setContentText(body) }
    color?.let {
      builder.setColorized(true).setColor(color)
    } ?: run {
      builder.setColorized(false)
    }

    mParentContext.packageManager.getLaunchIntentForPackage(mParentContext.packageName)?.let {
      it.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
      // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      val contentIntent = PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
      builder.setContentIntent(contentIntent)
    }

    return builder.setCategory(Notification.CATEGORY_SERVICE)
      .setSmallIcon(applicationInfo.icon)
      .build()
  }

  @TargetApi(26)
  private fun prepareChannel(id: String?) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager
      ?: return
    val appName = applicationInfo.loadLabel(packageManager).toString()
    var channel = notificationManager.getNotificationChannel(id)
    if (channel == null) {
      channel = NotificationChannel(id, appName, NotificationManager.IMPORTANCE_LOW)
      channel.description = "Background location notification channel"
      notificationManager.createNotificationChannel(channel)
    }
  }

  private fun colorStringToInteger(color: String?): Int? {
    return try {
      Color.parseColor(color)
    } catch (e: Exception) {
      null
    }
  } //endregion

  companion object {
    private var sServiceId = 481756
  }
}
