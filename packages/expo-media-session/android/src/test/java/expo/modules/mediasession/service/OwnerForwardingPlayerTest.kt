package expo.modules.mediasession.service

import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.NowPlayingInfo
import expo.modules.mediasession.NowPlayingMediaType
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind
import androidx.media3.common.AudioAttributes
import androidx.media3.common.DeviceInfo
import androidx.media3.common.MediaItem
import androidx.media3.common.Metadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Timeline
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.common.Tracks
import androidx.media3.common.VideoSize
import androidx.media3.common.text.Cue
import androidx.media3.common.text.CueGroup
import java.lang.reflect.Method
import java.lang.reflect.Modifier
import java.lang.reflect.Proxy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

class OwnerForwardingPlayerTest {
  private val commands = mutableListOf<RemoteCommand>()
  private val underlyingCalls = mutableListOf<String>()
  private val underlying = Proxy.newProxyInstance(
    Player::class.java.classLoader,
    arrayOf(Player::class.java)
  ) { _, method, _ ->
    underlyingCalls.add(method.name)
    when (method.returnType) {
      Boolean::class.javaPrimitiveType -> false
      Int::class.javaPrimitiveType -> 0
      Long::class.javaPrimitiveType -> 30_000L
      Float::class.javaPrimitiveType -> 0f
      MediaMetadata::class.java -> MediaMetadata.Builder().setTitle("Underlying").build()
      else -> null
    }
  } as Player

  private val commandsBeforePlayRequest = mutableListOf<Int>()
  private val player = OwnerForwardingPlayer(underlying, { commandsBeforePlayRequest.add(commands.size) }) { commands.add(it) }

  private fun apply(kinds: Set<RemoteCommandKind>, info: NowPlayingInfo = NowPlayingInfo(title = "Injected")) {
    player.apply(NowPlayingCenterState(info, NowPlayingMediaType.AUDIO, true, kinds))
  }

  @Test
  fun everyListenerCallbackIsForwarded() {
    val listener = RecordingListener()
    val forwarding = MetadataForwardingListener(listener, player) { MediaMetadata.EMPTY }

    val methods = Player.Listener::class.java.methods.filter { it.isDefault }
    val declared = MetadataForwardingListener::class.java.declaredMethods.map { it.signature }
    val invocable = methods.filter { method -> method.parameterTypes.none { it in androidBackedTypes } }
    invocable.forEach { it.invoke(forwarding, *it.parameterTypes.map(::sample).toTypedArray()) }

    assertEquals(37, methods.size)
    assertTrue(methods.map { it.signature }.all { it in declared })
    assertEquals(36, invocable.size)
    assertEquals(invocable.map { it.signature }.sorted(), listener.received.sorted())
  }

  @Test
  fun metadataAndEventsCarryTheForwardingPlayer() {
    var metadata: MediaMetadata? = null
    var eventsPlayer: Player? = null
    val listener = object : Player.Listener {
      override fun onMediaMetadataChanged(mediaMetadata: MediaMetadata) {
        metadata = mediaMetadata
      }

      override fun onEvents(player: Player, events: Player.Events) {
        eventsPlayer = player
      }
    }
    val injected = MediaMetadata.Builder().setTitle("Injected").build()
    val forwarding = MetadataForwardingListener(listener, player) { injected }

    forwarding.onMediaMetadataChanged(MediaMetadata.EMPTY)
    forwarding.onEvents(underlying, sample(Player.Events::class.java) as Player.Events)

    assertSame(injected, metadata)
    assertSame(player, eventsPlayer)
  }

  @Test
  fun incrementCallbacksCarryTheForwardingPlayersValues() {
    val increments = mutableListOf<Long>()
    val listener = object : Player.Listener {
      override fun onSeekBackIncrementChanged(seekBackIncrementMs: Long) {
        increments.add(seekBackIncrementMs)
      }

      override fun onSeekForwardIncrementChanged(seekForwardIncrementMs: Long) {
        increments.add(seekForwardIncrementMs)
      }
    }
    apply(setOf(RemoteCommandKind.SKIP_FORWARD), NowPlayingInfo(skipForwardInterval = 15.0, skipBackwardInterval = 5.0))
    val forwarding = MetadataForwardingListener(listener, player) { MediaMetadata.EMPTY }

    forwarding.onSeekBackIncrementChanged(30_000L)
    forwarding.onSeekForwardIncrementChanged(30_000L)

    assertEquals(listOf(5_000L, 15_000L), increments)
  }

  @Test
  fun injectsTheOwnersMetadata() {
    apply(setOf(RemoteCommandKind.PLAY), NowPlayingInfo(title = "Injected", artist = "Artist"))

    assertEquals("Injected", player.mediaMetadata.title)
    assertEquals("Artist", player.mediaMetadata.artist)
  }

  @Test
  fun transportCallsBecomeRemoteCommandsAndSkipThePlayer() {
    apply(
      setOf(
        RemoteCommandKind.PLAY,
        RemoteCommandKind.PAUSE,
        RemoteCommandKind.SEEK,
        RemoteCommandKind.SKIP_FORWARD,
        RemoteCommandKind.NEXT_TRACK,
        RemoteCommandKind.PREVIOUS_TRACK
      ),
      NowPlayingInfo(skipForwardInterval = 15.0)
    )
    underlyingCalls.clear()

    player.play()
    player.pause()
    player.seekTo(12_500)
    player.seekForward()
    player.seekToNext()
    player.seekToPreviousMediaItem()

    assertEquals(
      listOf(
        RemoteCommand(RemoteCommandKind.PLAY),
        RemoteCommand(RemoteCommandKind.PAUSE),
        RemoteCommand(RemoteCommandKind.SEEK, 12.5),
        RemoteCommand(RemoteCommandKind.SKIP_FORWARD, 15.0),
        RemoteCommand(RemoteCommandKind.NEXT_TRACK),
        RemoteCommand(RemoteCommandKind.PREVIOUS_TRACK)
      ),
      commands
    )
    assertTrue(underlyingCalls.none { it.startsWith("seek") || it == "play" || it == "pause" })
  }

  @Test
  fun playIsRequestedBeforeItsCommand() {
    apply(setOf(RemoteCommandKind.PLAY, RemoteCommandKind.PAUSE))

    player.pause()
    player.play()

    assertEquals(listOf(RemoteCommand(RemoteCommandKind.PAUSE), RemoteCommand(RemoteCommandKind.PLAY)), commands)
    assertEquals(listOf(1), commandsBeforePlayRequest)
  }

  @Test
  fun availableCommandsFollowTheOfferedKinds() {
    apply(setOf(RemoteCommandKind.TOGGLE_PLAY_PAUSE))

    assertTrue(player.isCommandAvailable(Player.COMMAND_PLAY_PAUSE))
    assertFalse(player.isCommandAvailable(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM))
    assertFalse(player.isCommandAvailable(Player.COMMAND_SEEK_TO_NEXT))
    assertFalse(player.isCommandAvailable(Player.COMMAND_STOP))
    assertTrue(player.isCommandAvailable(Player.COMMAND_GET_METADATA))
    assertEquals(10_000L, player.seekForwardIncrement)

    player.pause()
    assertTrue(commands.isEmpty())

    player.play()
    assertEquals(listOf(RemoteCommand(RemoteCommandKind.TOGGLE_PLAY_PAUSE)), commands)
  }

  private val androidBackedTypes = setOf(Player.Commands::class.java)

  private val Method.signature
    get() = name + parameterTypes.joinToString(prefix = "(", postfix = ")") { it.simpleName }

  private fun sample(type: Class<*>): Any? = when {
    type == Boolean::class.javaPrimitiveType -> false
    type == Int::class.javaPrimitiveType -> 0
    type == Long::class.javaPrimitiveType -> 0L
    type == Float::class.javaPrimitiveType -> 0f
    type == List::class.java -> emptyList<Any>()
    type == Player::class.java -> underlying
    type.isInterface -> Proxy.newProxyInstance(type.classLoader, arrayOf(type)) { _, _, _ -> null }
    Modifier.isAbstract(type.modifiers) -> type.fields.first { Modifier.isStatic(it.modifiers) && it.type == type }.get(null)
    else -> allocateWithoutConstructor(type)
  }
}

@Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
private class RecordingListener : Player.Listener {
  val received = mutableListOf<String>()

  private fun hit(signature: String) {
    received.add(signature)
  }

  override fun onEvents(player: Player, events: Player.Events) = hit("onEvents(Player, Events)")
  override fun onTimelineChanged(timeline: Timeline, reason: Int) = hit("onTimelineChanged(Timeline, int)")
  override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) = hit("onMediaItemTransition(MediaItem, int)")
  override fun onTracksChanged(tracks: Tracks) = hit("onTracksChanged(Tracks)")
  override fun onMediaMetadataChanged(mediaMetadata: MediaMetadata) = hit("onMediaMetadataChanged(MediaMetadata)")
  override fun onPlaylistMetadataChanged(mediaMetadata: MediaMetadata) = hit("onPlaylistMetadataChanged(MediaMetadata)")
  override fun onIsLoadingChanged(isLoading: Boolean) = hit("onIsLoadingChanged(boolean)")
  override fun onLoadingChanged(isLoading: Boolean) = hit("onLoadingChanged(boolean)")
  override fun onAvailableCommandsChanged(availableCommands: Player.Commands) = hit("onAvailableCommandsChanged(Commands)")
  override fun onTrackSelectionParametersChanged(parameters: TrackSelectionParameters) =
    hit("onTrackSelectionParametersChanged(TrackSelectionParameters)")
  override fun onPlayerStateChanged(playWhenReady: Boolean, playbackState: Int) = hit("onPlayerStateChanged(boolean, int)")
  override fun onPlaybackStateChanged(playbackState: Int) = hit("onPlaybackStateChanged(int)")
  override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) = hit("onPlayWhenReadyChanged(boolean, int)")
  override fun onPlaybackSuppressionReasonChanged(playbackSuppressionReason: Int) =
    hit("onPlaybackSuppressionReasonChanged(int)")
  override fun onIsPlayingChanged(isPlaying: Boolean) = hit("onIsPlayingChanged(boolean)")
  override fun onRepeatModeChanged(repeatMode: Int) = hit("onRepeatModeChanged(int)")
  override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) = hit("onShuffleModeEnabledChanged(boolean)")
  override fun onPlayerError(error: PlaybackException) = hit("onPlayerError(PlaybackException)")
  override fun onPlayerErrorChanged(error: PlaybackException?) = hit("onPlayerErrorChanged(PlaybackException)")
  override fun onPositionDiscontinuity(reason: Int) = hit("onPositionDiscontinuity(int)")
  override fun onPositionDiscontinuity(oldPosition: Player.PositionInfo, newPosition: Player.PositionInfo, reason: Int) =
    hit("onPositionDiscontinuity(PositionInfo, PositionInfo, int)")
  override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) =
    hit("onPlaybackParametersChanged(PlaybackParameters)")
  override fun onSeekBackIncrementChanged(seekBackIncrementMs: Long) = hit("onSeekBackIncrementChanged(long)")
  override fun onSeekForwardIncrementChanged(seekForwardIncrementMs: Long) = hit("onSeekForwardIncrementChanged(long)")
  override fun onMaxSeekToPreviousPositionChanged(maxSeekToPreviousPositionMs: Long) =
    hit("onMaxSeekToPreviousPositionChanged(long)")
  override fun onAudioSessionIdChanged(audioSessionId: Int) = hit("onAudioSessionIdChanged(int)")
  override fun onAudioAttributesChanged(audioAttributes: AudioAttributes) = hit("onAudioAttributesChanged(AudioAttributes)")
  override fun onVolumeChanged(volume: Float) = hit("onVolumeChanged(float)")
  override fun onSkipSilenceEnabledChanged(skipSilenceEnabled: Boolean) = hit("onSkipSilenceEnabledChanged(boolean)")
  override fun onDeviceInfoChanged(deviceInfo: DeviceInfo) = hit("onDeviceInfoChanged(DeviceInfo)")
  override fun onDeviceVolumeChanged(volume: Int, muted: Boolean) = hit("onDeviceVolumeChanged(int, boolean)")
  override fun onVideoSizeChanged(videoSize: VideoSize) = hit("onVideoSizeChanged(VideoSize)")
  override fun onSurfaceSizeChanged(width: Int, height: Int) = hit("onSurfaceSizeChanged(int, int)")
  override fun onRenderedFirstFrame() = hit("onRenderedFirstFrame()")
  override fun onCues(cues: List<Cue>) = hit("onCues(List)")
  override fun onCues(cueGroup: CueGroup) = hit("onCues(CueGroup)")
  override fun onMetadata(metadata: Metadata) = hit("onMetadata(Metadata)")
}
