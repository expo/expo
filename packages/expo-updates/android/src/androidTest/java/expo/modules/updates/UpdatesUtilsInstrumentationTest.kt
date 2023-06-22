package expo.modules.updates

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.text.ParseException
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdatesUtilsInstrumentationTest {
  @Test
  @Throws(ParseException::class)
  fun testParseDateString_Z() {
    Assert.assertEquals(
      Date(1605053874699L),
      UpdatesUtils.parseDateString("2020-11-11T00:17:54.699Z")
    )
  }

  @Test(expected = ParseException::class)
  @Throws(ParseException::class)
  fun testParseDateString_writtenTimezone() {
    Assert.assertEquals(
      Date(1605053874699L),
      UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+0000")
    )
    Assert.assertEquals(
      Date(1605050274699L),
      UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+0100")
    )
  }

  @Test(expected = ParseException::class)
  @Throws(ParseException::class)
  fun testParseDateString_writtenTimezoneWithColon() {
    Assert.assertEquals(
      Date(1605053874699L),
      UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+00:00")
    )
    Assert.assertEquals(
      Date(1605050274699L),
      UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+01:00")
    )
  }

  @Test
  @Throws(Exception::class)
  fun testgetHeadersMapFromJSONString_empty() {
    val emptyMap = UpdatesUtils.getMapFromJSONString("{}")
    Assert.assertEquals(emptyMap, mapOf<String, String>())
  }

  @Test
  @Throws(Exception::class)
  fun testgetHeadersMapFromJSONString_expectedFormat() {
    val expected = mapOf("expo-channel-name" to "main")
    val emptyMap = UpdatesUtils.getMapFromJSONString("{\"expo-channel-name\":\"main\"}")
    Assert.assertEquals(emptyMap, expected)
  }

  @Test(expected = Exception::class)
  @Throws(Exception::class)
  fun testgetHeadersMapFromJSONString_throwsIntegerValue() {
    UpdatesUtils.getMapFromJSONString("{\"expo-channel-name\": 5}")
  }

  @Test(expected = Exception::class)
  @Throws(Exception::class)
  fun testgetHeadersMapFromJSONString_throwsNonStringValue() {
    UpdatesUtils.getMapFromJSONString("{\"expo-channel-name\":[\"main\"]}")
  }

  @Test(expected = Exception::class)
  @Throws(Exception::class)
  fun testgetHeadersMapFromJSONString_throwsNonStringKey() {
    UpdatesUtils.getMapFromJSONString("{7:[\"main\"]}")
  }
}
