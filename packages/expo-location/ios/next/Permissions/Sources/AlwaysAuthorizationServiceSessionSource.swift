// Copyright 2026-present 650 Industries. All rights reserved.

import CoreLocation

@available(iOS 18.0, *)
final class AlwaysAuthorizationServiceSessionSource: AlwaysAuthorizationSource {
  @MainActor
  func request() async throws {
    let session = CLServiceSession(authorization: .always)
    defer {
      session.invalidate()
    }
    for try await diagnostic in session.diagnostics where !diagnostic.authorizationRequestInProgress {
      return
    }
  }
}
