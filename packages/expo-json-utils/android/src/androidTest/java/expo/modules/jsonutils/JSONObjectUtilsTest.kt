package expo.modules.jsonutils

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
import org.amshove.kluent.*
import org.json.JSONException

@RunWith(AndroidJUnit4ClassRunner::class)
class JSONObjectUtilsTest {
  @Test
  fun testObjectJsonOf() {
  }

  @Test
  @Throws(Exception::class)
  fun testGetOrNull() {
    val randomObject = "stringobject" as Any
    val innerJSONArray = JSONArray()
    val innerJSONObject = JSONObject()

    val jsonObject = JSONObject(
      mapOf(
        "string" to "test",
        "double" to 1.0,
        "int" to 1,
        "long" to 1L,
        "boolean" to false,
        "object" to randomObject,
        "jsonarray" to innerJSONArray,
        "jsonobject" to innerJSONObject
      )
    )

    jsonObject.getOrNull<Any>("non-existent-key") shouldBe null

    val func = { jsonObject.require<Any>("non-existent-key") }
    func shouldThrow JSONException::class withMessage "No value for non-existent-key"

    jsonObject.getOrNull<String>("string") shouldBeEqualTo "test"
    jsonObject.getOrNull<Double>("double") shouldBeEqualTo 1.0
    jsonObject.getOrNull<Int>("int") shouldBeEqualTo 1
    jsonObject.getOrNull<Long>("long") shouldBeEqualTo 1L
    jsonObject.getOrNull<Boolean>("boolean") shouldBeEqualTo false
    jsonObject.getOrNull<Any>("object") shouldBeEqualTo randomObject
    jsonObject.getOrNull<JSONArray>("jsonarray") shouldBeEqualTo innerJSONArray
    jsonObject.getOrNull<JSONObject>("jsonobject") shouldBeEqualTo innerJSONObject
  }
}
