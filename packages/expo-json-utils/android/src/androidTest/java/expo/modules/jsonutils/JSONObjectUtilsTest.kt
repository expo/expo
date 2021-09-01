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

    jsonObject.getNullable<Any>("non-existent-key") shouldBe null

    val func = { jsonObject.require<Any>("non-existent-key") }
    func shouldThrow JSONException::class withMessage "No value for non-existent-key"

    jsonObject.getNullable<String>("string") shouldBeEqualTo "test"
    jsonObject.getNullable<Double>("double") shouldBeEqualTo 1.0
    jsonObject.getNullable<Int>("int") shouldBeEqualTo 1
    jsonObject.getNullable<Long>("long") shouldBeEqualTo 1L
    jsonObject.getNullable<Boolean>("boolean") shouldBeEqualTo false
    jsonObject.getNullable<Any>("object") shouldBeEqualTo randomObject
    jsonObject.getNullable<JSONArray>("jsonarray") shouldBeEqualTo innerJSONArray
    jsonObject.getNullable<JSONObject>("jsonobject") shouldBeEqualTo innerJSONObject
  }
}
