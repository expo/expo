package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class CodeSigningConfigurationTest {
  @Test
  fun test_separateCertificateChain() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)

    val testCert = getTestCertificate(TestCertificateType.VALID)

    val chain1 = CodeSigningConfiguration.separateCertificateChain(leafCert)
    Assert.assertEquals(1, chain1.size)

    val chain2 = CodeSigningConfiguration.separateCertificateChain(
      leafCert + intermediateCert
    )
    Assert.assertEquals(2, chain2.size)

    val chain3 = CodeSigningConfiguration.separateCertificateChain(
      leafCert + intermediateCert + rootCert
    )
    Assert.assertEquals(3, chain3.size)

    val chainWithABunchOfNewlinesAndStuff = CodeSigningConfiguration.separateCertificateChain(
      testCert + "\n\n\n\n" + testCert
    )
    Assert.assertEquals(2, chainWithABunchOfNewlinesAndStuff.size)
  }

  @Test
  fun test_getAcceptSignatureHeader_CreatesSignatureHeaderDefaultValues() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val configuration = CodeSigningConfiguration(testCert, mapOf(), false)
    val signatureHeader = configuration.getAcceptSignatureHeader()
    Assert.assertEquals(signatureHeader, "sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\"")
  }

  @Test
  fun test_getAcceptSignatureHeader_CreatesSignatureHeaderValuesFromConfig() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val configuration = CodeSigningConfiguration(
      testCert,
      mapOf(
        CODE_SIGNING_METADATA_ALGORITHM_KEY to "rsa-v1_5-sha256",
        CODE_SIGNING_METADATA_KEY_ID_KEY to "test"
      ),
      false
    )
    val signatureHeader = configuration.getAcceptSignatureHeader()
    Assert.assertEquals(signatureHeader, "sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
  }

  @Test
  fun test_getAcceptSignatureHeader_CreatesSignatureHeaderEscapedValues() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val configuration = CodeSigningConfiguration(
      testCert,
      mapOf(
        CODE_SIGNING_METADATA_ALGORITHM_KEY to "rsa-v1_5-sha256",
        CODE_SIGNING_METADATA_KEY_ID_KEY to """test"hello\"""
      ),
      false
    )
    val signatureHeader = configuration.getAcceptSignatureHeader()
    Assert.assertEquals("""sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256"""", signatureHeader)
  }

  @Test
  fun test_validateSignature_Valid() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(testCert, mapOf(), false)
    val codesigningInfo = SignatureHeaderInfo.parseSignatureHeader(CertificateFixtures.testNewManifestBodySignature)
    val signatureValidationResult = codeSigningConfiguration.validateSignature(codesigningInfo, CertificateFixtures.testNewManifestBody.toByteArray(), null)
    Assert.assertTrue(signatureValidationResult.isValid)
    Assert.assertNull(signatureValidationResult.expoProjectInformation)
  }

  @Test
  fun test_validateSignature_ReturnsFalseWhenSignatureIsInvalid() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(testCert, mapOf(), false)
    val codesigningInfo = SignatureHeaderInfo.parseSignatureHeader("sig=\"aGVsbG8=\"")
    val signatureValidationResult = codeSigningConfiguration.validateSignature(codesigningInfo, CertificateFixtures.testNewManifestBody.toByteArray(), null)
    Assert.assertFalse(signatureValidationResult.isValid)
    Assert.assertNull(signatureValidationResult.expoProjectInformation)
  }

  @Test(expected = Exception::class)
  @Throws(Exception::class)
  fun test_validateSignature_ThrowsWhenKeyDoesNotMatch() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(
      testCert,
      mapOf(
        CODE_SIGNING_METADATA_KEY_ID_KEY to "test"
      ),
      false
    )
    val codesigningInfo = SignatureHeaderInfo.parseSignatureHeader("sig=\"aGVsbG8=\", keyid=\"other\"")
    codeSigningConfiguration.validateSignature(codesigningInfo, CertificateFixtures.testNewManifestBody.toByteArray(), null)
  }

  @Test
  fun test_validateSignature_DoesNotUseChainInManifestResponseIfFlagIsFalse() {
    val testCert = getTestCertificate(TestCertificateType.VALID)

    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)

    val codeSigningConfiguration = CodeSigningConfiguration(testCert, mapOf(), false)
    val codesigningInfo = SignatureHeaderInfo.parseSignatureHeader(CertificateFixtures.testNewManifestBodySignature)
    val signatureValidationResult = codeSigningConfiguration.validateSignature(codesigningInfo, CertificateFixtures.testNewManifestBody.toByteArray(), leafCert + intermediateCert)
    Assert.assertTrue(signatureValidationResult.isValid)
    Assert.assertNull(signatureValidationResult.expoProjectInformation)
  }

  @Test
  fun test_validateSignature_DoesUseChainInManifestResponseIfFlagIsTrue() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)
    val codeSigningConfiguration = CodeSigningConfiguration(
      rootCert,
      mapOf(
        CODE_SIGNING_METADATA_KEY_ID_KEY to "ca-root"
      ),
      true
    )
    val codesigningInfo = SignatureHeaderInfo.parseSignatureHeader(CertificateFixtures.testNewManifestBodyValidChainLeafSignature)
    val signatureValidationResult = codeSigningConfiguration.validateSignature(codesigningInfo, CertificateFixtures.testNewManifestBody.toByteArray(), leafCert + intermediateCert)
    Assert.assertTrue(signatureValidationResult.isValid)
    Assert.assertEquals(signatureValidationResult.expoProjectInformation, ExpoProjectInformation(appId = "285dc9ca-a25d-4f60-93be-36dc312266d7", scopeKey = "@test/app"))
  }
}
