import Foundation

#if canImport(FoundationModels)
import FoundationModels
#endif

internal enum LanguageModelAppleFeatures {
  static var images: Bool {
    #if canImport(FoundationModels) && compiler(>=6.4)
    if #available(iOS 27.0, macOS 27.0, *) { return SystemLanguageModel.default.capabilities.contains(.vision) }
    #endif
    return false
  }

  static var imageTools: Bool {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) { return true }
    #endif
    return false
  }

  #if canImport(FoundationModels)
  #if compiler(>=6.4)
  @available(iOS 27.0, macOS 27.0, *)
  static func measuredUsage(_ usage: FoundationModels.LanguageModelSession.Usage) -> LanguageModelUsage {
    LanguageModelUsage(
      inputTokens: usage.input.totalTokenCount,
      outputTokens: usage.output.totalTokenCount,
      cachedInputTokens: usage.input.cachedTokenCount,
      reasoningTokens: usage.output.reasoningTokenCount
    )
  }

  @available(iOS 27.0, macOS 27.0, *)
  static func mapError(_ error: Error) -> LanguageModelException? {
    if let error = error as? FoundationModels.LanguageModelSession.Error {
      switch error {
      case .concurrentRequests, .transcriptMutationWhileResponding:
        return LanguageModelException("ERR_SESSION_BUSY", error.localizedDescription)
      @unknown default: return LanguageModelException("ERR_GENERATION_FAILED", error.localizedDescription)
      }
    }
    if let error = error as? SystemLanguageModel.Error {
      switch error {
      case .assetsUnavailable: return LanguageModelException("ERR_MODEL_NOT_READY", error.localizedDescription)
      @unknown default: return LanguageModelException("ERR_GENERATION_FAILED", error.localizedDescription)
      }
    }
    guard let error = error as? FoundationModels.LanguageModelError else { return nil }
    let code: String
    switch error {
    case .contextSizeExceeded: code = "ERR_CONTEXT_WINDOW_EXCEEDED"
    case .rateLimited: code = "ERR_RATE_LIMITED"
    case .guardrailViolation, .refusal: code = "ERR_MODEL_REFUSAL"
    case .unsupportedCapability, .unsupportedTranscriptContent: code = "ERR_UNSUPPORTED_FEATURE"
    case .unsupportedGenerationGuide: code = "ERR_SCHEMA_UNSUPPORTED"
    case .unsupportedLanguageOrLocale: code = "ERR_UNSUPPORTED_LANGUAGE"
    case .timeout: code = "ERR_TIMEOUT"
    @unknown default: code = "ERR_GENERATION_FAILED"
    }
    return LanguageModelException(code, error.localizedDescription)
  }
  #endif
  #endif
}
