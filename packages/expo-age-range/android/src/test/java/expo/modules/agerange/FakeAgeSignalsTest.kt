package expo.modules.agerange

import android.os.Looper
import com.google.android.play.agesignals.model.AgeSignalsErrorCode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class FakeAgeSignalsTest {

  @Test
  fun `fake signals are reported as an age range`() {
    val fake = FakeAgeSignals(
      FakeAgeSignalsOptions().apply {
        lowerBound = 13
        upperBound = 15
        ageRangeSource = AgeRangeSourceValue.TIER_B
        significantChangeStatus = SignificantChangeStatusValue.PENDING
      }
    )

    var result: AgeRangeResult? = null
    requestAgeRange(
      ageSignalsManager = fake.manager,
      onSuccess = { result = it },
      onError = { throw AssertionError("Unexpected error: $it") },
      onCancelled = { throw AssertionError("Unexpected cancellation") }
    )
    shadowOf(Looper.getMainLooper()).idle()

    assertNotNull("Expected success callback to be called", result)
    assertEquals(13, result!!.lowerBound)
    assertEquals(15, result.upperBound)
    assertEquals("TIER_B", result.ageRangeSource)
    assertEquals("PENDING", result.significantChangeStatus)
  }

  @Test
  fun `an error and a response cannot be faked at once`() {
    assertThrows(FakeAgeSignalsConflictException::class.java) {
      FakeAgeSignals(
        FakeAgeSignalsOptions().apply {
          errorCode = AgeSignalsErrorCode.APP_NOT_OWNED
          lowerBound = 18
        }
      )
    }
  }
}
