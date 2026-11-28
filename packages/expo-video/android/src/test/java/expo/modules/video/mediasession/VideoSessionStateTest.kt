package expo.modules.video.mediasession

import android.media.AudioAttributes
import expo.modules.mediasession.MixingRequirement
import expo.modules.mediasession.SessionRequirements
import expo.modules.video.enums.AudioMixingMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class VideoSessionStateTest {
  private fun requirements(mixing: MixingRequirement, pausesWhenDucked: Boolean = false) = SessionRequirements(
    mixing = mixing,
    usage = AudioAttributes.USAGE_MEDIA,
    contentType = AudioAttributes.CONTENT_TYPE_MOVIE,
    pausesWhenDucked = pausesWhenDucked
  )

  // Mixing

  @Test
  fun `mixWithOthers always mixes`() {
    val state = VideoSessionState(isPlaying = true, audioMixingMode = AudioMixingMode.MIX_WITH_OTHERS)

    assertEquals(MixingRequirement.MIX_WITH_OTHERS, state.mixing)
  }

  @Test
  fun `duckOthers ducks only while audible`() {
    val audible = VideoSessionState(isPlaying = true, audioMixingMode = AudioMixingMode.DUCK_OTHERS)
    val muted = audible.copy(isMuted = true)
    val paused = audible.copy(isPlaying = false)

    assertEquals(MixingRequirement.DUCK_OTHERS, audible.mixing)
    assertEquals(MixingRequirement.MIX_WITH_OTHERS, muted.mixing)
    assertEquals(MixingRequirement.MIX_WITH_OTHERS, paused.mixing)
  }

  @Test
  fun `auto does not mix while audible`() {
    val state = VideoSessionState(isPlaying = true)

    assertEquals(MixingRequirement.DO_NOT_MIX, state.mixing)
  }

  @Test
  fun `auto mixes while muted`() {
    val state = VideoSessionState(isPlaying = true, isMuted = true)

    assertEquals(MixingRequirement.MIX_WITH_OTHERS, state.mixing)
  }

  @Test
  fun `auto mixes at zero volume`() {
    val state = VideoSessionState(isPlaying = true, volume = 0f)

    assertEquals(MixingRequirement.MIX_WITH_OTHERS, state.mixing)
  }

  @Test
  fun `auto ignores the now playing notification`() {
    val state = VideoSessionState(isPlaying = true, isMuted = true, showNowPlayingNotification = true)

    assertEquals(MixingRequirement.MIX_WITH_OTHERS, state.mixing)
  }

  @Test
  fun `doNotMix never mixes`() {
    val state = VideoSessionState(isMuted = true, audioMixingMode = AudioMixingMode.DO_NOT_MIX)

    assertEquals(MixingRequirement.DO_NOT_MIX, state.mixing)
  }

  @Test
  fun `requirements describe movie playback`() {
    val requirements = VideoSessionState(isPlaying = true).requirements

    assertEquals(AudioAttributes.USAGE_MEDIA, requirements.usage)
    assertEquals(AudioAttributes.CONTENT_TYPE_MOVIE, requirements.contentType)
  }

  @Test
  fun `only doNotMix pauses when ducked`() {
    val doNotMix = VideoSessionState(audioMixingMode = AudioMixingMode.DO_NOT_MIX)
    val auto = VideoSessionState(audioMixingMode = AudioMixingMode.AUTO)

    assertTrue(doNotMix.requirements.pausesWhenDucked)
    assertFalse(auto.requirements.pausesWhenDucked)
  }

  // Use and claim

  @Test
  fun `a use is wanted only while playing`() {
    assertTrue(VideoSessionState(isPlaying = true).wantsUse)
    assertFalse(VideoSessionState(showNowPlayingNotification = true, hasSource = true, isAttachedToView = true).wantsUse)
  }

  @Test
  fun `now playing needs the flag, a source and a view`() {
    val wanted = VideoSessionState(showNowPlayingNotification = true, hasSource = true, isAttachedToView = true)

    assertTrue(wanted.wantsNowPlaying)
    assertFalse(wanted.copy(showNowPlayingNotification = false).wantsNowPlaying)
    assertFalse(wanted.copy(hasSource = false).wantsNowPlaying)
    assertFalse(wanted.copy(isAttachedToView = false).wantsNowPlaying)
  }

  // Manual audio session

  @Test
  fun `a player that does not manage the audio session wants no use`() {
    val state = VideoSessionState(isPlaying = true, manageAudioSession = false)

    assertFalse(state.wantsUse)
    assertEquals(
      SessionUseAction.End,
      sessionUseAction(isUseLive = true, isUseStale = false, applied = state.requirements, state = state)
    )
  }

  @Test
  fun `an audio mixing mode conflicts with a manual session`() {
    val manual = VideoSessionState(manageAudioSession = false, audioMixingMode = AudioMixingMode.DO_NOT_MIX)

    assertEquals(listOf(VideoSessionConflict.AUDIO_MIXING_MODE_IGNORED), sessionConflicts(manual))
    assertEquals(emptyList<VideoSessionConflict>(), sessionConflicts(manual.copy(audioMixingMode = AudioMixingMode.AUTO)))
    assertEquals(emptyList<VideoSessionConflict>(), sessionConflicts(manual.copy(manageAudioSession = true)))
  }

  @Test
  fun `reports one time when a manual player and a managed player are in use together`() {
    val mix = SessionManagementMix<Int>()
    val manual = VideoSessionState(manageAudioSession = false)
    val managedInUse = VideoSessionState(isPlaying = true)

    assertFalse(mix.shouldWarnAfterUpdating(1, manual))
    assertFalse(mix.shouldWarnAfterUpdating(2, VideoSessionState()))
    assertTrue(mix.shouldWarnAfterUpdating(2, managedInUse))
    assertFalse(mix.shouldWarnAfterUpdating(2, managedInUse))
  }

  @Test
  fun `does not report again when the managed player pauses and plays`() {
    val mix = SessionManagementMix<Int>()
    val managedInUse = VideoSessionState(isPlaying = true)

    mix.shouldWarnAfterUpdating(1, VideoSessionState(manageAudioSession = false))
    mix.shouldWarnAfterUpdating(2, managedInUse)

    assertFalse(mix.shouldWarnAfterUpdating(2, managedInUse.copy(isPlaying = false)))
    assertFalse(mix.shouldWarnAfterUpdating(2, managedInUse))
  }

  @Test
  fun `reports again after all the manual players are released`() {
    val mix = SessionManagementMix<Int>()
    val manual = VideoSessionState(manageAudioSession = false)

    mix.shouldWarnAfterUpdating(1, manual)
    mix.shouldWarnAfterUpdating(2, VideoSessionState(isPlaying = true))

    mix.remove(1)

    assertTrue(mix.shouldWarnAfterUpdating(3, manual))
  }

  @Test
  fun `a managed player that wants the Now Playing notification counts as in use`() {
    val mix = SessionManagementMix<Int>()
    val managedOwner = VideoSessionState(showNowPlayingNotification = true, hasSource = true, isAttachedToView = true)

    assertFalse(mix.shouldWarnAfterUpdating(1, managedOwner))
    assertTrue(mix.shouldWarnAfterUpdating(2, VideoSessionState(manageAudioSession = false)))
  }

  // Takeover

  @Test
  fun `a takeover pause stays set while the player is paused`() {
    val state = VideoSessionState(isPlaying = true, isPausedForTakeover = true).withPlaying(false)

    assertTrue(state.isPausedForTakeover)
    assertFalse(state.isPlaying)
  }

  @Test
  fun `a play clears the takeover pause`() {
    val state = VideoSessionState(isPausedForTakeover = true).withPlaying(true)

    assertFalse(state.isPausedForTakeover)
    assertTrue(state.isPlaying)
  }

  // Session use action

  @Test
  fun `begins a use when one is wanted and none is live`() {
    val action = sessionUseAction(isUseLive = false, isUseStale = false, applied = null, state = VideoSessionState(isPlaying = true))

    assertEquals(SessionUseAction.Begin(requirements(MixingRequirement.DO_NOT_MIX)), action)
  }

  @Test
  fun `does nothing when the live use already has the requirements`() {
    val action = sessionUseAction(
      isUseLive = true,
      isUseStale = false,
      applied = requirements(MixingRequirement.DO_NOT_MIX),
      state = VideoSessionState(isPlaying = true)
    )

    assertEquals(SessionUseAction.None, action)
  }

  @Test
  fun `updates the live use when muting changes the requirements`() {
    val action = sessionUseAction(
      isUseLive = true,
      isUseStale = false,
      applied = requirements(MixingRequirement.DO_NOT_MIX),
      state = VideoSessionState(isPlaying = true, isMuted = true)
    )

    assertEquals(SessionUseAction.Update(requirements(MixingRequirement.MIX_WITH_OTHERS)), action)
  }

  @Test
  fun `stale use restarts when the requirements change`() {
    val action = sessionUseAction(
      isUseLive = true,
      isUseStale = true,
      applied = requirements(MixingRequirement.MIX_WITH_OTHERS),
      state = VideoSessionState(isPlaying = true)
    )

    assertEquals(SessionUseAction.Restart(requirements(MixingRequirement.DO_NOT_MIX)), action)
  }

  @Test
  fun `stale use with the same requirements is left alone`() {
    val action = sessionUseAction(
      isUseLive = true,
      isUseStale = true,
      applied = requirements(MixingRequirement.MIX_WITH_OTHERS),
      state = VideoSessionState(isPlaying = true, isMuted = true)
    )

    assertEquals(SessionUseAction.None, action)
  }

  @Test
  fun `stale doNotMix use restarts when the player becomes audible`() {
    val doNotMix = requirements(MixingRequirement.DO_NOT_MIX, pausesWhenDucked = true)
    val action = sessionUseAction(
      isUseLive = true,
      isUseStale = true,
      applied = doNotMix,
      state = VideoSessionState(isPlaying = true, audioMixingMode = AudioMixingMode.DO_NOT_MIX)
    )

    assertEquals(SessionUseAction.Restart(doNotMix), action)
  }

  @Test
  fun `stale doNotMix use of a muted player is left alone`() {
    val doNotMix = requirements(MixingRequirement.DO_NOT_MIX, pausesWhenDucked = true)
    val action = sessionUseAction(
      isUseLive = true,
      isUseStale = true,
      applied = doNotMix,
      state = VideoSessionState(isPlaying = true, isMuted = true, audioMixingMode = AudioMixingMode.DO_NOT_MIX)
    )

    assertEquals(SessionUseAction.None, action)
  }

  @Test
  fun `ends the live use when none is wanted`() {
    val action = sessionUseAction(
      isUseLive = true,
      isUseStale = false,
      applied = requirements(MixingRequirement.DO_NOT_MIX),
      state = VideoSessionState()
    )

    assertEquals(SessionUseAction.End, action)
  }

  @Test
  fun `does nothing when no use is wanted and none is live`() {
    val action = sessionUseAction(isUseLive = false, isUseStale = false, applied = null, state = VideoSessionState())

    assertEquals(SessionUseAction.None, action)
  }

  // Now Playing claim action

  private val wantedClaim = VideoSessionState(showNowPlayingNotification = true, hasSource = true, isAttachedToView = true)

  @Test
  fun `offers when a claim is wanted and none exists`() {
    assertEquals(NowPlayingClaimAction.OFFER, nowPlayingClaimAction(hasClaim = false, state = wantedClaim))
  }

  @Test
  fun `withdraws when the claim is no longer wanted`() {
    assertEquals(NowPlayingClaimAction.WITHDRAW, nowPlayingClaimAction(hasClaim = true, state = VideoSessionState()))
  }

  @Test
  fun `keeps an existing wanted claim`() {
    assertEquals(NowPlayingClaimAction.NONE, nowPlayingClaimAction(hasClaim = true, state = wantedClaim))
  }
}
