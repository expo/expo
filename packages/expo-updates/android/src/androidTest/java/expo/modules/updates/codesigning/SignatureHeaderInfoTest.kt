package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class SignatureHeaderInfoTest {
  @Test
  fun test_parseSignatureHeader_ParsesCodeSigningInfo() {
    val codeSigningInfo = SignatureHeaderInfo.parseSignatureHeader("sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    Assert.assertEquals(codeSigningInfo.signature, "12345")
    Assert.assertEquals(codeSigningInfo.keyId, "test")
    Assert.assertEquals(codeSigningInfo.algorithm, CodeSigningAlgorithm.RSA_SHA256)
  }

  @Test
  fun test_parseSignatureHeader_DefaultsKeyIdAndAlg() {
    val codeSigningInfo = SignatureHeaderInfo.parseSignatureHeader("sig=\"12345\"")
    Assert.assertEquals(codeSigningInfo.signature, "12345")
    Assert.assertEquals(codeSigningInfo.keyId, "root")
    Assert.assertEquals(codeSigningInfo.algorithm, CodeSigningAlgorithm.RSA_SHA256)
  }

  @Test(expected = Exception::class)
  @Throws(Exception::class)
  fun test_parseSignatureHeader_ThrowsForInvalidAlg() {
    SignatureHeaderInfo.parseSignatureHeader("sig=\"12345\", alg=\"blah\"")
  }
}
