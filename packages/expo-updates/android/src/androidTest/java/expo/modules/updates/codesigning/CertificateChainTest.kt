package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.codesigning.CertificateChain.Companion.expoProjectInformation
import org.junit.Test
import org.junit.runner.RunWith
import java.security.SignatureException
import java.security.cert.CertificateException
import kotlin.test.*

@RunWith(AndroidJUnit4ClassRunner::class)
class CertificateChainTest {
  @Test
  fun test_ValidSingleCertificate() {
    val cert = getTestCertificate(TestCertificateType.VALID)
    val codeSigningCertificate = CertificateChain(listOf(cert)).codeSigningCertificate
    assertNotNull(codeSigningCertificate)
    assertNull(codeSigningCertificate.expoProjectInformation())
  }

  @Test
  fun test_ValidCertificateChain() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)
    val codeSigningCertificate = CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
    assertNotNull(codeSigningCertificate)
    assertEquals(ExpoProjectInformation(projectId = "285dc9ca-a25d-4f60-93be-36dc312266d7", scopeKey = "@test/app"), codeSigningCertificate.expoProjectInformation())
  }

  @Test
  fun test_RequiresLengthGreaterThanZero() {
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf()).codeSigningCertificate
      }
    )
    assertEquals("No code signing certificates provided", exception.message)
  }

  @Test
  fun test_ThrowsWhenAnyCertificateIsInvalidDate() {
    val cert = getTestCertificate(TestCertificateType.VALIDITY_EXPIRED)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(cert)).codeSigningCertificate
      }
    )
    assertTrue { exception.message!!.contains("Certificate expired at") }
  }

  @Test
  fun test_ThrowsWhenLeafIsNotCodeSigningNoKeyUsage() {
    val cert = getTestCertificate(TestCertificateType.NO_KEY_USAGE)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(cert)).codeSigningCertificate
      }
    )
    assertEquals("First certificate in chain is not a code signing certificate. Must have X509v3 Key Usage: Digital Signature and X509v3 Extended Key Usage: Code Signing", exception.message)
  }

  @Test
  fun test_ThrowsWhenLeafIsNotCodeSigningNoCodeSigningExtendedKeyUsage() {
    val cert = getTestCertificate(TestCertificateType.NOT_CODE_SIGNING_EXTENDED_USAGE)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(cert)).codeSigningCertificate
      }
    )
    assertEquals("First certificate in chain is not a code signing certificate. Must have X509v3 Key Usage: Digital Signature and X509v3 Extended Key Usage: Code Signing", exception.message)
  }

  @Test
  fun test_ThrowsChainIsNotValid() {
    // missing intermediate
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(leafCert, rootCert)).codeSigningCertificate
      }
    )
    assertEquals("Certificates do not chain", exception.message)
  }

  @Test
  fun test_ThrowsWhenRootIsNotSelfSigned() {
    // missing root, meaning intermediate is considered root and is not self-signed
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(leafCert, intermediateCert)).codeSigningCertificate
      }
    )
    assertEquals("Root certificate not self-signed", exception.message)
  }

  @Test
  fun test_ThrowsWhenAnySignatureInvalid() {
    val leafCert = getTestCertificate(TestCertificateType.INVALID_SIGNATURE_CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)
    assertFailsWith(
      exceptionClass = SignatureException::class,
      block = {
        CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
      }
    )
  }

  @Test
  fun test_ThrowsWhenRootSignatureInvalid() {
    val cert = getTestCertificate(TestCertificateType.SIGNATURE_INVALID)
    assertFailsWith(
      exceptionClass = SignatureException::class,
      block = {
        CertificateChain(listOf(cert)).codeSigningCertificate
      }
    )
  }

  @Test
  fun test_ThrowsWhenIntermediateCANotCA() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_NOT_CA_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_NOT_CA_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_NOT_CA_ROOT)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
      }
    )
    assertEquals("Non-leaf certificate subject must be a Certificate Authority", exception.message)
  }

  @Test
  fun test_ThrowsWhenCAPathLenViolated() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_PATH_LEN_VIOLATION_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_PATH_LEN_VIOLATION_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_PATH_LEN_VIOLATION_ROOT)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
      }
    )
    assertEquals("pathLenConstraint violated by intermediate certificate", exception.message)
  }

  @Test
  fun test_ThrowsWhenExpoProjectInformationViolation() {
    val leafCert = getTestCertificate(TestCertificateType.CHAIN_EXPO_PROJECT_INFORMATION_VIOLATION_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_EXPO_PROJECT_INFORMATION_VIOLATION_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_EXPO_PROJECT_INFORMATION_VIOLATION_ROOT)
    val exception = assertFailsWith(
      exceptionClass = CertificateException::class,
      block = {
        CertificateChain(listOf(leafCert, intermediateCert, rootCert)).codeSigningCertificate
      }
    )
    assertEquals("Expo project information must be a subset of or equal to that of parent certificates", exception.message)
  }
}
