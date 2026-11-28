// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoFileSystem

@Suite("Localized description with code")
struct LocalizedDescriptionWithCodeTests {
  @Test
  func testAppendsDomainAndCode() {
    let error: Error = NSError(
      domain: NSURLErrorDomain,
      code: NSURLErrorTimedOut,
      userInfo: [NSLocalizedDescriptionKey: "Le délai d’attente de la requête a expiré."]
    )
    #expect(error.localizedDescriptionWithCode == "Le délai d’attente de la requête a expiré. [NSURLErrorDomain:-1001]")
  }

  @Test
  func testAppendsUnderlyingDomainAndCode() {
    let error: Error = NSError(
      domain: NSCocoaErrorDomain,
      code: NSFileWriteOutOfSpaceError,
      userInfo: [
        NSLocalizedDescriptionKey: "No space left.",
        NSUnderlyingErrorKey: NSError(domain: NSPOSIXErrorDomain, code: Int(ENOSPC))
      ]
    )
    #expect(error.localizedDescriptionWithCode == "No space left. [NSCocoaErrorDomain:640] [NSPOSIXErrorDomain:28]")
  }

  @Test
  func testBridgesSwiftErrors() {
    let error: Error = URLError(.networkConnectionLost)
    #expect(error.localizedDescriptionWithCode.hasSuffix(" [NSURLErrorDomain:-1005]"))
  }
}
