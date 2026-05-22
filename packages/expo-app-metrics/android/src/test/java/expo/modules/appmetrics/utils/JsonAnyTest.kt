package expo.modules.appmetrics.utils

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class JsonAnyTest {
  @Test
  fun `encodeMapToJsonString round-trips primitives, booleans and nested structures`() {
    val encoded = JsonAny.encodeMapToJsonString(
      mapOf(
        "isInitial" to true,
        "isAppLaunch" to false,
        "screen" to "Home",
        "attempt" to 3,
        "ratio" to 1.5,
        "missing" to null,
        "tags" to listOf("a", "b"),
        "nested" to mapOf("k" to true)
      )
    )

    @Suppress("UNCHECKED_CAST")
    val decoded = JsonAny.fromElement(Json.decodeFromString<JsonElement>(encoded)) as Map<String, Any?>
    assertEquals(true, decoded["isInitial"])
    assertEquals(false, decoded["isAppLaunch"])
    assertEquals("Home", decoded["screen"])
    assertEquals(3L, decoded["attempt"])
    assertEquals(1.5, decoded["ratio"])
    assertNull(decoded["missing"])
    assertEquals(listOf("a", "b"), decoded["tags"])
    assertEquals(mapOf("k" to true), decoded["nested"])
  }

  @Test
  fun `decodeJsonStringToMap round-trips encodeMapToJsonString output`() {
    val original = mapOf(
      "screen" to "home",
      "attempt" to 3,
      "active" to true,
      "tags" to listOf("a", "b"),
      "nested" to mapOf("k" to false)
    )
    val decoded = JsonAny.decodeJsonStringToMap(JsonAny.encodeMapToJsonString(original))!!
    assertEquals("home", decoded["screen"])
    assertEquals(3L, decoded["attempt"])
    assertEquals(true, decoded["active"])
    assertEquals(listOf("a", "b"), decoded["tags"])
    assertEquals(mapOf("k" to false), decoded["nested"])
  }

  @Test
  fun `decodeJsonStringToMap returns null on invalid JSON`() {
    assertNull(JsonAny.decodeJsonStringToMap("not json"))
  }

  @Test
  fun `decodeJsonStringToMap returns null when the JSON is not an object`() {
    assertNull(JsonAny.decodeJsonStringToMap("[1, 2, 3]"))
    assertNull(JsonAny.decodeJsonStringToMap("\"a string\""))
  }
}
