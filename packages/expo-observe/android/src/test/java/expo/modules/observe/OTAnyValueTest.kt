package expo.modules.observe

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class OTAnyValueCodableTest {
  private val json = Json

  private fun encode(value: OTAnyValue): JsonObject {
    return json.encodeToJsonElement(OTAnyValueSerializer, value).jsonObject
  }

  @Test
  fun `encodes Str under stringValue`() {
    val obj = encode(OTAnyValue.Str("hello"))
    assertEquals(1, obj.size)
    assertEquals("hello", obj["stringValue"]!!.jsonPrimitive.content)
  }

  @Test
  fun `encodes Int64 under intValue as a string`() {
    val obj = encode(OTAnyValue.Int64(42))
    assertEquals(1, obj.size)
    // OTLP encodes int64 as a JSON string to avoid JS-number precision loss.
    assertEquals("42", obj["intValue"]!!.jsonPrimitive.content)
    assertTrue(obj["intValue"]!!.jsonPrimitive.isString)
  }

  @Test
  fun `encodes Dbl under doubleValue as a JSON number`() {
    val obj = encode(OTAnyValue.Dbl(3.14))
    assertEquals(1, obj.size)
    assertEquals(3.14, obj["doubleValue"]!!.jsonPrimitive.double, 0.0)
  }

  @Test
  fun `encodes Bln under boolValue`() {
    val obj = encode(OTAnyValue.Bln(true))
    assertEquals(1, obj.size)
    assertEquals(true, obj["boolValue"]!!.jsonPrimitive.boolean)
  }

  @Test
  fun `encodes Arr as arrayValue with values list`() {
    val obj = encode(OTAnyValue.Arr(listOf(OTAnyValue.Int64(1), OTAnyValue.Str("x"))))
    assertEquals(1, obj.size)
    val values = obj["arrayValue"]!!.jsonObject["values"]!!.jsonArray
    assertEquals(2, values.size)
    assertEquals("1", values[0].jsonObject["intValue"]!!.jsonPrimitive.content)
    assertEquals("x", values[1].jsonObject["stringValue"]!!.jsonPrimitive.content)
  }

  @Test
  fun `encodes KvList as kvlistValue with key value pairs`() {
    val obj = encode(
      OTAnyValue.KvList(
        listOf(
          OTKeyValue(key = "a", value = OTAnyValue.Int64(1)),
          OTKeyValue(key = "b", value = OTAnyValue.Str("x"))
        )
      )
    )
    assertEquals(1, obj.size)
    val values = obj["kvlistValue"]!!.jsonObject["values"]!!.jsonArray
    assertEquals(2, values.size)
    assertEquals("a", values[0].jsonObject["key"]!!.jsonPrimitive.content)
    assertEquals("1", values[0].jsonObject["value"]!!.jsonObject["intValue"]!!.jsonPrimitive.content)
  }

  @Test
  fun `roundtrips through serialization`() {
    val original: OTAnyValue = OTAnyValue.KvList(
      listOf(
        OTKeyValue(key = "name", value = OTAnyValue.Str("hello")),
        OTKeyValue(key = "count", value = OTAnyValue.Int64(3)),
        OTKeyValue(key = "ratio", value = OTAnyValue.Dbl(0.5)),
        OTKeyValue(key = "ok", value = OTAnyValue.Bln(true)),
        OTKeyValue(
          key = "tags",
          value = OTAnyValue.Arr(listOf(OTAnyValue.Str("a"), OTAnyValue.Str("b")))
        )
      )
    )
    val encoded = json.encodeToString(OTAnyValueSerializer, original)
    val decoded = json.decodeFromString(OTAnyValueSerializer, encoded)
    require(decoded is OTAnyValue.KvList)
    assertEquals(5, decoded.values.size)
  }
}

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class OTAnyValueConversionTest {
  private fun jsonObj(block: kotlinx.serialization.json.JsonObjectBuilder.() -> Unit) =
    buildJsonObject(block)

  @Test
  fun `maps a JSON boolean to Bln`() {
    val value = otAnyValueFromJsonElement(JsonPrimitive(true))
    assertTrue(value is OTAnyValue.Bln)
    assertEquals(true, (value as OTAnyValue.Bln).value)
  }

  @Test
  fun `maps a JSON integer to Int64`() {
    val value = otAnyValueFromJsonElement(JsonPrimitive(42))
    assertTrue(value is OTAnyValue.Int64)
    assertEquals(42L, (value as OTAnyValue.Int64).value)
  }

  @Test
  fun `maps a JSON double to Dbl`() {
    val value = otAnyValueFromJsonElement(JsonPrimitive(3.14))
    assertTrue(value is OTAnyValue.Dbl)
    assertEquals(3.14, (value as OTAnyValue.Dbl).value, 0.0)
  }

  @Test
  fun `maps a JSON string to Str`() {
    val value = otAnyValueFromJsonElement(JsonPrimitive("hello"))
    assertTrue(value is OTAnyValue.Str)
    assertEquals("hello", (value as OTAnyValue.Str).value)
  }

  @Test
  fun `drops a JSON non-finite double`() {
    // JSON cannot encode NaN/Infinity directly; validate the code path that
    // checks `isFinite` against a manually-constructed primitive.
    assertNull(otAnyValueFromJsonElement(JsonPrimitive(Double.NaN)))
    assertNull(otAnyValueFromJsonElement(JsonPrimitive(Double.POSITIVE_INFINITY)))
    assertNull(otAnyValueFromJsonElement(JsonPrimitive(Double.NEGATIVE_INFINITY)))
  }

  @Test
  fun `maps a JSON array to Arr`() {
    val element = buildJsonArray {
      add(JsonPrimitive(1))
      add(JsonPrimitive("x"))
    }
    val value = otAnyValueFromJsonElement(element)
    assertTrue(value is OTAnyValue.Arr)
    assertEquals(2, (value as OTAnyValue.Arr).values.size)
  }

  @Test
  fun `maps a JSON object to KvList`() {
    val element = jsonObj {
      put("a", JsonPrimitive(1))
      put("b", JsonPrimitive("x"))
    }
    val value = otAnyValueFromJsonElement(element)
    assertTrue(value is OTAnyValue.KvList)
    assertEquals(2, (value as OTAnyValue.KvList).values.size)
  }

  @Test
  fun `drops a JSON null value`() {
    assertNull(otAnyValueFromJsonElement(kotlinx.serialization.json.JsonNull))
  }
}
