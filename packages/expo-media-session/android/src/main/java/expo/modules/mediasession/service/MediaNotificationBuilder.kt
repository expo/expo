package expo.modules.mediasession.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.os.Build
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaStyleNotificationHelper
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.RemoteCommand

@OptIn(UnstableApi::class)
internal object MediaNotificationBuilder {
  const val CHANNEL_ID = "expo_media_session"
  private const val CHANNEL_NAME = "Now Playing"
  private const val EMPTY_TITLE = "\u200E"

  private const val ACTION_PREFIX = "expo.modules.mediasession.action."

  private fun action(button: TransportButton, isPlaying: Boolean) = ACTION_PREFIX + when (button) {
    TransportButton.PLAY_PAUSE -> if (isPlaying) {
      "PAUSE"
    } else {
      "PLAY"
    }
    else -> button.name
  }

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) == null) {
      manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW))
    }
  }

  fun build(
    context: Context,
    session: MediaSession,
    state: NowPlayingCenterState,
    isPlaying: Boolean,
    artwork: Bitmap?,
    isForeground: Boolean
  ): Notification {
    val info = state.info
    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
      .setContentTitle(info.title?.takeIf { it.isNotEmpty() } ?: EMPTY_TITLE)
      .setContentText(info.artist)
      .setSubText(info.album)
      .setLargeIcon(artwork)
      .setContentIntent(session.sessionActivity)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(false)
      .setOngoing(isForeground)
    val style = MediaStyleNotificationHelper.MediaStyle(session)
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
      val layout = transportLayout(state.commands)
      layout.forEach { button ->
        val intent = actionIntent(context, action(button, isPlaying))
        builder.addAction(NotificationCompat.Action(icon(button, isPlaying), title(button, isPlaying), intent))
      }
      style.setShowActionsInCompactView(*IntArray(layout.size) { it })
    }
    return builder.setStyle(style).build()
  }

  fun commandButtons(state: NowPlayingCenterState, isPlaying: Boolean): List<CommandButton> =
    transportLayout(state.commands).map { button ->
      CommandButton.Builder(buttonIcon(button, isPlaying, state))
        .setDisplayName(title(button, isPlaying))
        .setPlayerCommand(playerCommand(button))
        .setSlots(slot(button))
        .build()
    }

  fun isOwnAction(action: String?) = action?.startsWith(ACTION_PREFIX) == true

  fun commandFor(action: String?, state: NowPlayingCenterState, isPlaying: Boolean): RemoteCommand? {
    val name = action?.takeIf(::isOwnAction)?.removePrefix(ACTION_PREFIX) ?: return null
    return when (name) {
      "PLAY" -> playWhenReadyCommand(true, state.commands, isPlaying)
      "PAUSE" -> playWhenReadyCommand(false, state.commands, isPlaying)
      else -> TransportButton.entries.firstOrNull { it.name == name }?.let { seekCommand(playerCommand(it), 0, state.info) }
    }
  }

  private fun actionIntent(context: Context, action: String): PendingIntent = PendingIntent.getService(
    context,
    action.hashCode(),
    Intent(context, MediaPlaybackService::class.java).setAction(action),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )

  private fun playerCommand(button: TransportButton) = when (button) {
    TransportButton.PREVIOUS_TRACK -> Player.COMMAND_SEEK_TO_PREVIOUS
    TransportButton.SKIP_BACKWARD -> Player.COMMAND_SEEK_BACK
    TransportButton.PLAY_PAUSE -> Player.COMMAND_PLAY_PAUSE
    TransportButton.NEXT_TRACK -> Player.COMMAND_SEEK_TO_NEXT
    TransportButton.SKIP_FORWARD -> Player.COMMAND_SEEK_FORWARD
  }

  private fun slot(button: TransportButton) = when (button) {
    TransportButton.PREVIOUS_TRACK, TransportButton.SKIP_BACKWARD -> CommandButton.SLOT_BACK
    TransportButton.PLAY_PAUSE -> CommandButton.SLOT_CENTRAL
    TransportButton.NEXT_TRACK, TransportButton.SKIP_FORWARD -> CommandButton.SLOT_FORWARD
  }

  private fun title(button: TransportButton, isPlaying: Boolean) = when (button) {
    TransportButton.PREVIOUS_TRACK -> "Previous track"
    TransportButton.SKIP_BACKWARD -> "Skip backward"
    TransportButton.PLAY_PAUSE -> if (isPlaying) {
      "Pause"
    } else {
      "Play"
    }
    TransportButton.NEXT_TRACK -> "Next track"
    TransportButton.SKIP_FORWARD -> "Skip forward"
  }

  private fun icon(button: TransportButton, isPlaying: Boolean) = when (button) {
    TransportButton.PREVIOUS_TRACK -> androidx.media3.session.R.drawable.media3_icon_previous
    TransportButton.SKIP_BACKWARD -> androidx.media3.session.R.drawable.media3_icon_skip_back
    TransportButton.PLAY_PAUSE -> if (isPlaying) {
      androidx.media3.session.R.drawable.media3_icon_pause
    } else {
      androidx.media3.session.R.drawable.media3_icon_play
    }
    TransportButton.NEXT_TRACK -> androidx.media3.session.R.drawable.media3_icon_next
    TransportButton.SKIP_FORWARD -> androidx.media3.session.R.drawable.media3_icon_skip_forward
  }

  private fun buttonIcon(button: TransportButton, isPlaying: Boolean, state: NowPlayingCenterState) = when (button) {
    TransportButton.PREVIOUS_TRACK -> CommandButton.ICON_PREVIOUS
    TransportButton.PLAY_PAUSE -> if (isPlaying) {
      CommandButton.ICON_PAUSE
    } else {
      CommandButton.ICON_PLAY
    }
    TransportButton.NEXT_TRACK -> CommandButton.ICON_NEXT
    TransportButton.SKIP_BACKWARD -> when (skipIntervalSeconds(state.info.skipBackwardInterval)) {
      5.0 -> CommandButton.ICON_SKIP_BACK_5
      10.0 -> CommandButton.ICON_SKIP_BACK_10
      15.0 -> CommandButton.ICON_SKIP_BACK_15
      30.0 -> CommandButton.ICON_SKIP_BACK_30
      else -> CommandButton.ICON_SKIP_BACK
    }
    TransportButton.SKIP_FORWARD -> when (skipIntervalSeconds(state.info.skipForwardInterval)) {
      5.0 -> CommandButton.ICON_SKIP_FORWARD_5
      10.0 -> CommandButton.ICON_SKIP_FORWARD_10
      15.0 -> CommandButton.ICON_SKIP_FORWARD_15
      30.0 -> CommandButton.ICON_SKIP_FORWARD_30
      else -> CommandButton.ICON_SKIP_FORWARD
    }
  }
}
