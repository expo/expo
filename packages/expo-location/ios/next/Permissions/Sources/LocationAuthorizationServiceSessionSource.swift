import CoreLocation

@available(iOS 18.0, *)
final class LocationAuthorizationServiceSessionSource: LocationAuthorizationSource {
  private let authorization: CLServiceSession.AuthorizationRequirement

  init(authorization: CLServiceSession.AuthorizationRequirement) {
    self.authorization = authorization
  }

  @MainActor
  func request() async throws {
    let session = CLServiceSession(authorization: authorization)
    defer {
      session.invalidate()
    }
    try await Self.waitForAuthorization(in: session.diagnostics.map { $0.authorizationRequestInProgress })
  }

  @MainActor
  static func waitForAuthorization<Diagnostics: AsyncSequence>(
    in diagnostics: Diagnostics
  ) async throws where Diagnostics.Element == Bool {
    // The first diagnostic may already be settled when no prompt is needed. Waiting for
    // an in-progress diagnostic or a changed authorization status would hang those requests.
    // Apple's completion example: https://developer.apple.com/videos/play/wwdc2024/10212/?time=900
    for try await authorizationRequestInProgress in diagnostics where !authorizationRequestInProgress {
      return
    }
  }
}
