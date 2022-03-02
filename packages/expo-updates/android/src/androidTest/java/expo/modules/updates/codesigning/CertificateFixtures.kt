package expo.modules.updates.codesigning

import androidx.test.platform.app.InstrumentationRegistry

enum class TestCertificateType(val certName: String) {
  CHAIN_INTERMEDIATE("chainIntermediate"),
  CHAIN_LEAF("chainLeaf"),
  CHAIN_ROOT("chainRoot"),
  INVALID_SIGNATURE_CHAIN_LEAF("invalidSignatureChainLeaf"),
  NOT_CODE_SIGNING_EXTENDED_USAGE("noCodeSigningExtendedUsage"),
  NO_KEY_USAGE("noKeyUsage"),
  SINGATURE_INVALID("signatureInvalid"),
  VALID("test"),
  VALIDITY_EXPIRED("validityExpired"),
  CHAIN_NOT_CA_ROOT("chainNotCARoot"),
  CHAIN_NOT_CA_INTERMEDIATE("chainNotCAIntermediate"),
  CHAIN_NOT_CA_LEAF("chainNotCALeaf"),
  CHAIN_PATH_LEN_VIOLATION_ROOT("chainPathLenViolationRoot"),
  CHAIN_PATH_LEN_VIOLATION_INTERMEDIATE("chainPathLenViolationIntermediate"),
  CHAIN_PATH_LEN_VIOLATION_LEAF("chainPathLenViolationLeaf"),
}

fun getTestCertificate(testCertificateType: TestCertificateType): String {
  return InstrumentationRegistry.getInstrumentation().context.assets.open("${CertificateFixtures::class.java.canonicalName}/${testCertificateType.certName}.pem").readBytes().decodeToString()
}

object CertificateFixtures {
  const val testBody = "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"}}"
  const val testSignature = "sig=\"rPpJN0SpXTlKfN9aUnEmz4llO0nQT/B1xqRd3e5E6iVseEp3W55BnAelGM7SRr8A/Tyb5qz/efUzpHL/N1FcQCZn6l1XKsCNLbrafsfePK+hH6gR+5cb+zSGv7F0hFMKxVerS/iZKP25GdLXejEsyq24gCMrDkbobsTxIKKMw/RDIuLfxs5BsLacKZNf5YklBsLXTOFUYKps8auTiWKBvowwTF2koCwXGuXsPZqJKpOZfjqQLXI5xIunpKwJSo0gZUIp/euyWqiqaBfN3BXOaXBtasXuQeCKZQ14G54b1d8ntPqC1jx+ILg0t5awAybD5iqR+9a6eMhWoDXHXDpdfg==\""

  const val testValidChainLeafSignature = "sig=\"XI8aMNZiey8RMFbkjzRjK7YNrQf0njsGMFg6vVtW9A235K1GMK8tjyNQXTGaFehC9Ofv6BOxv3qo/9Sfl2Nco91c+iRIrP8697u3tHz1QaQZgN7GBbmmwgAcC0IV+tFvj0YUabtw/NuvSDkauTvFGMzJK+8MaLRzCrzCUxTDVEvJTKoyFJv0CZLKgoyDRikTzyvGjN1Aruq3N3yEXiWZcKNc68Ee6kNlLlTrqqUQXbc5w65fQ/G14qMM6G/Us0HYlG5nUehBFrghzhbsBlV9Gs87IWkpHufjjKaPjm6iZiJKuYbYdq1br/uR4vpGD2Sv3WIWWyrC3PAPIB3m/1RR6w==\""
}
