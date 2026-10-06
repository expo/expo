package expo.modules.appmetrics.networkrequests

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class NetworkTracesConfigurationTest {
  @Test
  fun `records nothing by default`() {
    // Opt-in: an app that never configures `networkTraces` records no spans, so upgrading can't
    // silently add to a customer's event bill.
    val config = NetworkTracesConfiguration()
    assertFalse(config.allows("https://api.example.com/items", "GET"))
    assertFalse(config.allows("https://other.dev/x", "DELETE"))
  }

  @Test
  fun `allows every request once enabled without a filter`() {
    val config = NetworkTracesConfiguration(enabled = true)
    assertTrue(config.allows("https://api.example.com/items", "GET"))
    assertTrue(config.allows("https://other.dev/x", "DELETE"))
  }

  @Test
  fun `blocks every request while disabled, even ones matching the filter`() {
    val config = NetworkTracesConfiguration(enabled = false, hosts = listOf("api.example.com"))
    assertFalse(config.allows("https://api.example.com/items", "GET"))
  }

  @Test
  fun `matches hosts for exact case-insensitive equality`() {
    val config = NetworkTracesConfiguration(enabled = true, hosts = listOf("API.Example.com"))
    assertTrue(config.allows("https://api.example.com/items", "GET"))
    assertFalse(config.allows("https://sub.api.example.com/items", "GET"))
    assertFalse(config.allows("https://other.dev/x", "GET"))
  }

  @Test
  fun `an empty host list blocks every request`() {
    // `null` means unconstrained; an empty list is an allowlist with no entries.
    val config = NetworkTracesConfiguration(enabled = true, hosts = emptyList())
    assertFalse(config.allows("https://api.example.com/items", "GET"))
  }

  @Test
  fun `matches methods case-insensitively`() {
    val config = NetworkTracesConfiguration(enabled = true, methods = listOf("get", "Post"))
    assertTrue(config.allows("https://api.example.com/items", "GET"))
    assertTrue(config.allows("https://api.example.com/items", "POST"))
    assertFalse(config.allows("https://api.example.com/items", "DELETE"))
  }

  @Test
  fun `a request whose URL has no parseable host never matches a host list`() {
    // A host allowlist means "only these hosts"; an unparseable URL can't prove membership.
    val config = NetworkTracesConfiguration(enabled = true, hosts = listOf("api.example.com"))
    assertFalse(config.allows("not a url", "GET"))
  }

  @Test
  fun `round-trips through the preferences encoding`() {
    val full = NetworkTracesConfiguration(
      enabled = false,
      hosts = listOf("api.example.com", "cdn.example.com"),
      methods = listOf("GET")
    )
    assertEquals(full, NetworkTracesConfiguration.fromJson(full.toJson()))
    val minimal = NetworkTracesConfiguration()
    val restored = NetworkTracesConfiguration.fromJson(minimal.toJson())
    assertEquals(minimal, restored)
    assertNull(restored.hosts)
    assertNull(restored.methods)
  }

  @Test
  fun `falls back to the default policy for a malformed blob`() {
    // A corrupt preferences entry must never disable recording or crash module creation. The
    // first three reach the `runCatching` fallback (`JSONObject(json)` itself throws); the last
    // parses cleanly and leaves `hosts` null, since `optJSONArray` returns null for a non-array.
    for (blob in listOf("", "not json", "[1,2]", """{"hosts":"nope"}""")) {
      assertEquals(NetworkTracesConfiguration(), NetworkTracesConfiguration.fromJson(blob))
    }
    // Recovers the readable fields instead of discarding the whole blob, unlike iOS, where a
    // `hosts` of the wrong type fails the decode and resets `enabled` too. Both fall open on the
    // blobs this code actually writes; they differ only for a partially corrupt one.
    assertEquals(
      NetworkTracesConfiguration(enabled = false),
      NetworkTracesConfiguration.fromJson("""{"enabled":false,"hosts":"nope"}""")
    )
  }
}
