package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.Month

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class DateTypeConverterTest {
  @Test
  fun `converts from ISO 8601 String to LocalDate`() {
    val dateString = DynamicFromObject("2023-12-27T22:44:17.806Z")
    val date = convert<LocalDate>(dateString)
    Truth.assertThat(date.month).isEqualTo(Month.DECEMBER)
    Truth.assertThat(date.monthValue).isEqualTo(12)
    Truth.assertThat(date.dayOfWeek).isEqualTo(DayOfWeek.WEDNESDAY)
    Truth.assertThat(date.year).isEqualTo(2023)
  }

  @Test
  fun `converts from Number to LocalDate`() {
    val date = convert<LocalDate>(1703718341639)
    Truth.assertThat(date.month).isEqualTo(Month.DECEMBER)
    Truth.assertThat(date.monthValue).isEqualTo(12)
    Truth.assertThat(date.dayOfWeek).isIn(listOf(DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY))
    Truth.assertThat(date.year).isEqualTo(2023)
  }
}
