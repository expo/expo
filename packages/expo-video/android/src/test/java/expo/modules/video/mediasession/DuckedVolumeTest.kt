package expo.modules.video.mediasession

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DuckedVolumeTest {
  @Test
  fun `duck halves the volume`() {
    val duckedVolume = DuckedVolume()

    assertEquals(0.4f, duckedVolume.duck(0.8f))
  }

  @Test
  fun `a second duck does not halve the volume again`() {
    val duckedVolume = DuckedVolume()
    duckedVolume.duck(0.8f)

    assertNull(duckedVolume.duck(0.4f))
  }

  @Test
  fun `restore returns the volume from before the duck`() {
    val duckedVolume = DuckedVolume()
    duckedVolume.duck(0.8f)
    duckedVolume.duck(0.4f)

    assertEquals(0.8f, duckedVolume.restore())
  }

  @Test
  fun `restore without a duck returns nothing`() {
    val duckedVolume = DuckedVolume()

    assertNull(duckedVolume.restore())
  }

  @Test
  fun `a duck after a restore halves the volume again`() {
    val duckedVolume = DuckedVolume()
    duckedVolume.duck(0.8f)
    duckedVolume.restore()

    assertEquals(0.4f, duckedVolume.duck(0.8f))
  }
}
