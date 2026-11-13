import Testing

@testable import ExpoLocation

@Suite("LocationUpdateDiagnostics")
struct LocationUpdateDiagnosticsTests {
  @Test
  func `given serviceSessionRequired then unrecoverableFailure returns nil`() {
    // serviceSessionRequired is sent when an app with whenInUse permission moves to the background.
    // liveUpdates self-heals after the app returns to the foreground, so it is not an unrecoverable failure.
    // We assume the app does not set CLRequireExplicitServiceSession, the other reason for this flag.
    let diagnostics = LocationUpdateDiagnostics(
      authorizationDenied: false,
      authorizationDeniedGlobally: false,
      authorizationRestricted: false,
      serviceSessionRequired: true,
      insufficientlyInUse: false,
      locationUnavailable: false
    )

    #expect(diagnostics.unrecoverableFailure() == nil)
  }
}
