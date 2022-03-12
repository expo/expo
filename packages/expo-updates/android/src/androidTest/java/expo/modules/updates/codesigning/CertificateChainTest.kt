package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.codesigning.CertificateChain.Companion.expoProjectInformation
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.security.SignatureException
import java.security.cert.CertificateException

@RunWith(AndroidJUnit4ClassRunner::class)
class CertificateChainTest {
  @Test
  fun test_ValidSingleCertificate() {
    val cert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningCertificate = CertificateChain(listOf(cert)).codeSigningCertificate
    Assert.assertNotNull(codeSigningCertificate)
    Assert.assertNull(codeSigningCertificate.expoProjectInformation())
  }

  @Test
  fun test_ValidCertificateChain() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)
    val codeSigningCertificate = CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
    Assert.assertNotNull(codeSigningCertificate)
    Assert.assertEquals(codeSigningCertificate.expoProjectInformation(), ExpoProjectInformation(appId = "285dc9ca-a25d-4f60-93be-36dc312266d7", scopeKey = "@test/app"))
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_RequiresLengthGreaterThanZero() {
    CertificateChain(listOf()).codeSigningCertificate
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_ThrowsWhenAnyCertificateIsInvalidDate() {
    val cert = getTestCertificate(TestCertificateType.VALIDITY_EXPIRED)
    CertificateChain(listOf(cert)).codeSigningCertificate
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_ThrowsWhenLeafIsNotCodeSigningNoKeyUsage() {
    val cert = getTestCertificate(TestCertificateType.NO_KEY_USAGE)
    CertificateChain(listOf(cert)).codeSigningCertificate
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_ThrowsWhenLeafIsNotCodeSigningNoCodeSigningExtendedKeyUsage() {
    val cert = getTestCertificate(TestCertificateType.NOT_CODE_SIGNING_EXTENDED_USAGE)
    CertificateChain(listOf(cert)).codeSigningCertificate
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_ThrowsChainIsNotValid() {
    // missing intermediate
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)
    CertificateChain(listOf(leafCert, rootCert)).codeSigningCertificate
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_ThrowsWhenRootIsNotSelfSigned() {
    // missing root, meaning intermediate is considered root and is not self-signed
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    CertificateChain(listOf(leafCert, intermediateCert)).codeSigningCertificate
  }

  @Test(expected = SignatureException::class)
  @Throws(SignatureException::class)
  fun test_ThrowsWhenAnySignatureInvalid() {
    val leafCert = getTestCertificate(TestCertificateType.INVALID_SIGNATURE_CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)
    CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
  }

  @Test(expected = SignatureException::class)
  @Throws(SignatureException::class)
  fun test_ThrowsWhenRootSignatureInvalid() {
    val cert = getTestCertificate(TestCertificateType.SINGATURE_INVALID)
    CertificateChain(listOf(cert)).codeSigningCertificate
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_ThrowsWhenIntermediateCANotCA() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_NOT_CA_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_NOT_CA_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_NOT_CA_ROOT)
    CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
  }

  @Test(expected = CertificateException::class)
  @Throws(CertificateException::class)
  fun test_ThrowsWhenCAPathLenViolated() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_PATH_LEN_VIOLATION_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_PATH_LEN_VIOLATION_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_PATH_LEN_VIOLATION_ROOT)
    CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
  }
}
