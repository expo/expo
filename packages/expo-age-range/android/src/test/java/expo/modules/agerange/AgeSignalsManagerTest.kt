package expo.modules.agerange

import android.os.Looper
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.model.AgeSignalsErrorCode
import com.google.android.play.agesignals.model.AgeSignalsVerificationStatus
import com.google.android.play.agesignals.testing.FakeAgeSignalsManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Date

@RunWith(RobolectricTestRunner::class)
class AgeSignalsManagerTest {

  @Test
  fun testCheckAgeSignals_verifiedAdult_success() {
    val mostRecentApprovalDate = LocalDate.of(2022, 1, 15).atStartOfDay().toInstant(ZoneOffset.UTC)

    val mockAgeSignalsResult = AgeSignalsResult.builder()
      .setUserStatus(AgeSignalsVerificationStatus.VERIFIED)
      .setAgeLower(18)
      .setAgeUpper(null)
      .setInstallId("fake-install-id")
      .setMostRecentApprovalDate(
        Date.from(mostRecentApprovalDate)
      )
      .build()

    val fakeManager = FakeAgeSignalsManager().apply {
      setNextAgeSignalsResult(mockAgeSignalsResult)
    }

    var ageRangeResult: AgeRangeResult? = null
    var errorResult: expo.modules.kotlin.exception.CodedException? = null

    requestAgeRange(
      ageSignalsManager = fakeManager,
      onSuccess = { result -> ageRangeResult = result },
      onError = { error -> errorResult = error },
      onCancelled = { }
    )

    // Idle the main looper to execute pending callbacks
    shadowOf(Looper.getMainLooper()).idle()

    assertEquals(null, errorResult)
    assertNotNull("Expected success callback to be called", ageRangeResult)
    assertEquals(18, ageRangeResult!!.lowerBound)
    assertEquals(null, ageRangeResult.upperBound)
    assertEquals("VERIFIED", ageRangeResult.userStatus)
    assertEquals("fake-install-id", ageRangeResult.installId)
    assertEquals(mostRecentApprovalDate.toEpochMilli(), ageRangeResult.mostRecentApprovalDate)
  }

  @Test
  fun exceptionHandling() {
    val fakeManager = FakeAgeSignalsManager().apply {
      setNextAgeSignalsException(
        AgeSignalsException(AgeSignalsErrorCode.PLAY_SERVICES_VERSION_OUTDATED)
      )
    }

    var ageRangeResult: AgeRangeResult? = null
    var errorResult: expo.modules.kotlin.exception.CodedException? = null

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
}
