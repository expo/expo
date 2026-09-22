protocol AlwaysAuthorizationSource {
  @MainActor
  func request() async throws
}
