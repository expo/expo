package expo.modules.filesystem.fsops

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UtilitiesTest {
  @Test
  fun copyChannelContents_stopsWhenTransferMakesNoProgress() {
    var calls = 0

    val result = copyChannelContents(4096L) { _, _ ->
      calls += 1
      when (calls) {
        1 -> 2048L
        else -> 0L
      }
    }

    assertFalse(result)
    assertTrue("The loop should stop after the first zero-progress transfer", calls == 2)
  }

  @Test
  fun copyChannelContents_supportsLargeSizes() {
    val size = Int.MAX_VALUE.toLong() + 8192L
    var calls = 0

    val result = copyChannelContents(size) { _, remaining ->
      calls += 1
      when (calls) {
        1 -> Int.MAX_VALUE.toLong()
        else -> remaining
      }
    }

    assertTrue(result)
    assertTrue("The loop should finish in two transfers", calls == 2)
  }
}
