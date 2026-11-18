package expo.modules.mediasession.service

import expo.modules.kotlin.exception.CodedException
import expo.modules.mediasession.FakeNowPlayingOwner
import expo.modules.mediasession.FakeSessionBackend
import expo.modules.mediasession.MediaSessionManager
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.NowPlayingInfo
import expo.modules.mediasession.NowPlayingOwner
import expo.modules.mediasession.RecordingObserver
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind
import expo.modules.mediasession.WithdrawReason
import expo.modules.mediasession.service.MediaPlaybackServiceLogic.Companion.NOTIFICATION_ID
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

class MediaPlaybackServiceLogicTest {
  private val host = FakeServiceHost()
  private val sessions = FakeSessionFactory()
  private val failures = mutableListOf<CodedException>()
  private val logic = MediaPlaybackServiceLogic(sessions, host) { failures.add(it) }
  private val playback = setOf(RemoteCommandKind.PLAY, RemoteCommandKind.PAUSE)

  private fun state(owner: NowPlayingOwner, title: String = owner.nowPlayingId, isPlaying: Boolean = true) =
    NowPlayingCenterState(NowPlayingInfo(title = title), owner.mediaType, isPlaying, playback, owner)

  private fun connectedWith(owner: NowPlayingOwner, isPlaying: Boolean = true) {
    logic.apply(state(owner, isPlaying = isPlaying))
    logic.onServiceConnected()
  }

  @Test
  fun stackEmpty_stopsService() {
    connectedWith(FakeNowPlayingOwner("podcast"))
    host.take()

    logic.apply(null)

    assertEquals(
      listOf("stopForeground(remove)", "cancel($NOTIFICATION_ID)", "stopSelf", "unbind"),
      host.take()
    )
    assertTrue(sessions.created.single().released)
    assertNull(logic.session)
    assertFalse(logic.isForeground)
  }

  @Test
  fun topPlaying_requestsForeground() {
    logic.apply(state(FakeNowPlayingOwner("podcast")))
    assertEquals(listOf("bind"), host.take())

    logic.onServiceConnected()

    assertEquals(listOf("startForeground($NOTIFICATION_ID)"), host.take())
    assertTrue(logic.isForeground)
  }

  @Test
  fun foregroundNotAllowed_playingPostsNotificationOnly() {
    host.isForegroundAllowed = false
    logic.apply(state(FakeNowPlayingOwner("podcast")))
    host.take()

    logic.onServiceConnected()
    logic.onPlaybackChanged(startInForegroundRequired = true)

    assertEquals(listOf("notify($NOTIFICATION_ID)", "notify($NOTIFICATION_ID)"), host.take())
    assertFalse(logic.isForeground)
    assertTrue(failures.isEmpty())
  }

  @Test
  fun topPaused_staysForegroundUntilTheSessionDropsIt() {
    val podcast = FakeNowPlayingOwner("podcast")
    connectedWith(podcast)
    host.take()

    logic.apply(state(podcast, isPlaying = false))
    logic.onPlaybackChanged(startInForegroundRequired = true)

    assertEquals(listOf("notify($NOTIFICATION_ID)", "notify($NOTIFICATION_ID)"), host.take())
    assertTrue(logic.isForeground)

    logic.onPlaybackChanged(startInForegroundRequired = false)

    assertEquals(listOf("stopForeground(keep)", "notify($NOTIFICATION_ID)"), host.take())
    assertFalse(logic.isForeground)

    logic.apply(state(podcast, isPlaying = false, title = "Next"))
    assertEquals(listOf("notify($NOTIFICATION_ID)"), host.take())

    logic.apply(state(podcast, isPlaying = true))
    assertEquals(listOf("startForeground($NOTIFICATION_ID)"), host.take())
  }

  @Test
  fun ownerSwitch_reusesSingleSession() {
    val podcast = FakeNowPlayingOwner("podcast")
    val video = FakeMediaPlayerOwner("video")
    connectedWith(podcast)

    logic.apply(state(video))
    logic.apply(state(podcast))
    logic.apply(state(video, title = "Video 2"))

    val session = sessions.created.single()
    assertEquals(MediaPlaybackServiceLogic.SESSION_ID, session.id)
    assertEquals(
      listOf("info0", "forwarding(video)", "info0", "forwarding(video)"),
      session.players.map { it.toString() }
    )
    assertEquals(1, host.calls.count { it == "bind" })
    val (first, second) = sessions.forwardingPlayers
    assertTrue(first.released)
    assertFalse(second.released)
    assertEquals(listOf("Video 2"), second.applied.map { it.info.title })
  }

  @Test
  fun mediaPlayerOwnerForeground_followsItsPlayer() {
    val video = FakeMediaPlayerOwner("video")
    connectedWith(video)
    val player = sessions.forwardingPlayers.single()
    assertEquals(listOf("bind", "notify($NOTIFICATION_ID)"), host.take())

    player.isPlaybackOngoing = true
    logic.onPlaybackChanged()
    assertEquals(listOf("startForeground($NOTIFICATION_ID)"), host.take())

    player.isPlaybackOngoing = false
    logic.onPlaybackChanged(startInForegroundRequired = false)
    assertEquals(listOf("stopForeground(keep)", "notify($NOTIFICATION_ID)"), host.take())
  }

  @Test
  fun mediaPlayerOwnerOnAnotherLooper_fallsBackToInfo() {
    sessions.forwardingSupported = false
    connectedWith(FakeMediaPlayerOwner("video"))

    assertEquals(listOf("info0"), sessions.created.single().players.map { it.toString() })
    assertTrue(logic.isForeground)
  }

  @Test
  fun startForegroundNotAllowed_reportsAndDoesNotCrash() {
    host.startForegroundError = foregroundServiceStartNotAllowed()
    val podcast = FakeNowPlayingOwner("podcast")

    connectedWith(podcast)

    assertEquals(1, failures.size)
    assertTrue(failures.single().message!!.contains("Start playback while the app is visible"))
    assertFalse(logic.isForeground)
    assertEquals(listOf("bind", "startForeground($NOTIFICATION_ID)", "notify($NOTIFICATION_ID)"), host.take())

    logic.apply(state(podcast, isPlaying = false))
    assertEquals(listOf("notify($NOTIFICATION_ID)"), host.take())

    logic.apply(null)
    assertEquals(listOf("stopForeground(remove)", "cancel($NOTIFICATION_ID)", "stopSelf", "unbind"), host.take())
  }

  @Test
  fun startForegroundRefused_reportsOncePerPlayback() {
    host.startForegroundError = foregroundServiceStartNotAllowed()
    val podcast = FakeNowPlayingOwner("podcast")
    connectedWith(podcast)

    logic.apply(state(podcast, title = "Again"))
    logic.onPlaybackChanged(startInForegroundRequired = true)

    assertEquals(1, failures.size)
    assertEquals(3, host.take().count { it == "startForeground($NOTIFICATION_ID)" })

    logic.apply(state(podcast, isPlaying = false))
    logic.onPlaybackChanged(startInForegroundRequired = true)
    assertEquals(1, failures.size)

    logic.apply(state(podcast))
    assertEquals(2, failures.size)
  }

  @Test
  fun serviceNotDeclared_reportsAndKeepsSession() {
    host.bindResult = false

    logic.apply(state(FakeNowPlayingOwner("podcast")))
    logic.apply(state(FakeNowPlayingOwner("podcast"), title = "Again"))

    assertEquals(1, failures.size)
    assertTrue(failures.single().message!!.contains("AndroidManifest.xml"))
    assertEquals(listOf("bind"), host.take())
    assertEquals(1, sessions.created.size)

    logic.apply(null)
    assertEquals(listOf("cancel($NOTIFICATION_ID)"), host.take())
  }

  @Test
  fun cancelsOnlyOwnNotification() {
    val podcast = FakeNowPlayingOwner("podcast")
    connectedWith(podcast)
    logic.apply(state(podcast, isPlaying = false))
    logic.apply(state(FakeMediaPlayerOwner("video")))
    logic.apply(state(podcast))
    logic.onServiceConnected()
    logic.apply(null)

    assertTrue(host.cancelled.isNotEmpty())
    assertEquals(setOf(NOTIFICATION_ID), host.cancelled.toSet())
  }

  @Test
  fun startForegroundMissingPermission_namesTheConfigPlugin() {
    host.startForegroundError = SecurityException("Starting FGS with type mediaPlayback requires permissions")

    connectedWith(FakeNowPlayingOwner("podcast"))

    val message = failures.single().message!!
    assertTrue(message.contains("FOREGROUND_SERVICE_MEDIA_PLAYBACK"))
    assertTrue(message.contains("expo-media-session config plugin"))
    assertFalse(message.endsWith("."))
  }

  @Test
  fun startForegroundWithoutService_staysInBackground() {
    host.startForegroundResult = false

    connectedWith(FakeNowPlayingOwner("podcast"))

    assertFalse(logic.isForeground)
  }

  @Test
  fun startInForegroundRequired_startsForegroundWhilePaused() {
    connectedWith(FakeMediaPlayerOwner("video"))
    host.take()

    logic.onPlaybackChanged(startInForegroundRequired = true)
    assertEquals(listOf("startForeground($NOTIFICATION_ID)"), host.take())
    assertTrue(logic.isForeground)

    logic.onPlaybackChanged(startInForegroundRequired = false)
    assertEquals(listOf("stopForeground(keep)", "notify($NOTIFICATION_ID)"), host.take())
  }

  @Test
  fun playRequest_keepsForegroundUntilItExpires() {
    connectedWith(FakeNowPlayingOwner("podcast"), isPlaying = false)
    host.take()

    logic.onPlayRequested()
    assertEquals(listOf("startForeground($NOTIFICATION_ID)", "schedulePlayRequestTimeout"), host.take())

    logic.onPlaybackChanged(startInForegroundRequired = false)
    assertEquals(listOf("notify($NOTIFICATION_ID)"), host.take())
    assertTrue(logic.isForeground)

    logic.onPlayRequestExpired()
    logic.onPlaybackChanged(startInForegroundRequired = false)
    assertEquals(listOf("stopForeground(keep)", "notify($NOTIFICATION_ID)"), host.take())
  }

  @Test
  fun infoOnlyOwner_drivesSessionAndRoutesCommands() {
    val scheduler = TestCoroutineScheduler()
    val center = NowPlayingSessionCenter(post = { it() })
    val factory = FakeSessionFactory { center.send(it) }
    center.logic = MediaPlaybackServiceLogic(factory, host) { center.fail(it) }
    val manager = MediaSessionManager(FakeSessionBackend(), StandardTestDispatcher(scheduler), center)
    manager.coordinator.log = {}
    val observer = RecordingObserver()
    manager.addObserver(observer)
    val owner = FakeNowPlayingOwner("engine", isPlaying = false)

    val claim = manager.offerNowPlaying(owner, NowPlayingInfo(title = "Level 1", elapsedTime = 4.0), playback)
    scheduler.runCurrent()
    center.logic.onServiceConnected()

    val player = factory.infoPlayers.single()
    assertSame(player, factory.created.single().players.single())
    assertEquals("Level 1", player.applied.last().info.title)
    assertFalse(player.isPlaybackOngoing)

    factory.sendFromSession(playWhenReadyCommand(true, playback, isPlaying = false)!!)
    assertTrue(owner.events.isEmpty())
    scheduler.runCurrent()
    assertEquals(listOf(FakeNowPlayingOwner.Event.Handled(RemoteCommand(RemoteCommandKind.PLAY))), owner.events)

    claim.update(NowPlayingInfo(title = "Level 1", elapsedTime = 5.0))
    scheduler.runCurrent()
    assertTrue(player.isPlaybackOngoing)
    assertEquals(5.0, player.applied.last().info.elapsedTime)
    assertTrue(center.logic.isForeground)

    claim.withdraw(WithdrawReason.ENDED)
    scheduler.runCurrent()
    assertNull(center.logic.session)
    manager.coordinator.close()
    scheduler.runCurrent()
  }

  @Test
  fun applyFailure_reportsAndDoesNotCrash() {
    val center = NowPlayingSessionCenter(post = { it() })
    center.setFailureHandler { failures.add(it) }
    center.logic = MediaPlaybackServiceLogic(sessions, host) { center.fail(it) }
    val podcast = FakeNowPlayingOwner("podcast")
    center.apply(state(podcast))
    sessions.infoPlayers.single().applyError = IllegalArgumentException("speed must be positive")

    center.apply(state(podcast, title = "Again"))

    val message = failures.single().message!!
    assertTrue(message.contains("speed must be positive"))
    assertFalse(message.endsWith("."))
  }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun startForegroundFailureReachesObservers() {
    val scheduler = TestCoroutineScheduler()
    val center = NowPlayingSessionCenter(post = { it() })
    center.logic = MediaPlaybackServiceLogic(FakeSessionFactory(), host) { center.fail(it) }
    val manager = MediaSessionManager(FakeSessionBackend(), StandardTestDispatcher(scheduler), center)
    manager.coordinator.log = {}
    val observer = RecordingObserver()
    manager.addObserver(observer)
    host.startForegroundError = IllegalStateException("not allowed")

    manager.offerNowPlaying(FakeNowPlayingOwner("podcast"), NowPlayingInfo(), playback)
    scheduler.runCurrent()
    center.logic.onServiceConnected()
    scheduler.runCurrent()

    assertEquals(RecordingObserver.Event.Failed("podcast"), observer.events.last())
    assertEquals("podcast", manager.nowPlayingOwnerId)
    manager.coordinator.close()
    scheduler.runCurrent()
  }
}
