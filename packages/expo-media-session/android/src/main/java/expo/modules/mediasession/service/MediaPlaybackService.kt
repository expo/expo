package expo.modules.mediasession.service

import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.annotation.OptIn
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.google.common.util.concurrent.FutureCallback
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

@OptIn(UnstableApi::class)
class MediaPlaybackService : MediaSessionService() {
  internal inner class LocalBinder : Binder() {
    val service: MediaPlaybackService
      get() = this@MediaPlaybackService
  }

  private val binder = LocalBinder()
  private var connector: ServiceConnector? = null
  private var session: MediaSession? = null
  private var artwork: Pair<Uri, Bitmap>? = null
  private var artworkLoad: Pair<Uri, ListenableFuture<Bitmap>>? = null

  override fun onCreate() {
    super.onCreate()
    MediaNotificationBuilder.ensureChannel(this)
  }

  override fun onBind(intent: Intent?): IBinder? =
    if (intent?.action == ACTION_CONNECT) {
      binder
    } else {
      super.onBind(intent)
    }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val connector = connector
    if (connector == null) {
      cancel(this, MediaPlaybackServiceLogic.NOTIFICATION_ID)
      stopSelf()
      return START_NOT_STICKY
    }
    if (MediaNotificationBuilder.isOwnAction(intent?.action)) {
      connector.onNotificationAction(intent?.action)
      return START_NOT_STICKY
    }
    return super.onStartCommand(intent, flags, startId)
  }

  override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
    connector?.onPlaybackChanged(startInForegroundRequired)
  }

  // Media3's default pauses every player because it does not track our foreground state.
  override fun onTaskRemoved(rootIntent: Intent?) {}

  override fun onDestroy() {
    detach()
    super.onDestroy()
  }

  internal fun attach(connector: ServiceConnector, session: MediaSession?) {
    this.connector = connector
    if (this.session !== session) {
      this.session?.let {
        if (isSessionAdded(it)) {
          removeSession(it)
        }
      }
      this.session = session
      session?.let(::addSession)
    }
  }

  internal fun detach() {
    session?.let {
      if (isSessionAdded(it)) {
        removeSession(it)
      }
    }
    session = null
    connector = null
    artworkLoad?.second?.cancel(false)
    artworkLoad = null
    artwork = null
  }

  internal fun startForegroundWith(notificationId: Int, notification: Notification) {
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
    } else {
      0
    }
    ServiceCompat.startForeground(this, notificationId, notification, type)
  }

  internal fun stopForegroundWith(removeNotification: Boolean) {
    ServiceCompat.stopForeground(
      this,
      if (removeNotification) {
        ServiceCompat.STOP_FOREGROUND_REMOVE
      } else {
        ServiceCompat.STOP_FOREGROUND_DETACH
      }
    )
  }

  internal fun post(notificationId: Int, notification: Notification) {
    try {
      (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(notificationId, notification)
    } catch (e: SecurityException) {
      Log.w(TAG, "The Now Playing notification was not posted because the app cannot post notifications: ${e.message}")
    }
  }

  internal fun artwork(session: MediaSession): Bitmap? {
    val metadata = session.player.mediaMetadata
    val uri = metadata.artworkUri ?: return null
    artwork?.takeIf { it.first == uri }?.let { return it.second }
    if (artworkLoad?.first == uri) {
      return null
    }
    artworkLoad?.second?.cancel(false)
    val future = session.bitmapLoader.loadBitmapFromMetadata(metadata) ?: return null
    artworkLoad = uri to future
    Futures.addCallback(
      future,
      object : FutureCallback<Bitmap> {
        override fun onSuccess(result: Bitmap) {
          if (artworkLoad?.first == uri) {
            artworkLoad = null
            artwork = uri to result
            connector?.onPlaybackChanged()
          }
        }

        override fun onFailure(t: Throwable) {
          if (artworkLoad?.first == uri) {
            artworkLoad = null
            Log.w(TAG, "The Now Playing artwork could not be loaded from $uri: ${t.message}")
          }
        }
      },
      ContextCompat.getMainExecutor(this)
    )
    return null
  }

  internal companion object {
    const val ACTION_CONNECT = "expo.modules.mediasession.action.CONNECT"
    private const val TAG = "ExpoMediaSession"

    fun cancel(context: Context, notificationId: Int) {
      (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(notificationId)
    }
  }
}
