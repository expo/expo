package expo.modules.observe

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The outcome mapping behind span dispatch. Pure, so each branch is asserted directly rather
 * than inferred from the loop's database side effects. Mirrors the iOS
 * `SpanDispatchLoopTests.every outcome maps to a disposition`.
 */
class SpanDispatchOutcomeTest {
  @Test
  fun `a delivered chunk is deleted and the loop continues`() {
    assertEquals(
      SpanDispatchDisposition.DELETE_AND_CONTINUE,
      spanDispatchDisposition(DispatchResult.Success, chunkCount = 2)
    )
  }

  @Test
  fun `partial success still deletes the chunk`() {
    // A rejection is permanent (a malformed id, a session id that is not a UUID), so resending
    // the same bytes would fail identically.
    val partial = OTPartialSuccess(rejectedSpans = 1)
    assertEquals(
      SpanDispatchDisposition.DELETE_AND_CONTINUE,
      spanDispatchDisposition(DispatchResult.PartialSuccess(partial), chunkCount = 2)
    )
  }

  @Test
  fun `a non-retryable failure drops the chunk rather than retrying it forever`() {
    assertEquals(
      SpanDispatchDisposition.DELETE_AND_CONTINUE,
      spanDispatchDisposition(DispatchResult.NonRetryableFailure("malformed"), chunkCount = 2)
    )
  }

  @Test
  fun `a retryable failure keeps every remaining row`() {
    assertEquals(
      SpanDispatchDisposition.KEEP_AND_STOP,
      spanDispatchDisposition(DispatchResult.RetryableFailure(retryAfterMs = null), chunkCount = 2)
    )
  }

  @Test
  fun `an oversized multi-span chunk is halved`() {
    assertEquals(
      SpanDispatchDisposition.HALVE_AND_RETRY,
      spanDispatchDisposition(DispatchResult.PayloadTooLarge, chunkCount = 2)
    )
  }

  @Test
  fun `an oversized single span is dropped because it cannot be split`() {
    assertEquals(
      SpanDispatchDisposition.DELETE_AND_CONTINUE,
      spanDispatchDisposition(DispatchResult.PayloadTooLarge, chunkCount = 1)
    )
  }
}
