package expo.modules.mediasession.service

import android.app.PendingIntent
import android.content.Context
import android.os.Looper
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession
import expo.modules.mediasession.MediaPlayerOwner
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.RemoteCommand

/** Confined to the main looper, which every session player shares. */
@OptIn(UnstableApi::class)
internal class Media3SessionFactory(
  private val context: Context,
  private val onPlayRequested: () -> Unit,
  private val onCommand: (RemoteCommand) -> Unit
) : SessionFactory {
  private val looper = Looper.getMainLooper()

  override fun infoDriven(): SessionPlayer = InfoDrivenPlayer(looper, onPlayRequested, onCommand)

  override fun forwarding(owner: MediaPlayerOwner): SessionPlayer? {
    val player = owner.player
    if (player.applicationLooper != looper) {
      Log.w(TAG, "The player of ${owner.nowPlayingId} does not run on the main looper, so Now Playing shows its info only")
      return null
    }
    return OwnerForwardingPlayer(player, onPlayRequested, onCommand)
  }

  override fun create(player: SessionPlayer): SessionHandle {
    val builder = MediaSession.Builder(context, player as Player).setId(MediaPlaybackServiceLogic.SESSION_ID)
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launch ->
      builder.setSessionActivity(
        PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      )
    }
    return Media3SessionHandle(builder.build())
  }

  private companion object {
    const val TAG = "ExpoMediaSession"
  }
}

@OptIn(UnstableApi::class)
internal class Media3SessionHandle(val session: MediaSession) : SessionHandle {
  private var buttons: List<CommandButton> = emptyList()

  override val id: String
    get() = session.id

  override fun setPlayer(player: SessionPlayer) {
    session.player = player as Player
  }

  override fun applyLayout(state: NowPlayingCenterState, isPlaying: Boolean) {
    val next = MediaNotificationBuilder.commandButtons(state, isPlaying)
    if (next != buttons) {
      buttons = next
      session.setMediaButtonPreferences(next)
    }
  }

  override fun release() {
    session.release()
  }
}
