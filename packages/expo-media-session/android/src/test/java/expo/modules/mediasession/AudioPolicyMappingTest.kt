package expo.modules.mediasession

import android.media.AudioAttributes
import android.media.AudioManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioPolicyMappingTest {
  private fun resolve(policy: AudioPolicy, vararg requirements: SessionRequirements) =
    SessionResolver.resolve(policy, requirements.toList())

  private fun gain(mode: InterruptionMode) = resolve(AudioPolicy(interruptionMode = mode)).focus?.gain

  @Test
  fun defaultPolicyIsMixWithOthers() {
    assertEquals(InterruptionMode.MIX_WITH_OTHERS, AudioPolicy.DEFAULT.interruptionMode)
    assertEquals(true, AudioPolicy.DEFAULT.playsInSilentMode)
    assertNull(resolve(AudioPolicy.DEFAULT).focus)
  }

  @Test
  fun focusGainTable() {
    assertEquals(AudioManager.AUDIOFOCUS_GAIN, gain(InterruptionMode.DO_NOT_MIX_PERSISTENT))
    assertEquals(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT, gain(InterruptionMode.DO_NOT_MIX))
    assertEquals(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK, gain(InterruptionMode.DUCK_OTHERS))
    assertNull(gain(InterruptionMode.MIX_WITH_OTHERS))
  }

  @Test
  fun requirementOnlyTightensMixing() {
    val persistent = resolve(
      AudioPolicy(interruptionMode = InterruptionMode.DO_NOT_MIX_PERSISTENT),
      SessionRequirements(mixing = MixingRequirement.DO_NOT_MIX)
    )
    assertEquals(InterruptionMode.DO_NOT_MIX_PERSISTENT, persistent.interruptionMode)
    assertEquals(AudioManager.AUDIOFOCUS_GAIN, persistent.focus?.gain)

    val mixing = resolve(
      AudioPolicy.DEFAULT,
      SessionRequirements(mixing = MixingRequirement.MIX_WITH_OTHERS),
      SessionRequirements(mixing = MixingRequirement.DO_NOT_MIX)
    )
    assertEquals(InterruptionMode.DO_NOT_MIX, mixing.interruptionMode)
    assertEquals(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT, mixing.focus?.gain)

    val ducking = AudioPolicy(interruptionMode = InterruptionMode.DUCK_OTHERS)
    assertEquals(
      InterruptionMode.DUCK_OTHERS,
      resolve(ducking, SessionRequirements(mixing = MixingRequirement.MIX_WITH_OTHERS)).interruptionMode
    )
    assertEquals(InterruptionMode.DUCK_OTHERS, resolve(ducking).interruptionMode)
  }

  @Test
  fun notifyOthersOnDeactivation() {
    assertFalse(InterruptionMode.DO_NOT_MIX_PERSISTENT.notifiesOthersOnDeactivation)
    assertTrue(InterruptionMode.DO_NOT_MIX.notifiesOthersOnDeactivation)
    assertTrue(InterruptionMode.DUCK_OTHERS.notifiesOthersOnDeactivation)
    assertTrue(InterruptionMode.MIX_WITH_OTHERS.notifiesOthersOnDeactivation)
  }

  @Test
  fun focusAttributes() {
    val exclusive = AudioPolicy(interruptionMode = InterruptionMode.DO_NOT_MIX)
    assertEquals(
      FocusSpec(
        gain = AudioManager.AUDIOFOCUS_GAIN_TRANSIENT,
        usage = AudioAttributes.USAGE_MEDIA,
        contentType = AudioAttributes.CONTENT_TYPE_MUSIC,
        acceptsDelayedFocusGain = true,
        pausesWhenDucked = false
      ),
      resolve(exclusive).focus
    )

    val call = resolve(
      exclusive,
      SessionRequirements(usage = AudioAttributes.USAGE_MEDIA, contentType = AudioAttributes.CONTENT_TYPE_MOVIE),
      SessionRequirements(
        usage = AudioAttributes.USAGE_VOICE_COMMUNICATION,
        contentType = AudioAttributes.CONTENT_TYPE_SPEECH,
        pausesWhenDucked = true
      )
    ).focus
    assertEquals(AudioAttributes.USAGE_VOICE_COMMUNICATION, call?.usage)
    assertEquals(AudioAttributes.CONTENT_TYPE_SPEECH, call?.contentType)
    assertEquals(true, call?.pausesWhenDucked)
  }
}
