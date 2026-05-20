package expo.modules.video.cache

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CachePolicyTest {
  @Test
  fun `non playable status is not cacheable`() {
    val policy = CachePolicy.evaluate(emptyMap(), 401)

    assertFalse(policy.isCacheable)
    assertEquals(emptyList<String>(), policy.varyHeaders)
  }

  @Test
  fun `vary star is not cacheable`() {
    val policy = CachePolicy.evaluate(mapOf("Vary" to "*"), 200)

    assertFalse(policy.isCacheable)
  }

  @Test
  fun `quoted commas do not split header tokens`() {
    val policy = CachePolicy.evaluate(mapOf("Vary" to "Accept-Language, \"X-Foo, X-Bar\""), 200)

    assertEquals(listOf("\"x-foo, x-bar\"", "accept-language"), policy.varyHeaders)
  }

  @Test
  fun `public cache control allows authorization reuse`() {
    val policy = CachePolicy.evaluate(mapOf("Cache-Control" to "public"), 206)

    assertTrue(policy.isCacheable)
    assertTrue(policy.allowsAuthorizedReuse)
  }

  @Test
  fun `missing reuse directives block authorization reuse`() {
    val policy = CachePolicy.evaluate(mapOf("Cache-Control" to "max-age=3600"), 200)

    assertTrue(policy.isCacheable)
    assertFalse(policy.allowsAuthorizedReuse)
  }
}
