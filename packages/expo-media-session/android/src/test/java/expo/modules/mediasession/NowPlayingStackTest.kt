package expo.modules.mediasession

import expo.modules.mediasession.FakeNowPlayingOwner.Event
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.Test

class NowPlayingStackTest {
  private val center = FakeNowPlayingCenter()
  private var mode = InterruptionMode.DO_NOT_MIX
  private val ownerChanges = mutableListOf<String?>()
  private val stack = NowPlayingStack(center, { mode }, { ownerChanges.add(it) })
  private val playback = setOf(RemoteCommandKind.PLAY, RemoteCommandKind.PAUSE, RemoteCommandKind.TOGGLE_PLAY_PAUSE)

  @Test
  fun videoTakesOverAndPodcastReturnsResumed() {
    val podcast = FakeNowPlayingOwner("podcast")
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    stack.offer(podcast, NowPlayingInfo(title = "Podcast"), playback)
    val videoClaim = stack.offer(video, NowPlayingInfo(title = "Video"), setOf(RemoteCommandKind.PLAY))

    assertEquals(listOf(Event.PausedForTakeover), podcast.events)
    assertEquals("Video", center.state?.info?.title)
    assertEquals(setOf(RemoteCommandKind.PLAY), center.targets)

    stack.withdraw(videoClaim, WithdrawReason.ENDED)

    assertEquals(listOf(Event.PausedForTakeover, Event.ResumedAfterTakeover), podcast.events)
    assertEquals("Podcast", center.state?.info?.title)
    assertEquals(playback, center.targets)
    assertEquals("podcast", stack.ownerId)
  }

  @Test
  fun throwingPreviousOwnerDoesNotBlockTakeover() {
    val podcast = object : NowPlayingOwner by FakeNowPlayingOwner("podcast") {
      override fun pauseForTakeover() = throw IllegalStateException("The player was released")
    }
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    stack.offer(podcast, NowPlayingInfo(title = "Podcast"), playback)

    stack.offer(video, NowPlayingInfo(title = "Video"), playback)

    assertEquals("video", stack.ownerId)
    assertEquals("Video", center.state?.info?.title)
  }

  @Test
  fun userPausedOwnerReturnsPaused() {
    val podcast = FakeNowPlayingOwner("podcast", isPlaying = false)
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    stack.offer(podcast, NowPlayingInfo(title = "Podcast"), playback)
    stack.withdraw(stack.offer(video, NowPlayingInfo(title = "Video"), playback), WithdrawReason.ENDED)

    assertEquals("podcast", stack.ownerId)
    assertTrue(podcast.events.isEmpty())
    assertEquals(false, center.state?.isPlaying)
  }

  @Test
  fun ownerStillPlayingWhenItReturnsIsResumed() {
    val events = mutableListOf<String>()
    val podcast = object : NowPlayingOwner by FakeNowPlayingOwner("podcast") {
      override fun pauseForTakeover() {
        events.add("pause")
      }

      override fun resumeAfterTakeover() {
        events.add("resume")
      }
    }
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    stack.offer(podcast, NowPlayingInfo(title = "Podcast"), playback)

    stack.withdraw(stack.offer(video, NowPlayingInfo(title = "Video"), playback), WithdrawReason.ENDED)

    assertEquals(listOf("pause", "resume"), events)
  }

  @Test
  fun ownerPlayedAndPausedByUserDuringTakeoverReturnsPaused() {
    val podcast = FakeNowPlayingOwner("podcast")
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    val info = NowPlayingInfo(title = "Podcast")
    val podcastClaim = stack.offer(podcast, info, playback)
    val videoClaim = stack.offer(video, NowPlayingInfo(title = "Video"), playback)
    stack.update(podcastClaim, info)

    podcast.isPlaying = true
    stack.update(podcastClaim, info)
    podcast.isPlaying = false
    stack.update(podcastClaim, info)
    stack.withdraw(videoClaim, WithdrawReason.ENDED)

    assertEquals(listOf(Event.PausedForTakeover), podcast.events)
    assertEquals(false, center.state?.isPlaying)
  }

  @Test
  fun pauseKeepsOwnership() {
    val podcast = FakeNowPlayingOwner("podcast")
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    stack.offer(podcast, NowPlayingInfo(title = "Podcast"), playback)
    val videoClaim = stack.offer(video, NowPlayingInfo(title = "Video"), playback)

    video.isPlaying = false
    stack.update(videoClaim, NowPlayingInfo(title = "Video", elapsedTime = 12.0))

    assertEquals("video", stack.ownerId)
    assertEquals("Video", center.state?.info?.title)
    assertEquals(false, center.state?.isPlaying)
    assertEquals(listOf(Event.PausedForTakeover), podcast.events)
  }

  @Test
  fun releasedOwnerBelowTopIsSkipped() {
    val a = FakeNowPlayingOwner("a")
    val b = FakeNowPlayingOwner("b")
    val c = FakeNowPlayingOwner("c")
    stack.offer(a, NowPlayingInfo(title = "A"), playback)
    val bClaim = stack.offer(b, NowPlayingInfo(title = "B"), playback)
    val cClaim = stack.offer(c, NowPlayingInfo(title = "C"), playback)

    stack.withdraw(bClaim, WithdrawReason.RELEASED)
    stack.withdraw(cClaim, WithdrawReason.ENDED)

    assertEquals("a", stack.ownerId)
    assertEquals("A", center.state?.info?.title)
    assertEquals(listOf(Event.PausedForTakeover, Event.ResumedAfterTakeover), a.events)
    assertEquals(listOf(Event.PausedForTakeover), b.events)
  }

  @Test
  fun mixWithOthersDoesNotPausePrevious() {
    mode = InterruptionMode.MIX_WITH_OTHERS
    val podcast = FakeNowPlayingOwner("podcast")
    val video = FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO)
    stack.offer(podcast, NowPlayingInfo(title = "Podcast"), playback)
    val videoClaim = stack.offer(video, NowPlayingInfo(title = "Video"), playback)

    assertEquals("video", stack.ownerId)
    assertTrue(podcast.events.isEmpty())
    assertTrue(podcast.isPlaying)

    stack.withdraw(videoClaim, WithdrawReason.ENDED)
    assertTrue(podcast.events.isEmpty())
  }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun mixingFollowsLiveUsesAndPolicyWithoutHold() {
    val scheduler = TestCoroutineScheduler()
    val manager = MediaSessionManager(FakeSessionBackend(), StandardTestDispatcher(scheduler))
    manager.coordinator.log = {}
    val stack = NowPlayingStack(center, { manager.coordinator.effectiveInterruptionMode })
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.MIX_WITH_OTHERS))
    val strict = manager.beginUse("strict", SessionRequirements(mixing = MixingRequirement.DO_NOT_MIX))
    scheduler.runCurrent()

    val a = FakeNowPlayingOwner("a")
    stack.offer(a, NowPlayingInfo(title = "A"), playback)
    stack.offer(FakeNowPlayingOwner("b"), NowPlayingInfo(title = "B"), playback)
    assertEquals(listOf(Event.PausedForTakeover), a.events)

    strict.end()
    scheduler.advanceTimeBy(1000)
    scheduler.runCurrent()
    val c = FakeNowPlayingOwner("c")
    stack.offer(c, NowPlayingInfo(title = "C"), playback)
    stack.offer(FakeNowPlayingOwner("d"), NowPlayingInfo(title = "D"), playback)

    assertTrue(c.events.isEmpty())
    manager.coordinator.close()
  }

  @Test
  fun identicalTopUpdatesEachWrite() {
    val info = NowPlayingInfo(title = "Podcast", elapsedTime = 3.0)
    val claim = stack.offer(FakeNowPlayingOwner("podcast"), info, playback)
    val writes = center.applied.size

    stack.update(claim, info)
    stack.update(claim, info)

    assertEquals(writes + 2, center.applied.size)
  }

  @Test
  fun commandRoutesOnlyToTop() {
    val owners = listOf("a", "b", "c").map { FakeNowPlayingOwner(it) }
    owners.forEach { stack.offer(it, NowPlayingInfo(title = it.nowPlayingId), playback) }

    stack.handle(RemoteCommand(RemoteCommandKind.TOGGLE_PLAY_PAUSE))

    assertEquals(listOf(0, 0, 1), owners.map { it.handledCount })
  }

  @Test
  fun offerSameOwnerTwiceMovesToTop() {
    val a = FakeNowPlayingOwner("a")
    val b = FakeNowPlayingOwner("b")
    val firstAClaim = stack.offer(a, NowPlayingInfo(title = "A1"), playback)
    val bClaim = stack.offer(b, NowPlayingInfo(title = "B"), playback)
    a.isPlaying = true
    val secondAClaim = stack.offer(a, NowPlayingInfo(title = "A2"), playback)

    assertEquals("a", stack.ownerId)
    assertEquals("A2", center.state?.info?.title)
    stack.handle(RemoteCommand(RemoteCommandKind.PAUSE))
    assertEquals(1, a.handledCount)
    assertEquals(0, b.handledCount)

    stack.withdraw(firstAClaim, WithdrawReason.ENDED)
    assertEquals("a", stack.ownerId)

    stack.withdraw(secondAClaim, WithdrawReason.ENDED)
    assertEquals("b", stack.ownerId)
    assertEquals(listOf(Event.PausedForTakeover, Event.ResumedAfterTakeover), b.events)

    stack.withdraw(bClaim, WithdrawReason.ENDED)
    assertNull(stack.ownerId)
    assertNull(center.state)
  }

  @Test
  fun emptyStackClearsCenter() {
    val claim = stack.offer(FakeNowPlayingOwner("podcast"), NowPlayingInfo(title = "Podcast"), playback)
    assertEquals(playback, center.targets)

    stack.withdraw(claim, WithdrawReason.ENDED)

    assertEquals(2, center.applied.size)
    assertNull(center.applied.last())
    assertTrue(center.targets.isEmpty())
    assertNull(stack.ownerId)
  }

  @Test
  fun updateFromNonTopDoesNotTouchCenter() {
    val aClaim = stack.offer(
      FakeNowPlayingOwner("a", isPlaying = false),
      NowPlayingInfo(title = "A", artist = "Artist"),
      playback
    )
    val bClaim = stack.offer(FakeNowPlayingOwner("b"), NowPlayingInfo(title = "B"), playback)
    val writes = center.applied.size

    stack.update(aClaim, NowPlayingInfo(title = "A2"))

    assertEquals(writes, center.applied.size)
    assertEquals("B", center.state?.info?.title)

    stack.withdraw(bClaim, WithdrawReason.ENDED)
    assertEquals(NowPlayingInfo(title = "A2"), center.state?.info)
  }

  @Test
  fun mediaTypeFollowsTop() {
    stack.offer(FakeNowPlayingOwner("podcast"), NowPlayingInfo(title = "Podcast"), playback)
    val videoClaim = stack.offer(
      FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO),
      NowPlayingInfo(title = "Video"),
      playback
    )

    assertEquals(NowPlayingMediaType.VIDEO, center.state?.mediaType)

    stack.withdraw(videoClaim, WithdrawReason.ENDED)
    assertEquals(NowPlayingMediaType.AUDIO, center.state?.mediaType)
  }

  @Test
  fun ownerChangeIsReported() {
    val podcastClaim = stack.offer(FakeNowPlayingOwner("podcast"), NowPlayingInfo(), playback)
    val videoClaim = stack.offer(FakeNowPlayingOwner("video", NowPlayingMediaType.VIDEO), NowPlayingInfo(), playback)
    stack.update(videoClaim, NowPlayingInfo(title = "Video"))
    stack.withdraw(videoClaim, WithdrawReason.ENDED)
    stack.withdraw(podcastClaim, WithdrawReason.RELEASED)

    assertEquals(listOf("podcast", "video", "podcast", null), ownerChanges)
  }

  @Test
  fun liveStreamHidesSeek() {
    stack.offer(
      FakeNowPlayingOwner("radio"),
      NowPlayingInfo(isLiveStream = true),
      setOf(RemoteCommandKind.PLAY, RemoteCommandKind.SEEK)
    )

    assertFalse(RemoteCommandKind.SEEK in center.targets)
    assertEquals(setOf(RemoteCommandKind.PLAY), center.targets)
  }
}
