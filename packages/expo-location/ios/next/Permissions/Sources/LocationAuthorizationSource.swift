protocol LocationAuthorizationSource {
  @MainActor
  func request() async throws
}
