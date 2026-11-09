package expo.modules.mediasession.service

import expo.modules.kotlin.exception.CodedException
import expo.modules.mediasession.MediaPlayerOwner
import expo.modules.mediasession.MediaSessionException
import expo.modules.mediasession.NowPlayingCenterBackend
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.RemoteCommand
import java.lang.ref.WeakReference

/** Confined to the session looper (main). */
internal interface SessionPlayer {
  val isPlaybackOngoing: Boolean
  fun apply(state: NowPlayingCenterState)
  fun detach()
}

/** Confined to the session looper (main). */
internal interface SessionHandle {
  val id: String
  fun setPlayer(player: SessionPlayer)
  fun applyLayout(state: NowPlayingCenterState, isPlaying: Boolean)
  fun release()
}

/** Confined to the session looper (main). */
internal interface SessionFactory {
  fun infoDriven(): SessionPlayer

  /** Returns null when the owner's player can't share the session looper. */
  fun forwarding(owner: MediaPlayerOwner): SessionPlayer?

  fun create(player: SessionPlayer): SessionHandle
}

/** Confined to the session looper (main). */
internal interface PlaybackServiceHost {
  val isForegroundAllowed: Boolean
  fun bind(): Boolean
  fun unbind()
  fun startForeground(notificationId: Int): Boolean
  fun stopForeground(removeNotification: Boolean)
  fun notify(notificationId: Int)
  fun cancel(notificationId: Int)
  fun stopSelf()
  fun schedulePlayRequestTimeout()
}

internal class NowPlayingSessionCenter(private val post: (() -> Unit) -> Unit) : NowPlayingCenterBackend {
  lateinit var logic: MediaPlaybackServiceLogic

  @Volatile
  private var onCommand: (RemoteCommand) -> Unit = {}

  @Volatile
  private var onFailure: (CodedException) -> Unit = {}

  override fun setCommandHandler(handler: (RemoteCommand) -> Unit) {
    onCommand = handler
  }

  override fun setFailureHandler(handler: (CodedException) -> Unit) {
    onFailure = handler
  }

  // Called on the coordinator thread; states reach the session looper in order.
  override fun apply(state: NowPlayingCenterState?) {
    post {
      try {
        logic.apply(state)
      } catch (e: Exception) {
        onFailure(
          MediaSessionException(
            "Now Playing could not be updated: ${e.message}. Check the info and commands passed to the last " +
              "offerNowPlaying or update call",
            e
          )
        )
      }
    }
  }

  fun send(command: RemoteCommand) = onCommand(command)

  fun fail(error: CodedException) = onFailure(error)
}

/** Confined to the session looper (main). */
internal class MediaPlaybackServiceLogic(
  private val sessions: SessionFactory,
  private val host: PlaybackServiceHost,
  private val onFailure: (CodedException) -> Unit
) {
  private enum class Binding { UNBOUND, BINDING, BOUND, FAILED }

  private var binding = Binding.UNBOUND
  private var player: SessionPlayer? = null
  private var infoPlayer: SessionPlayer? = null
  private var forwardedOwner: WeakReference<MediaPlayerOwner>? = null
  private var foregroundRefused = false
  private var playRequested = false

  var state: NowPlayingCenterState? = null
    private set

  var session: SessionHandle? = null
    private set

  var isForeground = false
    private set

  val isPlaybackOngoing: Boolean
    get() = player?.isPlaybackOngoing == true

  fun apply(state: NowPlayingCenterState?) {
    this.state = state
    if (state == null) {
      tearDown()
      return
    }
    val next = playerFor(state)
    next.apply(state)
    val current = session
    if (current == null) {
      session = try {
        sessions.create(next)
      } catch (e: Exception) {
        onFailure(
          MediaSessionException(
            "The media session for Now Playing could not be created: ${e.message}. " +
              "Check that no other library creates a Media3 session with the id $SESSION_ID",
            e
          )
        )
        return
      }
    } else if (next !== player) {
      current.setPlayer(next)
    }
    if (player !== next) {
      player?.takeIf { it !== infoPlayer }?.detach()
      player = next
    }
    session?.applyLayout(state, next.isPlaybackOngoing)
    if (binding == Binding.UNBOUND) {
      bind()
    }
    refresh(force = isForeground)
  }

  fun onPlaybackChanged(startInForegroundRequired: Boolean = isForeground) {
    val state = state ?: return
    session?.applyLayout(state, isPlaybackOngoing)
    refresh(force = startInForegroundRequired || playRequested)
  }

  fun onPlayRequested() {
    if (state == null) {
      return
    }
    playRequested = true
    refresh(force = true)
    host.schedulePlayRequestTimeout()
  }

  fun onPlayRequestExpired() {
    playRequested = false
  }

  fun onServiceConnected() {
    binding = Binding.BOUND
    refresh(force = playRequested)
  }

  fun onServiceDisconnected() {
    binding = Binding.BINDING
    isForeground = false
  }

  fun onBindingDied() {
    host.unbind()
    binding = Binding.UNBOUND
    isForeground = false
    if (state != null) {
      bind()
    }
  }

  private fun playerFor(state: NowPlayingCenterState): SessionPlayer {
    val owner = state.owner
    if (owner is MediaPlayerOwner) {
      val current = player
      if (current != null && current !== infoPlayer && forwardedOwner?.get() === owner) {
        return current
      }
      sessions.forwarding(owner)?.let {
        forwardedOwner = WeakReference(owner)
        return it
      }
    }
    return infoPlayer ?: sessions.infoDriven().also { infoPlayer = it }
  }

  private fun bind() {
    var cause: Exception? = null
    val bound = try {
      host.bind()
    } catch (e: Exception) {
      cause = e
      false
    }
    binding = if (bound) {
      Binding.BINDING
    } else {
      Binding.FAILED
    }
    if (!bound) {
      onFailure(
        MediaSessionException(
          "The Now Playing notification could not start because the expo-media-session playback service " +
            "is not declared in AndroidManifest.xml. Add the expo-media-session config plugin to the app config " +
            "and rebuild the app",
          cause
        )
      )
    }
  }

  private fun refresh(force: Boolean = false) {
    if (binding != Binding.BOUND) {
      return
    }
    if (isPlaybackOngoing || force) {
      if (isForeground || !host.isForegroundAllowed) {
        host.notify(NOTIFICATION_ID)
        return
      }
      try {
        isForeground = host.startForeground(NOTIFICATION_ID)
        foregroundRefused = false
      } catch (e: Exception) {
        if (isPlaybackOngoing && !foregroundRefused) {
          foregroundRefused = true
          onFailure(foregroundStartFailure(e))
        }
        host.notify(NOTIFICATION_ID)
      }
    } else {
      foregroundRefused = false
      if (isForeground) {
        host.stopForeground(removeNotification = false)
        isForeground = false
      }
      host.notify(NOTIFICATION_ID)
    }
  }

  private fun foregroundStartFailure(e: Exception) =
    if (e.javaClass.name == "android.app.ForegroundServiceStartNotAllowedException") {
      MediaSessionException(
        "Playback may stop in the background because Android did not allow the media playback service " +
          "to start in the foreground: ${e.message}. Start playback while the app is visible, or from the " +
          "notification or a media button",
        e
      )
    } else {
      MediaSessionException(
        "The media playback service could not start in the foreground: ${e.message}. The app may be missing the " +
          "mediaPlayback foreground service type or the FOREGROUND_SERVICE_MEDIA_PLAYBACK permission. Add the " +
          "expo-media-session config plugin to the app config and rebuild the app",
        e
      )
    }

  private fun tearDown() {
    if (binding == Binding.BOUND) {
      host.stopForeground(removeNotification = true)
    }
    host.cancel(NOTIFICATION_ID)
    if (binding == Binding.BOUND) {
      host.stopSelf()
    }
    if (binding == Binding.BOUND || binding == Binding.BINDING) {
      host.unbind()
    }
    binding = Binding.UNBOUND
    isForeground = false
    foregroundRefused = false
    playRequested = false
    session?.release()
    session = null
    player?.takeIf { it !== infoPlayer }?.detach()
    infoPlayer?.detach()
    player = null
    infoPlayer = null
    forwardedOwner = null
  }

  companion object {
    const val SESSION_ID = "ExpoMediaSession"
    const val NOTIFICATION_ID = 0x4D53
  }
}
