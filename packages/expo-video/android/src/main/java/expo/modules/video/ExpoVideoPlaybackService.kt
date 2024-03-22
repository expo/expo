package expo.modules.video

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
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

class PlaybackServiceBinder(val service: ExpoVideoPlaybackService) : Binder()

@OptIn(UnstableApi::class)
class ExpoVideoPlaybackService : MediaSessionService() {
  private val mediaSessions = mutableMapOf<ExoPlayer, MediaSession>()
  private val binder = PlaybackServiceBinder(this)

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

  fun registerPlayer(player: ExoPlayer) {
    if (mediaSessions[player] != null) {
      return
    }

    val mediaSession = MediaSession.Builder(this, player)
      .setId("ExpoVideoPlaybackService_${player.hashCode()}")
      .setCallback(VideoMediaSessionCallback())
      .setCustomLayout(ImmutableList.of(seekBackwardButton, seekForwardButton))
      .build()

    mediaSessions[player] = mediaSession
    addSession(mediaSession)
  }

  fun unregisterPlayer(player: ExoPlayer) {
    hidePlayerNotification(player)
    val session = mediaSessions.remove(player)
    session?.release()
    if (mediaSessions.isEmpty()) {
      cleanup()
      stopSelf()
    }
  }

  override fun onBind(intent: Intent?): IBinder {
    super.onBind(intent)
    return binder
  }

  override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
    createNotification(session)
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

  private fun createNotification(session: MediaSession) {
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

    // Each of the players has it's own notification when playing.
    notificationManager.notify(session.player.hashCode(), notificationCompat)
  }

  private fun cleanup() {
    hideAllNotifications()
    mediaSessions.forEach { (_, session) ->
      session.release()
    }
    mediaSessions.clear()
  }

  private fun hidePlayerNotification(player: ExoPlayer) {
    val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(player.hashCode())
  }

  private fun hideAllNotifications() {
    val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancelAll()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager.deleteNotificationChannel(CHANNEL_ID)
    }
  }

  companion object {
    const val SEEK_FORWARD_COMMAND = "SEEK_FORWARD"
    const val SEEK_BACKWARD_COMMAND = "SEEK_REWIND"
    const val CHANNEL_ID = "PlaybackService"
    const val SEEK_INTERVAL_MS = 10000L
  }
}
