package expo.modules.updates.codesigning

import org.bouncycastle.asn1.ASN1Primitive
import org.bouncycastle.asn1.DEROctetString
import java.security.cert.CertificateException
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import kotlin.math.min

// ASN.1 path to the extended key usage info within a CERT
private const val CODE_SIGNING_OID = "1.3.6.1.5.5.7.3.3"

// OID of expo project info, stored as `<projectId>,<scopeKey>`
private const val EXPO_PROJECT_INFORMATION_OID = "1.2.840.113556.1.8000.2554.43437.254.128.102.157.7894389.20439.2.1"

data class ExpoProjectInformation(val projectId: String, val scopeKey: String)

/**
 * Full certificate chain for verifying code signing.
 * The chain should look like the following:
 *    0: code signing certificate
 *    1...n-1: intermediate certificates
 *    n: root certificate
 *
 * Requirements:
 * - Length(certificateChain) > 0
 * - certificate chain is valid and each certificate is valid
 * - 0th certificate is a valid code signing certificate
 */
class CertificateChain(private val certificateStrings: List<String>) {
  val codeSigningCertificate: X509Certificate by lazy {
    if (certificateStrings.isEmpty()) {
      throw CertificateException("No code signing certificates provided")
    }

    val certificateChain = certificateStrings.map { constructCertificate(it) }
    certificateChain.validateChain()
    val leafCertificate = certificateChain[0]
    if (!leafCertificate.isCodeSigningCertificate()) {
      throw CertificateException("First certificate in chain is not a code signing certificate. Must have X509v3 Key Usage: Digital Signature and X509v3 Extended Key Usage: Code Signing")
    }
    leafCertificate
  }

  companion object {
    private fun constructCertificate(certificateString: String): X509Certificate {
      return (
        CertificateFactory.getInstance("X.509")
          .generateCertificate(certificateString.byteInputStream()) as X509Certificate
        ).apply {
        checkValidity()
      }
    }

    private fun X509Certificate.isCodeSigningCertificate(): Boolean {
      return keyUsage != null && keyUsage.isNotEmpty() && keyUsage[0] && extendedKeyUsage != null && extendedKeyUsage.contains(
        CODE_SIGNING_OID
      )
    }

    fun X509Certificate.expoProjectInformation(): ExpoProjectInformation? {
      return getExtensionValue(EXPO_PROJECT_INFORMATION_OID)?.let {
        ASN1Primitive.fromByteArray(it)
      }?.let {
        if (it is DEROctetString) {
          it.octets.decodeToString()
        } else null
      }?.let {
        val components = it.split(',').map { component -> component.trim() }
        if (components.size != 2) {
          throw CertificateException("Invalid Expo project information extension value")
        }
        ExpoProjectInformation(components[0], components[1])
      }
    }

    private fun X509Certificate.isCACertificate(): Boolean {
      return basicConstraints > -1 && keyUsage != null && keyUsage.isNotEmpty() && keyUsage[5]
    }

    private fun List<X509Certificate>.validateChain() {
      for (i in 0 until size - 1) {
        val cert = get(i)
        val issuer = get(i + 1)
        if (!cert.issuerX500Principal.equals(issuer.subjectX500Principal)) {
          throw CertificateException("Certificates do not chain")
        }
        cert.verify(issuer.publicKey)
      }
      // last cert (root in chain or embedded) must be self-signed
      if (!last().issuerX500Principal.equals(last().subjectX500Principal)) {
        throw CertificateException("Root certificate not self-signed")
      }
      last().verify(last().publicKey)

      // if this is a chain, validate the CA pathLen and expoProjectInformation constraints
      if (size > 1) {
        val rootCert = last()
        if (!rootCert.isCACertificate()) {
          throw CertificateException("Root certificate subject must be a Certificate Authority")
        }

        var lastExpoProjectInformation = rootCert.expoProjectInformation()
        var maxPathLengthConstraint = rootCert.basicConstraints
        // all certificates between root and leaf (non-inclusive)
        for (i in (size - 2) downTo 1) {
          val cert = get(i)

          if (!cert.isCACertificate()) {
            throw CertificateException("Non-leaf certificate subject must be a Certificate Authority")
          }

          val currProjectInformation = cert.expoProjectInformation()
          if (lastExpoProjectInformation != null) {
            if (lastExpoProjectInformation != currProjectInformation) {
              throw CertificateException("Expo project information must be a subset or equal of that of parent certificates")
            }
          }
          lastExpoProjectInformation = currProjectInformation

          if (maxPathLengthConstraint <= 0) {
            throw CertificateException("pathLenConstraint violated by intermediate certificate")
          }
          maxPathLengthConstraint -= 1

          val currPathLengthConstraint = cert.basicConstraints
          maxPathLengthConstraint = min(currPathLengthConstraint, maxPathLengthConstraint)
        }

        if (lastExpoProjectInformation != null) {
          val leafCertificate = first()
          if (lastExpoProjectInformation != leafCertificate.expoProjectInformation()) {
            throw CertificateException("Expo project information must be a subset of or equal to that of parent certificates")
          }
        }
      }
    }
  }
}
