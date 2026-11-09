package expo.modules.mediasession

import expo.modules.mediasession.FakeNowPlayingOwner.Event
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class NowPlayingClaimTest {
  private val scheduler = TestCoroutineScheduler()
  private val center = FakeNowPlayingCenter()
  private var offCoordinatorCalls = 0
  private var inTask = false
  private val dispatcher = StandardTestDispatcher(scheduler)
  private val manager = MediaSessionManager(
    FakeSessionBackend(),
    dispatcher,
    center,
    checkThread = {
      if (!inTask) {
        offCoordinatorCalls += 1
      }
    }
  ).apply { coordinator.log = {} }
  private val observer = RecordingObserver()
  private val playback = setOf(RemoteCommandKind.PLAY, RemoteCommandKind.PAUSE)

  init {
    manager.addObserver(observer)
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
    run()
  }

  @After
  fun tearDown() {
    manager.close()
    run()
  }

  private fun run() {
    inTask = true
    scheduler.runCurrent()
    inTask = false
  }

  @Test
  fun offerHopsToTheCoordinatorThread() {
    val claim = manager.offerNowPlaying(FakeNowPlayingOwner("podcast"), NowPlayingInfo(title = "Podcast"), playback)
    claim.update(NowPlayingInfo(title = "Podcast", elapsedTime = 3.0))

    assertTrue(center.applied.isEmpty())
    assertNull(manager.nowPlayingOwnerId)

    run()

    assertEquals(NowPlayingInfo(title = "Podcast", elapsedTime = 3.0), center.state?.info)
    assertEquals("podcast", manager.nowPlayingOwnerId)
    assertEquals(0, offCoordinatorCalls)
  }

  @Test
  fun closeWithdrawsAsReleasedOnce() {
    val podcast = FakeNowPlayingOwner("podcast")
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    manager.offerNowPlaying(podcast, NowPlayingInfo(title = "Podcast"), playback)
    val videoClaim = manager.offerNowPlaying(video, NowPlayingInfo(title = "Video"), playback)
    run()

    videoClaim.close()
    videoClaim.close()
    videoClaim.withdraw(WithdrawReason.ENDED)
    videoClaim.update(NowPlayingInfo(title = "Stale"))
    run()

    assertEquals("podcast", manager.nowPlayingOwnerId)
    assertEquals("Podcast", center.state?.info?.title)
    assertEquals(listOf(Event.PausedForTakeover, Event.ResumedAfterTakeover), podcast.events)
  }

  @Test
  fun ownerChangesReachObservers() {
    val claim = manager.offerNowPlaying(FakeNowPlayingOwner("podcast"), NowPlayingInfo(), playback)
    run()
    claim.withdraw(WithdrawReason.ENDED)
    run()

    assertEquals(
      listOf(RecordingObserver.Event.NowPlayingOwnerChanged("podcast"), RecordingObserver.Event.NowPlayingOwnerChanged(null)),
      observer.events.filterIsInstance<RecordingObserver.Event.NowPlayingOwnerChanged>()
    )
  }

  @Test
  fun droppedClaimIsPruned() {
    val claim = manager.offerNowPlaying(FakeNowPlayingOwner("podcast"), NowPlayingInfo(title = "Podcast"), playback)
    run()

    manager.clearNowPlayingClaimReference(claim)
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
    run()

    assertNull(manager.nowPlayingOwnerId)
    assertNull(center.state)
    assertEquals(RecordingObserver.Event.NowPlayingOwnerChanged(null), observer.events.last())
  }

  @Test
  fun garbageCollectedClaimWithdrawsItself() {
    val podcast = FakeNowPlayingOwner("podcast")
    offerAndDrop(podcast)
    run()
    assertEquals("podcast", manager.nowPlayingOwnerId)

    repeat(50) {
      if (manager.nowPlayingOwnerId != null) {
        System.gc()
        System.runFinalization()
        Thread.sleep(10)
        run()
      }
    }

    assertNull(manager.nowPlayingOwnerId)
    assertNull(center.state)
    assertTrue(podcast.events.isEmpty())
  }

  private fun offerAndDrop(owner: NowPlayingOwner) {
    manager.offerNowPlaying(owner, NowPlayingInfo(title = "Podcast"), playback)
  }

  @Test
  fun remoteCommandReachesTopOwnerOnTheCoordinatorThread() {
    val podcast = FakeNowPlayingOwner("podcast")
    manager.offerNowPlaying(podcast, NowPlayingInfo(), playback)
    run()

    center.send(RemoteCommand(RemoteCommandKind.PAUSE))
    assertEquals(0, podcast.handledCount)

    run()
    assertEquals(listOf(Event.Handled(RemoteCommand(RemoteCommandKind.PAUSE))), podcast.events)
    assertEquals(0, offCoordinatorCalls)
  }

  @Test
  fun centerFailureIsReportedForTheTopOwner() {
    manager.offerNowPlaying(FakeNowPlayingOwner("podcast"), NowPlayingInfo(), playback)
    run()

    center.fail(MediaSessionException("The notification could not start"))
    run()

    assertEquals(RecordingObserver.Event.Failed("podcast"), observer.events.last())
    assertEquals("The notification could not start", observer.error?.message)
  }
}
