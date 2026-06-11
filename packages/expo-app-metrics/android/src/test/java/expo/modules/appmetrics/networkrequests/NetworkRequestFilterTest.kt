package expo.modules.appmetrics.networkrequests

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkRequestFilterTest {
  @Test
  fun `a filter with no fields set matches every request`() {
    val filter = NetworkRequestFilter()
    assertTrue(filter.matches("https://anything.example.com/path", "GET"))
    assertTrue(filter.matches("https://other.test/x", "DELETE"))
  }

  @Test
  fun `an empty array allows nothing through that dimension`() {
    assertFalse(NetworkRequestFilter(hosts = emptyList()).matches("https://api.expo.dev/x", "GET"))
    assertFalse(NetworkRequestFilter(methods = emptyList()).matches("https://api.expo.dev/x", "GET"))
  }

  @Test
  fun `hosts match exactly and case-insensitively`() {
    val filter = NetworkRequestFilter(hosts = listOf("API.Expo.dev"))
    assertTrue(filter.matches("https://api.expo.dev/v2", "GET"))
    // Exact host only - subdomains and unrelated hosts are excluded.
    assertFalse(filter.matches("https://cdn.expo.dev/v2", "GET"))
    assertFalse(filter.matches("https://example.com/v2", "GET"))
  }

  @Test
  fun `hosts is an OR across the listed entries`() {
    val filter = NetworkRequestFilter(hosts = listOf("api.expo.dev", "u.expo.dev"))
    assertTrue(filter.matches("https://api.expo.dev/x", "GET"))
    assertTrue(filter.matches("https://u.expo.dev/x", "GET"))
    assertFalse(filter.matches("https://cdn.expo.dev/x", "GET"))
  }

  @Test
  fun `methods match case-insensitively`() {
    val filter = NetworkRequestFilter(methods = listOf("post", "PUT"))
    assertTrue(filter.matches("https://expo.dev/x", "POST"))
    assertTrue(filter.matches("https://expo.dev/x", "put"))
    assertFalse(filter.matches("https://expo.dev/x", "GET"))
  }

  @Test
  fun `fields combine with AND`() {
    val filter = NetworkRequestFilter(hosts = listOf("api.expo.dev"), methods = listOf("POST"))
    // Both the host and the method must match.
    assertTrue(filter.matches("https://api.expo.dev/x", "POST"))
    assertFalse(filter.matches("https://api.expo.dev/x", "GET"))
    assertFalse(filter.matches("https://cdn.expo.dev/x", "POST"))
  }

  @Test
  fun `a malformed url matches no host constraint`() {
    val filter = NetworkRequestFilter(hosts = listOf("api.expo.dev"))
    assertFalse(filter.matches("not a url", "GET"))
  }
}
