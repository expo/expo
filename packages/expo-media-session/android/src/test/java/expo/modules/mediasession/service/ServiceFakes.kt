package expo.modules.mediasession.service

import android.app.ForegroundServiceStartNotAllowedException
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import expo.modules.mediasession.FakeNowPlayingOwner
import expo.modules.mediasession.MediaPlayerOwner
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.NowPlayingMediaType
import expo.modules.mediasession.RemoteCommand
import java.lang.reflect.Proxy

internal class FakeServiceHost : PlaybackServiceHost {
  val calls = mutableListOf<String>()
  var bindResult = true
  override var isForegroundAllowed = true
  var startForegroundError: Exception? = null
  var startForegroundResult = true
  val cancelled = mutableListOf<Int>()

  override fun bind(): Boolean {
    calls.add("bind")
    return bindResult
  }

  override fun unbind() {
    calls.add("unbind")
  }

  override fun startForeground(notificationId: Int): Boolean {
    calls.add("startForeground($notificationId)")
    startForegroundError?.let { throw it }
    return startForegroundResult
  }

  override fun stopForeground(removeNotification: Boolean) {
    calls.add(
      if (removeNotification) {
        "stopForeground(remove)"
      } else {
        "stopForeground(keep)"
      }
    )
  }

  override fun notify(notificationId: Int) {
    calls.add("notify($notificationId)")
  }

  override fun cancel(notificationId: Int) {
    calls.add("cancel($notificationId)")
    cancelled.add(notificationId)
  }

  override fun stopSelf() {
    calls.add("stopSelf")
  }

  override fun schedulePlayRequestTimeout() {
    calls.add("schedulePlayRequestTimeout")
  }

  fun take(): List<String> = calls.toList().also { calls.clear() }
}

internal class FakeSessionPlayer(val name: String, private val followsState: Boolean) : SessionPlayer {
  val applied = mutableListOf<NowPlayingCenterState>()
  var released = false
  var applyError: Exception? = null
  override var isPlaybackOngoing = false

  override fun apply(state: NowPlayingCenterState) {
    applyError?.let { throw it }
    applied.add(state)
    if (followsState) {
      isPlaybackOngoing = state.isPlaying
    }
  }

  override fun detach() {
    released = true
  }

  override fun toString() = name
}

internal class FakeSessionHandle(override val id: String, player: SessionPlayer) : SessionHandle {
  val players = mutableListOf(player)
  var released = false
  var layouts = 0

  override fun setPlayer(player: SessionPlayer) {
    players.add(player)
  }

  override fun applyLayout(state: NowPlayingCenterState, isPlaying: Boolean) {
    layouts += 1
  }

  override fun release() {
    released = true
  }
}

internal class FakeSessionFactory(private val onCommand: (RemoteCommand) -> Unit = {}) : SessionFactory {
  val created = mutableListOf<FakeSessionHandle>()
  val infoPlayers = mutableListOf<FakeSessionPlayer>()
  val forwardingPlayers = mutableListOf<FakeSessionPlayer>()
  var forwardingSupported = true

  override fun infoDriven() =
    FakeSessionPlayer("info${infoPlayers.size}", followsState = true).also { infoPlayers.add(it) }

  override fun forwarding(owner: MediaPlayerOwner): SessionPlayer? {
    if (!forwardingSupported) {
      return null
    }
    return FakeSessionPlayer("forwarding(${owner.nowPlayingId})", followsState = false).also {
      forwardingPlayers.add(it)
    }
  }

  override fun create(player: SessionPlayer) = FakeSessionHandle(MediaPlaybackServiceLogic.SESSION_ID, player).also {
    created.add(it)
  }

  fun sendFromSession(command: RemoteCommand) = onCommand(command)
}

internal fun foregroundServiceStartNotAllowed(): Exception =
  allocateWithoutConstructor(ForegroundServiceStartNotAllowedException::class.java) as Exception

internal fun allocateWithoutConstructor(type: Class<*>): Any {
  val unsafeClass = Class.forName("sun.misc.Unsafe")
  val unsafe = unsafeClass.getDeclaredField("theUnsafe").apply { isAccessible = true }.get(null)
  return unsafeClass.getMethod("allocateInstance", Class::class.java).invoke(unsafe, type)
}

internal fun stubPlayer(): Player = Proxy.newProxyInstance(
  Player::class.java.classLoader,
  arrayOf(Player::class.java)
) { _, method, _ ->
  when (method.returnType) {
    Boolean::class.javaPrimitiveType -> false
    Int::class.javaPrimitiveType -> 0
    Long::class.javaPrimitiveType -> 0L
    Float::class.javaPrimitiveType -> 0f
    MediaMetadata::class.java -> MediaMetadata.EMPTY
    else -> null
  }
} as Player

internal class FakeMediaPlayerOwner(id: String) : MediaPlayerOwner {
  private val delegate = FakeNowPlayingOwner(id, NowPlayingMediaType.VIDEO)
  override val player: Player = stubPlayer()
  override val nowPlayingId = id
  override val mediaType = NowPlayingMediaType.VIDEO
  override val isPlaying: Boolean
    get() = delegate.isPlaying

  override fun handle(command: RemoteCommand) = delegate.handle(command)
}
