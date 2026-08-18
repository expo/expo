package expo.modules.agerange

import android.app.Activity
import android.os.Looper
import com.google.android.play.agesignals.AgeSignalsAccessResult
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.model.AgeRangeSource
import com.google.android.play.agesignals.model.AgeSignalsErrorCode
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.SignificantChangeStatus
import com.google.android.play.agesignals.testing.FakeAgeSignalsManager
import expo.modules.kotlin.exception.CodedException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Date

@RunWith(RobolectricTestRunner::class)
class AgeSignalsManagerTest {

  @Test
  fun testCheckAgeSignals_verifiedAdult_success() {
    val approvedAt = LocalDate.of(2022, 1, 15).atStartOfDay().toInstant(ZoneOffset.UTC)

    val result = requestAndAwait(
      AgeSignalsResult.builder()
        .setAgeRangeSource(AgeRangeSource.TIER_D)
        .setAgeLower(18)
        .setAgeUpper(null)
        .setInstallId("fake-install-id")
        .setSignificantChangeStatus(SignificantChangeStatus.APPROVED)
        .setSignificantChangeApprovalDate(Date.from(approvedAt))
        .build()
    )

    assertEquals(18, result.lowerBound)
    assertEquals(null, result.upperBound)
    assertEquals("fake-install-id", result.installId)
    assertEquals("TIER_D", result.ageRangeSource)
    assertEquals("APPROVED", result.significantChangeStatus)
    assertEquals(approvedAt.toEpochMilli(), result.significantChangeApprovalDate)
    assertEquals(approvedAt.toEpochMilli(), result.mostRecentApprovalDate)
  }

  @Test
  fun exceptionHandling() {
    val fakeManager = FakeAgeSignalsManager().apply {
      setNextAgeSignalsException(
        AgeSignalsException(AgeSignalsErrorCode.PLAY_SERVICES_VERSION_OUTDATED)
      )
    }

    var ageRangeResult: AgeRangeResult? = null
    var errorResult: CodedException? = null

    requestAgeRange(
      ageSignalsManager = fakeManager,
      onSuccess = { result -> ageRangeResult = result },
      onError = { error -> errorResult = error },
      onCancelled = { }
    )

    shadowOf(Looper.getMainLooper()).idle()

    assertEquals(null, ageRangeResult)
    assertNotNull("Expected error callback to be called", errorResult)
    assertEquals("Age Signals Error: -7", errorResult!!.message)
    assertEquals(AgeSignalsErrorCode.PLAY_SERVICES_VERSION_OUTDATED.toString(), errorResult.code)
  }

  @Test
  fun `requestAgeSignalsAccess reports the sharing status`() {
    // The consent screen needs a real Play Age Signals consent state to appear, so the callback
    // path can't practically be driven on a device or simulator in CI.
    assertEquals("SHARED", requestAccessAndAwait(AgeSignalsStatus.SHARED))
    assertEquals("NOT_SHARED", requestAccessAndAwait(AgeSignalsStatus.NOT_SHARED))
    assertEquals(
      "VERIFICATION_REQUIRED",
      requestAccessAndAwait(AgeSignalsStatus.VERIFICATION_REQUIRED)
    )
    // Play documents neither UNSPECIFIED nor its meaning — the documented values are the named
    // ones and null. Whatever it means, we don't leak it to JS, so it
    // maps to null like an absent or unrecognised value does, in every mapping.
    assertEquals(null, requestAccessAndAwait(AgeSignalsStatus.UNSPECIFIED))
    assertEquals(
      AgeRangeSourceValue.TIER_B,
      AgeRangeSourceValue.fromPlayValue(AgeRangeSource.TIER_B)
    )
    assertEquals(null, AgeSignalsStatusValue.fromPlayValue(null))
    assertEquals(null, AgeRangeSourceValue.fromPlayValue(AgeRangeSource.UNSPECIFIED))
    assertEquals(null, SignificantChangeStatusValue.fromPlayValue(99))
  }

  @Test
  fun `requestAgeSignalsAccess reports errors`() {
    // FakeAgeSignalsManager has no hook to cancel the task, so only the failure path is driven
    // here. It shares `processAgeSignalsError` with `requestAgeRange`.
    val fakeManager = FakeAgeSignalsManager().apply {
      setNextRequestAgeSignalsAccessException(
        AgeSignalsException(AgeSignalsErrorCode.PLAY_SERVICES_VERSION_OUTDATED)
      )
    }

    var errorResult: CodedException? = null
    requestAgeSignalsAccess(
      ageSignalsManager = fakeManager,
      activity = Robolectric.buildActivity(Activity::class.java).setup().get(),
      onSuccess = { throw AssertionError("Unexpected success: $it") },
      onError = { errorResult = it },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )
    shadowOf(Looper.getMainLooper()).idle()

    assertNotNull("Expected error callback to be called", errorResult)
    assertEquals("Age Signals Error: -7", errorResult!!.message)
    assertEquals(AgeSignalsErrorCode.PLAY_SERVICES_VERSION_OUTDATED.toString(), errorResult.code)
  }

  private fun requestAccessAndAwait(status: Int?): String? {
    val fakeManager = FakeAgeSignalsManager().apply {
      setNextAgeSignalsAccessResult(
        AgeSignalsAccessResult.builder().setAgeSignalsStatus(status).build()
      )
    }

    var called = false
    var accessStatus: String? = null
    requestAgeSignalsAccess(
      ageSignalsManager = fakeManager,
      activity = Robolectric.buildActivity(Activity::class.java).setup().get(),
      onSuccess = {
        called = true
        accessStatus = it
      },
      onError = { throw AssertionError("Unexpected error: $it") },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )
    shadowOf(Looper.getMainLooper()).idle()

    assertEquals("Expected success callback for status $status", true, called)
    return accessStatus
  }

  private fun requestAndAwait(result: AgeSignalsResult): AgeRangeResult {
    val fakeManager = FakeAgeSignalsManager().apply { setNextAgeSignalsResult(result) }

    var ageRangeResult: AgeRangeResult? = null
    requestAgeRange(
      ageSignalsManager = fakeManager,
      onSuccess = { ageRangeResult = it },
      onError = { throw AssertionError("Unexpected error: $it") },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )
    shadowOf(Looper.getMainLooper()).idle()

    assertNotNull("Expected success callback to be called", ageRangeResult)
    return ageRangeResult!!
  }
}
