package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

@RunWith(AndroidJUnit4ClassRunner::class)
class SignatureHeaderInfoTest {
  @Test
  fun test_parseSignatureHeader_ParsesCodeSigningInfo() {
    val codeSigningInfo = SignatureHeaderInfo.parseSignatureHeader("sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    assertEquals("12345", codeSigningInfo.signature)
    assertEquals("test", codeSigningInfo.keyId)
    assertEquals(CodeSigningAlgorithm.RSA_SHA256, codeSigningInfo.algorithm)
  }

  @Test
  fun test_parseSignatureHeader_DefaultsKeyIdAndAlg() {
    val codeSigningInfo = SignatureHeaderInfo.parseSignatureHeader("sig=\"12345\"")
    assertEquals("12345", codeSigningInfo.signature)
    assertEquals("root", codeSigningInfo.keyId)
    assertEquals(CodeSigningAlgorithm.RSA_SHA256, codeSigningInfo.algorithm)
  }

  @Test
  fun test_parseSignatureHeader_ThrowsForInvalidAlg() {
    val exception = assertFailsWith(
      exceptionClass = Exception::class,
      block = {
        SignatureHeaderInfo.parseSignatureHeader("sig=\"12345\", alg=\"blah\"")
      }
    )
    assertEquals("Invalid code signing algorithm name: blah", exception.message)
  }
}
