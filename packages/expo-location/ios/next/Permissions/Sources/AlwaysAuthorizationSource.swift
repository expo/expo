// Copyright 2026-present 650 Industries. All rights reserved.

protocol AlwaysAuthorizationSource {
  @MainActor
  func request() async throws
}
