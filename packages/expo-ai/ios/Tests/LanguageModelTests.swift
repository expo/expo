import Testing

@Suite("Language models native integration", .serialized)
struct LanguageModelTests {
  @Test @MainActor
  func javaScriptRoundTrip() async throws { try await LanguageModelNativeChecks.bridge() }

  @Test
  func cancellationAndDisposal() async throws { try await LanguageModelNativeChecks.lifecycle() }

  @Test
  func provisionalNativeHistory() async throws { try await LanguageModelNativeChecks.resultAcceptance() }

  @Test
  func discardPreventsLateHistory() async throws { try await LanguageModelNativeChecks.discardWhileActive() }

  @Test @MainActor
  func resultAcceptanceRoundTrip() async throws { try await LanguageModelNativeChecks.resultAcceptanceBridge() }

  @Test @MainActor
  func moduleTeardown() async throws { try await LanguageModelNativeChecks.moduleTeardown() }

  @Test @MainActor
  func pausedScheduler() async throws { try await LanguageModelNativeChecks.pausedScheduler() }

  @Test @MainActor
  func cancellationWhileSchedulerPaused() async throws { try await LanguageModelNativeChecks.cancellationWhileSchedulerPaused() }

  @Test @MainActor
  func disposalWhileSchedulerPaused() async throws { try await LanguageModelNativeChecks.cancellationWhileSchedulerPaused(dispose: true) }

  @Test @MainActor
  func idleSessionAfterModuleTeardown() async throws { try await LanguageModelNativeChecks.idleSessionAfterModuleTeardown() }

  @Test
  func runtimeSchemas() throws { try LanguageModelNativeChecks.schemas() }
}
