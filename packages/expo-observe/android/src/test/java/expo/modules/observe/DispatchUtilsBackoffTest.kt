package expo.modules.observe

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests for `DispatchUtils.computeBackoffDelay`. The random source is injected so
 * jitter draws are deterministic; this lets us assert exact wall-clock delays.
 */
class DispatchUtilsBackoffTest {
  private val base: Long = 60_000L
  private val cap: Long = 900_000L

  // Attempt 1 with no jitter (random=0) is the zero floor of the exponential schedule.
  // Attempt 1 with full jitter (random near 1.0) approaches the unjittered base interval.
  // Together these prove the jitter range is `[0, base * 2^(attempt-1))`.
  @Test
  fun `attempt one jitter zero is zero`() {
    val delay = DispatchUtils.computeBackoffDelay(
      attempt = 1,
      base = base,
      cap = cap,
      random = { 0.0 }
    )
    assertEquals(0L, delay)
  }

  @Test
  fun `attempt one jitter near max approaches base`() {
    val delay = DispatchUtils.computeBackoffDelay(
      attempt = 1,
      base = base,
      cap = cap,
      random = { 0.999 }
    )
    assertTrue("expected delay > 0.99 * base, got $delay", delay > (base * 0.99).toLong())
    // Strict — `Random.nextDouble()` excludes 1.0, and 0.999 < 1 so delay < base.
    assertTrue("expected delay < base, got $delay", delay < base)
  }

  // The exponential schedule doubles between attempts: attempt 2 reaches 2 × base,
  // attempt 3 reaches 4 × base, …, all multiplied by the jitter draw.
  @Test
  fun `attempts two through four double the unjittered ceiling`() {
    val r: () -> Double = { 0.5 } // pin jitter to exactly half
    val two = DispatchUtils.computeBackoffDelay(attempt = 2, base = base, cap = cap, random = r)
    val three = DispatchUtils.computeBackoffDelay(attempt = 3, base = base, cap = cap, random = r)
    val four = DispatchUtils.computeBackoffDelay(attempt = 4, base = base, cap = cap, random = r)
    assertEquals(base * 2 / 2, two) // 60_000
    assertEquals(base * 4 / 2, three) // 120_000
    assertEquals(base * 8 / 2, four) // 240_000
  }

  // Once `base * 2^(attempt-1)` would exceed `cap`, the unjittered ceiling clamps to `cap`.
  // Verified with attempt 5 (would be 16 × 60_000 = 960_000 > 900_000).
  @Test
  fun `attempt above cap threshold clamps to cap times jitter`() {
    // attempt 5 → 60_000 × 16 = 960_000; cap = 900_000 → clamps to 900_000, jitter 0.5 → 450_000.
    val delay = DispatchUtils.computeBackoffDelay(
      attempt = 5,
      base = base,
      cap = cap,
      random = { 0.5 }
    )
    assertEquals(cap / 2, delay)
  }

  @Test
  fun `very large attempt count still respects cap`() {
    // 2^29 × 60_000 would overflow Long; the cap must clamp it before the jitter draw.
    val delay = DispatchUtils.computeBackoffDelay(
      attempt = 30,
      base = base,
      cap = cap,
      random = { 1.0 }
    )
    assertTrue("expected delay <= cap, got $delay", delay <= cap)
  }

  @Test
  fun `attempt zero returns zero defensively`() {
    // 1-based attempt counter; attempt 0 would be a logic error elsewhere. Don't produce a
    // negative exponent — just return 0 so the caller's gate is set to "now" and the next
    // round can dispatch immediately.
    val delay = DispatchUtils.computeBackoffDelay(
      attempt = 0,
      base = base,
      cap = cap,
      random = { 1.0 }
    )
    assertEquals(0L, delay)
  }

  @Test
  fun `negative attempt returns zero defensively`() {
    val delay = DispatchUtils.computeBackoffDelay(
      attempt = -5,
      base = base,
      cap = cap,
      random = { 1.0 }
    )
    assertEquals(0L, delay)
  }
}
