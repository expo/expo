package expo.modules.mediasession.service

import android.app.Notification
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSessionService
import expo.modules.mediasession.RemoteCommand

/** Confined to the main looper. */
@OptIn(UnstableApi::class)
internal class ServiceConnector(
  private val context: Context,
  private val onCommand: (RemoteCommand) -> Unit
) : PlaybackServiceHost, ServiceConnection {
  lateinit var logic: MediaPlaybackServiceLogic

  private var service: MediaPlaybackService? = null
  private var bound = false
  private val handler = Handler(Looper.getMainLooper())
  private val playRequestTimeout = Runnable {
    logic.onPlayRequestExpired()
    service?.triggerNotificationUpdate()
  }

  override val isForegroundAllowed: Boolean by lazy { declaresForegroundPlayback() }

  override fun bind(): Boolean {
    val intent = Intent(context, MediaPlaybackService::class.java).setAction(MediaPlaybackService.ACTION_CONNECT)
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Context.BIND_AUTO_CREATE or Context.BIND_INCLUDE_CAPABILITIES
    } else {
      Context.BIND_AUTO_CREATE
    }
    bound = context.bindService(intent, this, flags)
    if (!bound) {
      unbindQuietly()
    }
    return bound
  }

  private fun unbindQuietly() {
    try {
      context.unbindService(this)
    } catch (_: IllegalArgumentException) {
    }
  }

  override fun unbind() {
    service?.detach()
    service = null
    if (bound) {
      bound = false
      unbindQuietly()
    }
  }

  override fun startForeground(notificationId: Int): Boolean {
    val service = service ?: return false
    service.startForegroundWith(notificationId, notification(service, isForeground = true) ?: return false)
    return true
  }

  override fun stopForeground(removeNotification: Boolean) {
    service?.stopForegroundWith(removeNotification)
  }

  override fun notify(notificationId: Int) {
    val service = service ?: return
    service.post(notificationId, notification(service, logic.isForeground) ?: return)
  }

  override fun cancel(notificationId: Int) {
    MediaPlaybackService.cancel(context, notificationId)
  }

  override fun stopSelf() {
    service?.stopSelf()
  }

  override fun schedulePlayRequestTimeout() {
    handler.removeCallbacks(playRequestTimeout)
    handler.postDelayed(playRequestTimeout, MediaSessionService.DEFAULT_FOREGROUND_SERVICE_TIMEOUT_MS)
  }

  override fun onServiceConnected(name: ComponentName, binder: IBinder) {
    val connected = (binder as? MediaPlaybackService.LocalBinder)?.service ?: return
    val session = (logic.session as? Media3SessionHandle)?.session
    service = connected
    connected.attach(this, session)
    logic.onServiceConnected()
  }

  override fun onServiceDisconnected(name: ComponentName) {
    service = null
    logic.onServiceDisconnected()
  }

  override fun onBindingDied(name: ComponentName) {
    service = null
    logic.onBindingDied()
  }

  fun onPlaybackChanged(startInForegroundRequired: Boolean = logic.isForeground) =
    logic.onPlaybackChanged(startInForegroundRequired)

  fun onNotificationAction(action: String?) {
    val state = logic.state ?: return
    MediaNotificationBuilder.commandFor(action, state, logic.isPlaybackOngoing)?.let(onCommand)
  }

  @Suppress("DEPRECATION")
  private fun declaresForegroundPlayback(): Boolean = try {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val info = context.packageManager.getServiceInfo(ComponentName(context, MediaPlaybackService::class.java), 0)
      info.foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK != 0
    } else {
      context.packageManager
        .getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)
        .requestedPermissions
        ?.contains("android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK") == true
    }
  } catch (e: PackageManager.NameNotFoundException) {
    false
  }

  private fun notification(service: MediaPlaybackService, isForeground: Boolean): Notification? {
    val session = (logic.session as? Media3SessionHandle)?.session ?: return null
    val state = logic.state ?: return null
    return MediaNotificationBuilder.build(
      service,
      session,
      state,
      logic.isPlaybackOngoing,
      service.artwork(session),
      isForeground
    )
  }
}
