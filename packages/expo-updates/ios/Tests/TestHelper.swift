//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Foundation

enum TestHelperError : Int, Error {
  case invalidTestCertificate
}

/**
 These are generated using scripts from @expo/code-signing-certificates (some with manually addd invalid parameters/signatures/etc).
 Commands used to generate them are below.
 */
enum TestCertificate : String {
  // yarn generate-example-certificates
  case chainIntermediate = "chainIntermediate"
  case chainLeaf = "chainLeaf"
  case chainRoot = "chainRoot"

  // yarn generate-example-certificates and then manually change one character in the PEM towards the end of the data block
  case invalidSignatureChainLeaf = "invalidSignatureChainLeaf"

  // yarn generate-example-self-signed after commenting out extended usage extension
  case noCodeSigningExtendedUsage = "noCodeSigningExtendedUsage"

  // yarn generate-example-self-signed after commenting out key usage extension
  case noKeyUsage = "noKeyUsage"

  // yarn generate-example-self-signed and then manually change one character in the PEM towards the end of the data block
  case signatureInvalid = "signatureInvalid"

  // yarn generate-example-self-signed
  case test = "test"

  // yarn generate-example-self-signed with manually overridden dates
  case validityExpired = "validityExpired"

  // yarn generate-example-certificates after commenting out CA extension
  case chainNotCARoot = "chainNotCARoot"
  case chainNotCAIntermediate = "chainNotCAIntermediate"
  case chainNotCALeaf = "chainNotCALeaf"

  // yarn generate-example-certificates after altering path len to be invalid
  case chainPathLenViolationRoot = "chainPathLenViolationRoot"
  case chainPathLenViolationIntermediate = "chainPathLenViolationIntermediate"
  case chainPathLenViolationLeaf = "chainPathLenViolationLeaf"

  // yarn generate-example-certificates after manually adding different project information to intermediate cert
  case chainExpoProjectInformationViolationRoot = "chainExpoProjectInformationViolationRoot"
  case chainExpoProjectInformationViolationIntermediate = "chainExpoProjectInformationViolationIntermediate"
  case chainExpoProjectInformationViolationLeaf = "chainExpoProjectInformationViolationLeaf"
}

class ForBundle {}

struct TestHelper {
  static func getTestCertificate(_ name: TestCertificate) throws -> String {
    let bundle = Bundle(for: ForBundle.self)
    guard let certPath = bundle.path(forResource: name.rawValue, ofType: "pem") else {
      throw TestHelperError.invalidTestCertificate
    }
    return try String(contentsOfFile: certPath)
  }

  static let testClassicBody = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}"

  static let testBody =
    "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"285dc9ca-a25d-4f60-93be-36dc312266d7\"}}}"

  static let testSignature =
    "sig=\"cpDit5vR18rz2ndUx/SX5GOZtynky8g15GqRKnaBqn2MN2a3jesYURcIoTgl0d+IQcKrNiSHzpg4IriTcNx4kv5Qw4qBiizDHBvyLvZU1O9d94w0iDU1kSAV7OhP4fgWJZJEdmLAlTQ2ilH9WlotQFU2SotC04yNBjR65NLiAbBpysX0+/VpWPuuHmJyS1HviNgq0ZtknH4DzjzDWPRi2LogzPnQKAmbMFlFGpenql9YIpxb4HQPcsdpAPPjESZegK4kiqbzQEx5E5OYAMFGl/pD9DrZhPDpFHu6f0UFngWepWqNsYA0bF9BaEP20ToK//LAlOcoE0lyUPEYfVCMMA==\""

  static let testValidChainLeafSignature =
    "sig=\"XZ5i/hQTXL3zqXIvKiiNfOZMnE7neWjQoDTxiPbgrLqxj8axTGznwsC07pv2hiCYqlCLStebjY+F4uYESgduuhExG3XEajbsPANJn+vl1LWw18BRaqGFWrvgyA4+jquWCTRmJnMQoD0pFyV6uY7L2l8jV8+pJbB0QsoA3xfnIeTElTCTkQM60E3f0hBYrGV2s816HVl7dRz+3xOqUE139/I5xhdytEokkZfkhQcJ3Pgj1NbgvAUnAASSsGmkAkBisy8QEG9J0kzs3Kg8x79g19Ie4HBLXUBfgT0wH/7u9ngy9uDyZ2E43LVaLJpJbztxAi8FCW0XuQtTiedKKJHunw==\""

  static let testNewManifestBodyIncorrectProjectId =
    "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"485dc9ca-a25d-4f60-93be-36dc312266d8\"}}}"

  static let testNewManifestBodyValidChainLeafSignatureIncorrectProjectId =
    "sig=\"K5sqG7xzlpsiVEFi7fbZ9jBbRJ0dpVfgM7l4lzYUSxSxeX5ZqjyDQcMlucgzB3eiWS3xgzAHcr2sf5wyRjzzYF1HeVejuGtCClcZ85RfuXzFIngEli2w8/OhWv5VzOAyC8fJ+NxIUYd981pNWAiC6fX1ON4u9e6UTobSRiB+hDu91vKBMPftX1tToBLE53faV8bu0bmKdCG15I+AYIo0ux2337zaXqkkWSLlfLz2+Tw/v3qO1Ytp2sL1IPCH+Edqemy7wYuUMZGoMY0LzQfxePh3vnPCN8/R/rSvE5D/39qQoNa3McaS22eAuj93CFlhs1Pmj1wm9UTqyiV1XGaj9w==\""
}
