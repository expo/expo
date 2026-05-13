package expo.modules.video.playbackService

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.annotation.MainThread
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.MediaStyleNotificationHelper
import androidx.media3.session.SessionCommand
import com.google.common.collect.ImmutableList
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.video.R
import expo.modules.video.getPlaybackServiceErrorMessage
import expo.modules.video.player.VideoPlayer
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class PlaybackServiceBinder(val service: ExpoVideoPlaybackService) : Binder()

@OptIn(UnstableApi::class)
class ExpoVideoPlaybackService : MediaSessionService() {
  private lateinit var weakContext: WeakReference<AppContext>
  var appContext: AppContext
    get() = weakContext.get() ?: throw Exceptions.AppContextLost()
    set(value) {
      weakContext = WeakReference(value)
    }
  private val mediaSessions = mutableMapOf<ExoPlayer, MediaSession>()
  private val binder = PlaybackServiceBinder(this)
  private var mostRecentInteractionSession: MediaSession? = null
  private var isForeground: Boolean = false

  private val commandSeekForward = SessionCommand(SEEK_FORWARD_COMMAND, Bundle.EMPTY)
  private val commandSeekBackward = SessionCommand(SEEK_BACKWARD_COMMAND, Bundle.EMPTY)
  private val seekForwardButton = CommandButton.Builder()
    .setDisplayName("rewind")
    .setSessionCommand(commandSeekForward)
    .setIconResId(R.drawable.seek_forwards_10s)
    .build()

  private val seekBackwardButton = CommandButton.Builder()
    .setDisplayName("forward")
    .setSessionCommand(commandSeekBackward)
    .setIconResId(R.drawable.seek_backwards_10s)
    .build()

  fun setShowNotification(showNotification: Boolean, player: ExoPlayer) {
    appContext.mainQueue.launch {
      val sessionExtras = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        mediaSessions[player]?.sessionExtras?.deepCopy() ?: Bundle()
      } else {
        Bundle()
      }
      sessionExtras.putBoolean(SESSION_SHOW_NOTIFICATION, showNotification)
      mediaSessions[player]?.let {
        it.sessionExtras = sessionExtras
        onUpdateNotification(it, showNotification && player.playWhenReady)
      }
    }
  }

  fun registerPlayer(videoPlayer: VideoPlayer) {
    appContext.mainQueue.launch {
      val player = videoPlayer.player
      if (mediaSessions[player] != null) {
        return@launch
      }

      val mediaSession = MediaSession.Builder(this@ExpoVideoPlaybackService, player)
        .setId("ExpoVideoPlaybackService_${player.hashCode()}")
        .setCallback(VideoMediaSessionCallback())
        .setCustomLayout(ImmutableList.of(seekBackwardButton, seekForwardButton))
        .build()

      // Replace the basic media session with a session connected to our playback service.
      videoPlayer.mediaSession.release()
      videoPlayer.mediaSession = mediaSession

      mediaSessions[player] = mediaSession
      addSession(mediaSession)
      setShowNotification(videoPlayer.showNowPlayingNotification, player)
    }
  }

  fun unregisterPlayer(player: ExoPlayer) {
    appContext.mainQueue.launch {
      hidePlayerNotification(player)
      val session = mediaSessions.remove(player)
      session?.release()
      if (mediaSessions.isEmpty()) {
        cleanup()
        stopSelf()
      } else {
        setMostRecentInteractionSession(findMostRecentInteractionSession())
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder {
    super.onBind(intent)
    return binder
  }

  override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
    appContext.mainQueue.launch {
      if (startInForegroundRequired && session.wantsToShowNotification()) {
        setMostRecentInteractionSession(session)
      } else {
        setMostRecentInteractionSession(findMostRecentInteractionSession())
      }
    }
  }

  @MainThread
  private fun setMostRecentInteractionSession(session: MediaSession?) {
    if (session?.player?.playWhenReady == false) {
      stopForeground(STOP_FOREGROUND_DETACH)
      isForeground = false
    }

    if (mostRecentInteractionSession != session) {
      hideAllNotifications()
    }

    mostRecentInteractionSession = session
    session?.let {
      createNotification(it, it.player.playWhenReady)
    } ?: run {
      stopForeground(STOP_FOREGROUND_REMOVE)
      isForeground = false
    }
  }

  /**
   * Finds a session that is playing media. And wants to show a notification
   * If none exists, returns a session that wants to show a notification.
   * The current mostRecentInteractionSession always has priority to reduce the number of unnecessary notification changes.
   */
  @MainThread
  private fun findMostRecentInteractionSession(): MediaSession? {
    val prioritizedSessions = (listOfNotNull(mostRecentInteractionSession) + mediaSessions.values.toList()).distinct()

    return prioritizedSessions.firstOrNull { it.wantsToShowNotification() && it.player.playWhenReady }
      ?: prioritizedSessions.firstOrNull { it.wantsToShowNotification() }
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    cleanup()
    stopSelf()
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
    return null
  }

  override fun onDestroy() {
    cleanup()
    super.onDestroy()
  }

  @MainThread
  private fun createNotification(session: MediaSession, startInForegroundRequired: Boolean = false) {
    if (session.player.currentMediaItem == null) {
      return
    }

    val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager.createNotificationChannel(NotificationChannel(CHANNEL_ID, CHANNEL_ID, NotificationManager.IMPORTANCE_LOW))
    }

    // If the title is null android sets the notification to "<AppName> is running..." we want to keep the notification empty.
    val contentTitle = session.player.currentMediaItem?.mediaMetadata?.title ?: "\u200E"
    val notificationCompat = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
      .setContentTitle(contentTitle)
      .setStyle(MediaStyleNotificationHelper.MediaStyle(session))
      .build()

    val notificationId = session.player.hashCode()

    if (startInForegroundRequired) {
      try {
        startForeground(notificationId, notificationCompat)
        isForeground = true
      } catch (e: Exception) {
        appContext.jsLogger?.error(getPlaybackServiceErrorMessage("Failed to start the expo-video foreground service"), e)
      }
    } else {
      notificationManager.notify(notificationId, notificationCompat)
    }
  }

  private fun cleanup() {
    appContext.mainQueue.launch {
      stopForeground(Service.STOP_FOREGROUND_REMOVE)
      isForeground = false

      hideAllNotifications()

      val sessionsToRelease = mediaSessions.values.toList()
      mediaSessions.clear()
      for (session in sessionsToRelease) {
        session.release()
      }

      val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        notificationManager.deleteNotificationChannel(CHANNEL_ID)
      }
    }
  }

  @MainThread
  private fun hidePlayerNotification(player: ExoPlayer) {
    val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(player.hashCode())
  }

  @MainThread
  private fun hideAllNotifications() {
    val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancelAll()
  }

  private fun MediaSession.wantsToShowNotification(): Boolean =
    this.sessionExtras.getBoolean(SESSION_SHOW_NOTIFICATION, false)

  companion object {
    const val SEEK_FORWARD_COMMAND = "SEEK_FORWARD"
    const val SEEK_BACKWARD_COMMAND = "SEEK_REWIND"
    const val CHANNEL_ID = "PlaybackService"
    const val SESSION_SHOW_NOTIFICATION = "showNotification"
    const val SEEK_INTERVAL_MS = 10000L

    fun startService(appContext: AppContext, context: Context, serviceConnection: PlaybackServiceConnection): Boolean {
      appContext.reactContext?.apply {
        val intent = Intent(context, ExpoVideoPlaybackService::class.java)
        intent.action = SERVICE_INTERFACE

        startService(intent)

        val flags = if (Build.VERSION.SDK_INT >= 29) {
          BIND_AUTO_CREATE or BIND_INCLUDE_CAPABILITIES
        } else {
          BIND_AUTO_CREATE
        }

        return bindService(intent, serviceConnection, flags)
      }
      return false
    }
  }
}
