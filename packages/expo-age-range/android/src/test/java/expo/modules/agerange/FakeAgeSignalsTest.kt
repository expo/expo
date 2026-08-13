package expo.modules.agerange

import android.app.Activity
import android.os.Bundle
import android.os.Looper
import com.google.android.play.agesignals.model.AgeSignalsErrorCode
import expo.modules.kotlin.exception.CodedException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class FakeAgeSignalsTest {

  @Test
  fun `fake age signals are enabled only when the app opts in`() {
    assertFalse(
      "Expected absent meta-data to leave fakes disabled",
      isFakeAgeSignalsEnabled(null as Bundle?)
    )
    assertFalse(isFakeAgeSignalsEnabled(Bundle()))
    assertFalse(
      isFakeAgeSignalsEnabled(Bundle().apply { putBoolean(FAKE_AGE_SIGNALS_META_DATA, false) })
    )
    assertTrue(
      isFakeAgeSignalsEnabled(Bundle().apply { putBoolean(FAKE_AGE_SIGNALS_META_DATA, true) })
    )
    // An app that says nothing about fake age signals, which is every app that does not test them.
    assertFalse(isFakeAgeSignalsEnabled(RuntimeEnvironment.getApplication()))
  }

  @Test
  fun `fake age signals are reported as an age range`() {
    val result = requestAgeRangeAndAwait(
      fakeAgeSignals {
        lowerBound = 13
        upperBound = 15
        installId = "fake-install-id"
        ageRangeSource = "TIER_B"
        significantChangeStatus = "PENDING"
        significantChangeApprovalDate = 1642204800000
      }
    )

    assertEquals(13, result.lowerBound)
    assertEquals(15, result.upperBound)
    assertEquals("fake-install-id", result.installId)
    assertEquals("TIER_B", result.ageRangeSource)
    assertEquals("PENDING", result.significantChangeStatus)
    assertEquals(1642204800000, result.significantChangeApprovalDate)
  }

  @Test
  fun `omitted fake age signals are reported as absent`() {
    val result = requestAgeRangeAndAwait(fakeAgeSignals {})

    assertEquals(null, result.lowerBound)
    assertEquals(null, result.upperBound)
    assertEquals(null, result.installId)
    assertEquals(null, result.ageRangeSource)
    assertEquals(null, result.significantChangeStatus)
    assertEquals(null, result.significantChangeApprovalDate)
  }

  @Test
  fun `the same fake age signals answer every request`() {
    val fake = fakeAgeSignals { lowerBound = 18 }

    assertEquals(18, requestAgeRangeAndAwait(fake).lowerBound)
    assertEquals(18, requestAgeRangeAndAwait(fake).lowerBound)
  }

  @Test
  fun `fake age signals report a sharing status`() {
    assertEquals("SHARED", requestAccessAndAwait(fakeAgeSignals { ageSignalsStatus = "SHARED" }))
    assertEquals(
      "VERIFICATION_REQUIRED",
      requestAccessAndAwait(fakeAgeSignals { ageSignalsStatus = "VERIFICATION_REQUIRED" })
    )
    assertEquals(null, requestAccessAndAwait(fakeAgeSignals {}))
  }

  @Test
  fun `a fake error code fails both requests`() {
    val fake = fakeAgeSignals { errorCode = AgeSignalsErrorCode.APP_NOT_OWNED }

    var ageRangeError: CodedException? = null
    requestAgeRange(
      ageSignalsManager = fake.manager(),
      onSuccess = { throw AssertionError("Unexpected success: $it") },
      onError = { ageRangeError = it },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )

    var accessError: CodedException? = null
    requestAgeSignalsAccess(
      ageSignalsManager = fake.manager(),
      activity = activity(),
      onSuccess = { throw AssertionError("Unexpected success: $it") },
      onError = { accessError = it },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )

    shadowOf(Looper.getMainLooper()).idle()

    assertNotNull("Expected requestAgeRange to report the faked error", ageRangeError)
    assertNotNull("Expected requestAgeSignalsAccess to report the faked error", accessError)
    assertEquals(AgeSignalsErrorCode.APP_NOT_OWNED.toString(), ageRangeError!!.code)
    assertEquals(AgeSignalsErrorCode.APP_NOT_OWNED.toString(), accessError!!.code)
  }

  @Test
  fun `unrecognised fake age signals are reported instead of ignored`() {
    assertThrows(InvalidFakeAgeSignalsException::class.java) {
      significantChangeStatusFromString("approved")
    }
    assertThrows(InvalidFakeAgeSignalsException::class.java) {
      ageSignalsStatusFromString("UNSPECIFIED")
    }

    // Reported when the signals are installed, not when the faked request is made.
    val exception = assertThrows(InvalidFakeAgeSignalsException::class.java) {
      fakeAgeSignals { ageRangeSource = "TIER_E" }
    }
    assertEquals("ERR_AGE_RANGE_INVALID_FAKE_SIGNALS", exception.code)
    assertTrue(
      "Expected the message to list the allowed values, got: ${exception.message}",
      exception.message!!.contains("`TIER_A`")
    )
  }

  private fun fakeAgeSignals(configure: FakeAgeSignalsOptions.() -> Unit) =
    FakeAgeSignals(FakeAgeSignalsOptions().apply(configure))

  private fun activity(): Activity = Robolectric.buildActivity(Activity::class.java).setup().get()

  private fun requestAgeRangeAndAwait(fake: FakeAgeSignals): AgeRangeResult {
    var result: AgeRangeResult? = null
    requestAgeRange(
      ageSignalsManager = fake.manager(),
      onSuccess = { result = it },
      onError = { throw AssertionError("Unexpected error: $it") },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )
    shadowOf(Looper.getMainLooper()).idle()

    assertNotNull("Expected success callback to be called", result)
    return result!!
  }

  private fun requestAccessAndAwait(fake: FakeAgeSignals): String? {
    var called = false
    var status: String? = null
    requestAgeSignalsAccess(
      ageSignalsManager = fake.manager(),
      activity = activity(),
      onSuccess = {
        called = true
        status = it
      },
      onError = { throw AssertionError("Unexpected error: $it") },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )
    shadowOf(Looper.getMainLooper()).idle()

    assertTrue("Expected success callback to be called", called)
    return status
  }
}
