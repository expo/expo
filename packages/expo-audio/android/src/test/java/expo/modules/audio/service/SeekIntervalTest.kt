package expo.modules.audio.service

import org.junit.Assert.assertEquals
import org.junit.Test

class SeekIntervalTest {
  @Test
  fun missingIntervalUsesDefault() {
    assertEquals(10_000L, seekIntervalMs(null))
  }

  @Test
  fun keepsFractionalIntervals() {
    assertEquals(15_500L, seekIntervalMs(15.5))
    assertEquals(100L, seekIntervalMs(0.1))
  }

  @Test
  fun clampsIntervalsBelowMinimum() {
    assertEquals(100L, seekIntervalMs(0.0))
    assertEquals(100L, seekIntervalMs(-3.0))
  }

  @Test
  fun nonFiniteIntervalsUseDefault() {
    assertEquals(10_000L, seekIntervalMs(Double.NaN))
    assertEquals(10_000L, seekIntervalMs(Double.POSITIVE_INFINITY))
    assertEquals(10_000L, seekIntervalMs(Double.NEGATIVE_INFINITY))
  }
}
