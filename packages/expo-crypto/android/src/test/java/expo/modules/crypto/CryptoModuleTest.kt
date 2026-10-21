package expo.modules.crypto

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class CryptoModuleTest {
  private val module = CryptoModule()
  private val testValue = "Expo"
  private val algorithms = DigestAlgorithm.entries

  @Test
  fun digestStringForBase64() {
    val options = DigestOptions(encoding = DigestOptions.Encoding.BASE64)
    for (algorithm in algorithms) {
      val result = module.digestString(algorithm, testValue, options)
      assertEquals(expectedEncodingResults[options.encoding]!![algorithm], result)
    }
  }

  @Test
  fun digestStringForHex() {
    val options = DigestOptions(encoding = DigestOptions.Encoding.HEX)
    for (algorithm in algorithms) {
      val result = module.digestString(algorithm, testValue, options)
      assertEquals(expectedEncodingResults[options.encoding]!![algorithm], result)
    }
  }

  @Test
  fun digestStringAsyncResolvesToTheSameDigest() = runBlocking {
    val options = DigestOptions(encoding = DigestOptions.Encoding.BASE64)
    for (algorithm in algorithms) {
      assertEquals(
        module.digestString(algorithm, testValue, options),
        module.digestStringAsync(algorithm, testValue, options)
      )
    }
  }

  @Test
  fun digestOptionsDefaultToHex() {
    assertEquals(DigestOptions.Encoding.HEX, DigestOptions().encoding)
  }

  @Test
  fun enumsCrossAsTheValuesJavaScriptPasses() {
    assertEquals(listOf("MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"), algorithms.map { it.value })
    assertEquals(listOf("hex", "base64"), DigestOptions.Encoding.entries.map { it.value })
  }

  @Test
  fun randomUUIDIsALowercaseVersion4UUID() {
    val uuid = module.randomUUID()
    assertTrue(uuid, Regex("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$").matches(uuid))
  }
}
