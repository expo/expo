package expo.modules.crypto

import expo.modules.kotlin.exception.CodedException
import expo.modules.test.core.legacy.ModuleMock
import expo.modules.test.core.legacy.ModuleMockHolder
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private interface CryptoModuleTestInterface {
  @Throws(CodedException::class)
  fun digestStringAsync(algorithm: DigestAlgorithm, data: String, options: DigestOptions): String
}

private inline fun withCryptoModuleMock(
  block: ModuleMockHolder<CryptoModuleTestInterface, CryptoModule>.() -> Unit
) = ModuleMock.createMock(
  CryptoModuleTestInterface::class,
  CryptoModule(),
  block = block
)

@RunWith(RobolectricTestRunner::class)
class CryptoModuleTest {
  private val testValue = "Expo"
  private val algorithms = DigestAlgorithm.entries

  @Test
  fun digestStringForBase64() = withCryptoModuleMock {
    val options = DigestOptions().apply { encoding = DigestOptions.Encoding.BASE64 }
    for (algorithm in algorithms) {
      val result = module.digestStringAsync(algorithm, testValue, options)
      assertEquals(expectedEncodingResults[options.encoding]!![algorithm], result)
    }
  }

  @Test
  fun digestStringForHex() = withCryptoModuleMock {
    val options = DigestOptions().apply { encoding = DigestOptions.Encoding.HEX }
    for (algorithm in algorithms) {
      val result = module.digestStringAsync(algorithm, testValue, options)
      assertEquals(expectedEncodingResults[options.encoding]!![algorithm], result)
    }
  }
}
