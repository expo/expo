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
  fun `quoted commas in cache-control do not split into spurious directives`() {
    // `public` here is a quoted field-name inside the `private` directive's
    // value, not a real cache directive. A naive comma split would surface it as
    // a standalone directive and wrongly enable Authorization reuse. (Quoted
    // lists only ever appear in Cache-Control, never in Vary.)
    val policy = CachePolicy.evaluate(mapOf("Cache-Control" to "private=\"X-Foo, public, X-Bar\""), 200)

    assertTrue(policy.isCacheable)
    assertFalse(policy.allowsAuthorizedReuse)
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
