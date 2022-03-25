//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Foundation

enum TestHelperError : Error {
    case invalidTestCertificate
}

enum TestCertificate : String {
  case chainIntermediate = "chainIntermediate"
  case chainLeaf = "chainLeaf"
  case chainRoot = "chainRoot"
  case invalidSignatureChainLeaf = "invalidSignatureChainLeaf"
  case noCodeSigningExtendedUsage = "noCodeSigningExtendedUsage"
  case noKeyUsage = "noKeyUsage"
  case signatureInvalid = "signatureInvalid"
  case test = "test"
  case validityExpired = "validityExpired"
  case chainNotCARoot = "chainNotCARoot"
  case chainNotCAIntermediate = "chainNotCAIntermediate"
  case chainNotCALeaf = "chainNotCALeaf"
  case chainPathLenViolationRoot = "chainPathLenViolationRoot"
  case chainPathLenViolationIntermediate = "chainPathLenViolationIntermediate"
  case chainPathLenViolationLeaf = "chainPathLenViolationLeaf"
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
  "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"}}"
  
  static let testSignature =
    "sig=\"rPpJN0SpXTlKfN9aUnEmz4llO0nQT/B1xqRd3e5E6iVseEp3W55BnAelGM7SRr8A/Tyb5qz/efUzpHL/N1FcQCZn6l1XKsCNLbrafsfePK+hH6gR+5cb+zSGv7F0hFMKxVerS/iZKP25GdLXejEsyq24gCMrDkbobsTxIKKMw/RDIuLfxs5BsLacKZNf5YklBsLXTOFUYKps8auTiWKBvowwTF2koCwXGuXsPZqJKpOZfjqQLXI5xIunpKwJSo0gZUIp/euyWqiqaBfN3BXOaXBtasXuQeCKZQ14G54b1d8ntPqC1jx+ILg0t5awAybD5iqR+9a6eMhWoDXHXDpdfg==\""

  static let testValidChainLeafSignature =
    "sig=\"XI8aMNZiey8RMFbkjzRjK7YNrQf0njsGMFg6vVtW9A235K1GMK8tjyNQXTGaFehC9Ofv6BOxv3qo/9Sfl2Nco91c+iRIrP8697u3tHz1QaQZgN7GBbmmwgAcC0IV+tFvj0YUabtw/NuvSDkauTvFGMzJK+8MaLRzCrzCUxTDVEvJTKoyFJv0CZLKgoyDRikTzyvGjN1Aruq3N3yEXiWZcKNc68Ee6kNlLlTrqqUQXbc5w65fQ/G14qMM6G/Us0HYlG5nUehBFrghzhbsBlV9Gs87IWkpHufjjKaPjm6iZiJKuYbYdq1br/uR4vpGD2Sv3WIWWyrC3PAPIB3m/1RR6w==\""
}
