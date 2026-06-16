package expo.modules.observe

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Tests for [ObservabilityManager.computeNextDeferredArm]. The pure helper is the source of
 * truth for the deferred-dispatch arm/re-arm/cap rules; `armDeferredDispatch` is a thin wrapper
 * that schedules a `Job` against its output.
 */
class ObservabilityArmDeferredTest {
  private val delayMs: Long = 1_800_000 // 30 min
  private val armedAtMs: Long = 1_000_000

  // ---------- First arm ----------

  @Test
  fun `first arm with no existing state schedules for now plus delay`() {
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = armedAtMs,
      delayMs = delayMs,
      existing = null
    )
    assertEquals(armedAtMs + delayMs, next.fireTimeMs)
    assertEquals(armedAtMs, next.originalArmTimeMs)
  }

  @Test
  fun `delay zero first arm fires immediately and cap collapses`() {
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = armedAtMs,
      delayMs = 0,
      existing = null
    )
    assertEquals(armedAtMs, next.fireTimeMs)
    assertEquals(armedAtMs, next.originalArmTimeMs)
  }

  // ---------- Re-arm: push by delay over two ----------

  @Test
  fun `re-arm pushes existing fire time by delay over two`() {
    val existing = DeferredArmState(
      fireTimeMs = armedAtMs + delayMs,
      originalArmTimeMs = armedAtMs
    )
    val pollAtMs = armedAtMs + 60_000
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = pollAtMs,
      delayMs = delayMs,
      existing = existing
    )
    // Pushed = delay + delay/2; cap = original + 2 * delay. Uncapped.
    assertEquals(armedAtMs + delayMs + delayMs / 2, next.fireTimeMs)
    // originalArmTimeMs is preserved across re-arms so the cap stays anchored to the first arm.
    assertEquals(armedAtMs, next.originalArmTimeMs)
  }

  // ---------- Re-arm: cap behavior ----------

  @Test
  fun `re-arm fire time already at the cap stays at the cap`() {
    // Existing fire already equals originalArm + 2 × delay; pushing further would exceed the cap.
    val cappedFireMs = armedAtMs + 2 * delayMs
    val existing = DeferredArmState(fireTimeMs = cappedFireMs, originalArmTimeMs = armedAtMs)
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = armedAtMs + 60_000,
      delayMs = delayMs,
      existing = existing
    )
    assertEquals(cappedFireMs, next.fireTimeMs)
    assertEquals(armedAtMs, next.originalArmTimeMs)
  }

  @Test
  fun `re-arm push that would land beyond the cap is clamped`() {
    // 100 ms shy of the cap. Pushed = cap - 100 + delay/2, well over the cap → clamped.
    val existing = DeferredArmState(
      fireTimeMs = armedAtMs + 2 * delayMs - 100,
      originalArmTimeMs = armedAtMs
    )
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = armedAtMs + 60_000,
      delayMs = delayMs,
      existing = existing
    )
    assertEquals(armedAtMs + 2 * delayMs, next.fireTimeMs)
    assertEquals(armedAtMs, next.originalArmTimeMs)
  }

  @Test
  fun `re-arm push that lands exactly at the cap is unclamped`() {
    // existing fire = original + 1.5 × delay. Pushed = 1.5 + 0.5 = 2.0 × delay = cap.
    // min(pushed, cap) == cap exactly.
    val existing = DeferredArmState(
      fireTimeMs = armedAtMs + delayMs + delayMs / 2,
      originalArmTimeMs = armedAtMs
    )
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = armedAtMs + 60_000,
      delayMs = delayMs,
      existing = existing
    )
    assertEquals(armedAtMs + 2 * delayMs, next.fireTimeMs)
  }

  // ---------- Re-arm: stale existing state ----------

  @Test
  fun `re-arm with existing fire time already passed counts as first arm`() {
    // Existing deadline is in the past — the timer has already fired (or is about to) and the
    // state is stale. Treat as fresh, restarting the cap window from the new poll time.
    val existing = DeferredArmState(
      fireTimeMs = armedAtMs - 1,
      originalArmTimeMs = armedAtMs
    )
    val pollAtMs = armedAtMs + 60_000
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = pollAtMs,
      delayMs = delayMs,
      existing = existing
    )
    assertEquals(pollAtMs + delayMs, next.fireTimeMs)
    assertEquals(pollAtMs, next.originalArmTimeMs)
  }

  @Test
  fun `re-arm with existing fire time exactly equal to now counts as first arm`() {
    // `existing.fireTimeMs > nowMs` is the gate; `==` falls through to the first-arm branch.
    val existing = DeferredArmState(fireTimeMs = armedAtMs, originalArmTimeMs = armedAtMs)
    val next = ObservabilityManager.computeNextDeferredArm(
      nowMs = armedAtMs,
      delayMs = delayMs,
      existing = existing
    )
    assertEquals(armedAtMs + delayMs, next.fireTimeMs)
    assertEquals(armedAtMs, next.originalArmTimeMs)
  }
}
