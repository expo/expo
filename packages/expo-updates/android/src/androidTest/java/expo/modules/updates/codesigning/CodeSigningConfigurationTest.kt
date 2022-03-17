package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Test
import org.junit.runner.RunWith
import java.io.IOException
import kotlin.test.assertFailsWith
import kotlin.test.assertEquals

@RunWith(AndroidJUnit4ClassRunner::class)
class CodeSigningConfigurationTest {
  @Test
  fun test_separateCertificateChain() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)

    val testCert = getTestCertificate(TestCertificateType.VALID)

    val chain1 = CodeSigningConfiguration.separateCertificateChain(leafCert)
    assertEquals(1, chain1.size)

    val chain2 = CodeSigningConfiguration.separateCertificateChain(
      leafCert + intermediateCert
    )
    assertEquals(2, chain2.size)

    val chain3 = CodeSigningConfiguration.separateCertificateChain(
      leafCert + intermediateCert + rootCert
    )
    assertEquals(3, chain3.size)

    val chainWithABunchOfNewlinesAndStuff = CodeSigningConfiguration.separateCertificateChain(
      testCert + "\n\n\n\n" + testCert
    )
    assertEquals(2, chainWithABunchOfNewlinesAndStuff.size)
  }

  @Test
  fun test_getAcceptSignatureHeader_CreatesSignatureHeaderDefaultValues() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val configuration = CodeSigningConfiguration(testCert, mapOf(), false, false)
    val signatureHeader = configuration.getAcceptSignatureHeader()
    assertEquals("sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\"", signatureHeader)
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
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = false
    )
    val signatureHeader = configuration.getAcceptSignatureHeader()
    assertEquals("sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\"", signatureHeader)
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
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = false
    )
    val signatureHeader = configuration.getAcceptSignatureHeader()
    assertEquals("""sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256"""", signatureHeader)
  }

  @Test
  fun test_validateSignature_Valid() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(
      testCert,
      mapOf(),
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = false
    )
    codeSigningConfiguration.validateSignature(CertificateFixtures.testSignature, CertificateFixtures.testBody.toByteArray(), null)
  }

  @Test
  fun test_validateSignature_ReturnsFalseWhenSignatureIsInvalid() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(
      testCert,
      mapOf(),
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = false
    )
    val exception = assertFailsWith(
      exceptionClass = IOException::class,
      block = {
        codeSigningConfiguration.validateSignature("sig=\"aGVsbG8=\"", CertificateFixtures.testBody.toByteArray(), null)
      }
    )
    assertEquals("Manifest download was successful, but signature was incorrect", exception.message)
  }

  @Test
  fun test_validateSignature_ThrowsWhenKeyDoesNotMatch() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(
      testCert,
      mapOf(
        CODE_SIGNING_METADATA_KEY_ID_KEY to "test"
      ),
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = false
    )

    val exception = assertFailsWith(
      exceptionClass = Exception::class,
      block = {
        codeSigningConfiguration.validateSignature("sig=\"aGVsbG8=\", keyid=\"other\"", CertificateFixtures.testBody.toByteArray(), null)
      }
    )
    assertEquals("Key with keyid=other from signature not found in client configuration", exception.message)
  }

  @Test
  fun test_validateSignature_DoesNotUseChainInManifestResponseIfFlagIsFalse() {
    val testCert = getTestCertificate(TestCertificateType.VALID)

    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)

    val codeSigningConfiguration = CodeSigningConfiguration(
      testCert,
      mapOf(),
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = false
    )
    codeSigningConfiguration.validateSignature(CertificateFixtures.testSignature, CertificateFixtures.testBody.toByteArray(), leafCert + intermediateCert)
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
      includeManifestResponseCertificateChain = true,
      allowUnsignedManifests = false
    )
    codeSigningConfiguration.validateSignature(CertificateFixtures.testValidChainLeafSignature, CertificateFixtures.testBody.toByteArray(), leafCert + intermediateCert)
  }

  @Test
  fun test_validateSignature_AllowsUnsignedManifestIfAllowUnsignedFlagIsTrue() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(
      testCert,
      mapOf(
        CODE_SIGNING_METADATA_KEY_ID_KEY to "test"
      ),
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = true
    )
    codeSigningConfiguration.validateSignature(null, CertificateFixtures.testBody.toByteArray(), null)
  }

  @Test
  fun test_validateSignature_ChecksSignedManifestIfAllowUnsignedFlagIsTrueButSignatureIsProvided() {
    val testCert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningConfiguration = CodeSigningConfiguration(
      testCert,
      mapOf(),
      includeManifestResponseCertificateChain = false,
      allowUnsignedManifests = true
    )
    val exception = assertFailsWith(
      exceptionClass = IOException::class,
      block = {
        codeSigningConfiguration.validateSignature("sig=\"aGVsbG8=\"", CertificateFixtures.testBody.toByteArray(), null)
      }
    )
    assertEquals("Manifest download was successful, but signature was incorrect", exception.message)
  }
}
