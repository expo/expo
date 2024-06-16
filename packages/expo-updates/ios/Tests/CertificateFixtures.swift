//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Foundation

/**
 These are generated using https://github.com/expo/code-signing-certificates/blob/main/scripts/generateCertificatesForTests.ts
 */
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
  case chainExpoProjectInformationViolationRoot = "chainExpoProjectInformationViolationRoot"
  case chainExpoProjectInformationViolationIntermediate = "chainExpoProjectInformationViolationIntermediate"
  case chainExpoProjectInformationViolationLeaf = "chainExpoProjectInformationViolationLeaf"
}

class ForBundle {}

internal func getTestCertificate(_ name: TestCertificate) -> String {
  let bundle = Bundle(for: ForBundle.self)
  let certPath = bundle.path(forResource: name.rawValue, ofType: "pem")!
  return try! String(contentsOfFile: certPath)
}

internal class CertificateFixtures {
  public static let testExpoUpdatesManifestBody =
    "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"285dc9ca-a25d-4f60-93be-36dc312266d7\"}}}"

  public static let testExpoUpdatesManifestBodySignature =
    "sig=\"iMU4xouvBS6f8Ttr2pUX+r5dJ51489SQfhHb4rG6uBhy5RxaY10o+DE3zVRyRH2yVnmp5Fe7bCQD+REZa0hvt/sKAp1aIhjH8Uv50hADwAPfbyDoOc3Kld2zOGTf70W5J6AyO5QczBrC+wB727CZU+mUkxT6rZ/uBwJVPHAF0qmNGnbJBhMRhGqSB1u/CO49Y7zQ1T53SQvcU2VDq2XtGnPDPCe4qYVV/0oLv1hDSzKqVs6IQu8OYfQwj3naGo3FBFj8fZFbcf8M3B2AU4Q5VigFpLi07rvPyCtDyD6BauU9yk5+sI9RPmm2XtCm1YFzYeicC9BN/QPCBQvj5b7ZIA==\""

  public static let testExpoUpdatesManifestBodyValidChainLeafSignature =
    "sig=\"g94qm1faIg7u0CFJHb/dsk/+2GOsL9xidAbdVzwJXMkzZKaR/aoXkrUTVty1k8jJYIASLhqEQb3O4eBM0zCtzQPaquloxcLSGIA7dy2Yevnl2/HYu14Lmq6yCDMp9F47jtZdbJY+pDAg0D7SfoVkKpBwfoeP1ZXUxtbEBxxzpAkKNhAKmZ/A6VjStrxbTE6qaTEDCbQtOFiREAL2vD3fq9K02a3/PGYU7w7AS5TiPzQ+xCvXl6KOn15ZOZngZs/gvOHjDZbBJsMSzeXHUWDQ993aNzgtawFIgNJkVoiz9Z89LRdcCvCMFahpfUWQWIVsGp47scHMGX6s2PN0m/4S+A==\""

  public static let testExpoUpdatesManifestBodyIncorrectProjectId =
    "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"485dc9ca-a25d-4f60-93be-36dc312266d8\"}}}"

  public static let testExpoUpdatesManifestBodyValidChainLeafSignatureIncorrectProjectId =
    "sig=\"Pqwt5yNggdCrXB1w+EeEl9ZLITZVdNeR99YRYw6la3P97xU6298eMs5Us3RNthy/DmsC1tEpqr9MZE4xv2b3l8DZTQ45OyH76TRzRKOtB+9t5VC3Zb/osYjkh/pexr7D9AopSbxNCrVLO3Ek/+2iPXhJAkO90oWpD1Axf7ZhfmzgD0t93lpCzNecyIz2/GRRA5us7VYCFJXkAF6MDzExGQmsWr4OvGpqxqYEHhLfrrFrr0aILCHRjiBlT6zhJi8RzpTPzmH3twq5LSVNES9aa5/VOCgrg2ci6rYXFbmLA4weUpzoEL1Hx88ONcchz7LuEg1zz8pJEJ0olzTGKpJFLQ==\""

  public static let testDirectiveNoUpdateAvailable = "{\"type\":\"noUpdateAvailable\",\"extra\":{\"signingInfo\":{\"projectId\":\"285dc9ca-a25d-4f60-93be-36dc312266d7\",\"scopeKey\":\"@test/app\"}}}"
  public static let testDirectiveNoUpdateAvailableSignature = "sig=\"pOGsNA2+mO+A+dBO1g3xfWCSRvgkHUwAHPJyGl7Eds/IIuo/pVIvJNsO5Op5hAGTpRnOW8BFSeIplCQ7axdg/xg0Z6my+Uy529t+H4ReSoXIiyOI6kG6Q/mgKjnXE7HQsF0q7ycZ7qytxp6C7Wxzy3maKvHTQbuIT+gIouCd4SGb8lg2Y6B/L/yjN1LiehaKizQPNOC4AIDO5SKl3Wk5aTdnr6JYld4nSno2kfalwHnQc1NxojXoMIwAM1LBq/1YIGV8shXNgXP03pvIDwiwa548VIdSe+v4BvSKVEZvNC8Uw06j0Y1lOWkGdl+UOWR1oOZvH6PdgYj6h3rzr2gBIg==\""
  public static let testDirectiveNoUpdateAvailableValidChainLeafSignature = "sig=\"fuzNbhZ4msyGc3K8512kXQ5HNGo7+DJh++S6t+sn8PzWTnCdcdheJGMs3Irkv6rcgWE28FBiysdeH2whD25yn2AsL3EzlOkxPyT6TSkYUvcyobtBVAkpsN755XyNWnvGGMEg5UvadKqJvVJA4YpXe9CBYOq1pZoCnfKfHMHk6+pETVtup5WEpwVpeoEDHQduVAgIs3IfO7atJ+fHQH0YOlzqxKvabNyzp6vm3lEjo4y86/fZ9UzfXzMwEAJpslLadOAkiLvbPcRUMU+YRZCOj/aZ2mUZ7lq1PHLmdxCedEfOKpEUwV4sIM0rzccqRs7JanK41Du/9Jaz6grfrZ100Q==\""

  public static let testDirectiveNoUpdateAvailableIncorrectProjectId = "{\"type\":\"noUpdateAvailable\",\"extra\":{\"signingInfo\":{\"projectId\":\"485dc9ca-a25d-4f60-93be-36dc312266d8\",\"scopeKey\":\"@test/app\"}}}"
  public static let testDirectiveNoUpdateAvailableValidChainLeafSignatureIncorrectProjectId = "sig=\"a0k2BPevnRlBWK7w1vODW2s5iK7kt11THgawNWn4gTnwkRr/M3g4tIRsReyiRPF7+Ka5hkt9eq7LRfNuyVwaxXoJT8PrZtrrYCFfZ6ShozDH43rnE39bjkz0ORAfkUrpAoe0feZi28Vod4XCJ5LVElENULXrAxm03vYjDljMWEnW81ODm4Wp5K/9XyUYGwzKfsIMpA1pJ7J5t56I8zNFskyzH8UASlkLYHJtnu9Irpt2DppePCYdKke/dDWyokg4vl5G+k4mysbQ4osoIJNXzD8brwMXSc3dxTc5ZkTX2mGUmsjOa0lcNwCb0zbBbp4tUIJEf29zMxt2MOhfdE0DJQ==\""
}
