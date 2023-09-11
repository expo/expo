package expo.modules.updates.manifest

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.json.JSONException
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class ResponseHeaderDataTest {
  @Test
  @Throws(JSONException::class)
  fun testHeaderDictionaryToJSONObject_SupportedTypes() {
    val actual =
      ResponseHeaderData.headerDictionaryToJSONObject("string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5")
    Assert.assertNotNull(actual)
    Assert.assertEquals(5, actual!!.length().toLong())
    Assert.assertEquals("string-0000", actual.getString("string"))
    Assert.assertTrue(actual.getBoolean("true"))
    Assert.assertFalse(actual.getBoolean("false"))
    Assert.assertEquals(47, actual.getInt("integer").toLong())
    Assert.assertEquals(47.5, actual.getDouble("decimal"), 0.0)
  }

  @Test
  @Throws(JSONException::class)
  fun testHeaderDictionaryToJSONObject_IgnoresOtherTypes() {
    val actual =
      ResponseHeaderData.headerDictionaryToJSONObject("branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)")
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-1", actual.getString("branch-name"))
  }

  @Test
  @Throws(JSONException::class)
  fun testHeaderDictionaryToJSONObject_IgnoresParameters() {
    val actual = ResponseHeaderData.headerDictionaryToJSONObject("abc=123;a=1;b=2")
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals(123, actual.getInt("abc").toLong())
  }

  @Test
  fun testHeaderDictionaryToJSONObject_Empty() {
    val actual = ResponseHeaderData.headerDictionaryToJSONObject("")
    Assert.assertNotNull(actual)
    Assert.assertEquals(0, actual!!.length().toLong())
  }

  @Test
  fun testHeaderDictionaryToJSONObject_ParsingError() {
    val actual = ResponseHeaderData.headerDictionaryToJSONObject("bad dictionary")
    Assert.assertNull(actual)
  }
}
