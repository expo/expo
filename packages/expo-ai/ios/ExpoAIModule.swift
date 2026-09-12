import ExpoModulesCore
import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

public final class ExpoAIModule: Module, @unchecked Sendable {
  private let sessionsLock = NSLock()
  private var sessions: [WeakSession] = []
  private var isDestroyed = false
  private var injectedBackend: (any LanguageModelBackend)?

  /// Internal-only seam for exercising the real Expo bridge without model assets.
  internal convenience init(appContext: AppContext, backend: any LanguageModelBackend) {
    self.init(appContext: appContext)
    sessionsLock.withLock { injectedBackend = backend }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoAI")

    AsyncFunction("getAvailabilityAsync") { (inputLanguages: [String], outputLanguage: String?) -> String in
      try Self.availability(inputLanguages: inputLanguages, outputLanguage: outputLanguage)
    }

    AsyncFunction("createSessionAsync") { (optionsJSON: String) -> LanguageModelSession in
      let options = try LanguageModelSessionOptions(json: optionsJSON)
      let builtinTools = Dictionary(uniqueKeysWithValues: options.tools.compactMap { tool in
        tool.builtin.map { (tool.name, $0) }
      })
      if let backend = self.sessionsLock.withLock({ self.injectedBackend }) {
        let session = LanguageModelSession(backend: backend, builtinTools: builtinTools)
        try self.register(session)
        return session
      }
      #if canImport(FoundationModels)
      if #available(iOS 26.0, macOS 26.0, *) {
        switch SystemLanguageModel.default.availability {
        case .available:
          break
        case .unavailable(.modelNotReady):
          throw LanguageModelException("ERR_MODEL_NOT_READY", "The Apple system language model is not ready.")
        case .unavailable:
          throw LanguageModelException("ERR_MODEL_UNAVAILABLE", "The Apple system language model is not available.")
        }
        let session = try LanguageModelSession(backend: FoundationModelsBackend(options: options), builtinTools: builtinTools)
        try self.register(session)
        return session
      }
      #endif
      throw LanguageModelException("ERR_UNSUPPORTED_OS", "Apple Foundation Models requires iOS 26 or macOS 26 and a compatible SDK.")
    }

    Class("LanguageModelSession", LanguageModelSession.self) {
      AsyncFunction("generateAsync") {
        (session: LanguageModelSession, requestId: String, prompt: String, optionsJSON: String) -> String in
        try await session.generate(requestId: requestId, prompt: prompt, optionsJSON: optionsJSON)
      }

      AsyncFunction("executeBuiltinToolAsync") { (session: LanguageModelSession, callId: String, kind: String, imageLabel: String) -> String in
        try await session.executeBuiltinTool(callId: callId, kind: kind, imageLabel: imageLabel)
      }

      Function("cancel") { (session: LanguageModelSession, requestId: String) in
        session.cancel(requestId: requestId)
      }

      Function("acceptResult") { (session: LanguageModelSession, requestId: String) -> Bool in
        session.acceptResult(requestId: requestId)
      }

      Function("discardResult") { (session: LanguageModelSession, requestId: String) in
        session.discardResult(requestId: requestId)
      }

      Function("dispose") { (session: LanguageModelSession) in session.dispose() }

      Function("resolveTool") {
        (session: LanguageModelSession, callId: String, output: String?, error: String?) -> Bool in
        session.resolveTool(callId: callId, output: output, error: error)
      }
    }

    OnAppContextDestroys { self.disposeSessions() }
    OnDestroy { self.disposeSessions() }
  }

  private func register(_ session: LanguageModelSession) throws {
    try sessionsLock.withLock {
      guard !isDestroyed else {
        session.dispose()
        throw LanguageModelException.disposed()
      }
      sessions.removeAll { $0.value == nil }
      sessions.append(WeakSession(session))
    }
  }

  private func disposeSessions() {
    let current = sessionsLock.withLock {
      isDestroyed = true
      let current = sessions.compactMap(\.value)
      sessions.removeAll()
      return current
    }
    current.forEach { $0.dispose() }
  }

  private struct Availability: Encodable {
    let status: String
    let reason: String?
    let capabilities: Capabilities
  }

  internal struct Capabilities: Encodable {
    let provider = "apple-foundation-models"
    let model: String? = nil
    let execution = "on-device"
    let constrainedOutput = "supported"
    let runtimeToolDeclarations = "supported"
    let images = LanguageModelAppleFeatures.images ? "supported" : "unsupported"
    let imageTools = LanguageModelAppleFeatures.imageTools ? "supported" : "unsupported"
    let contextTokens: Int?

    func encode(to encoder: Encoder) throws {
      var container = encoder.container(keyedBy: CodingKeys.self)
      try container.encode(provider, forKey: .provider)
      try container.encode(model, forKey: .model)
      try container.encode(execution, forKey: .execution)
      try container.encode(constrainedOutput, forKey: .constrainedOutput)
      try container.encode(runtimeToolDeclarations, forKey: .runtimeToolDeclarations)
      try container.encode(images, forKey: .images)
      try container.encode(imageTools, forKey: .imageTools)
      try container.encode(contextTokens, forKey: .contextTokens)
    }

    private enum CodingKeys: String, CodingKey {
      case provider, model, execution, constrainedOutput, runtimeToolDeclarations, images, imageTools, contextTokens
    }
  }

  private static func availability(inputLanguages: [String], outputLanguage: String?) throws -> String {
    let result: Availability
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      let model = SystemLanguageModel.default
      switch model.availability {
      case .available:
        let languages = inputLanguages + (outputLanguage.map { [$0] } ?? [])
        if languages.contains(where: { !model.supportsLocale(Locale(identifier: $0)) }) {
          result = Availability(status: "unavailable", reason: "unsupported-language", capabilities: Capabilities(contextTokens: nil))
        } else {
          result = Availability(status: "available", reason: nil, capabilities: Capabilities(contextTokens: model.contextSize > 0 ? model.contextSize : nil))
        }
      case .unavailable(.deviceNotEligible):
        result = Availability(status: "unavailable", reason: "unsupported-device", capabilities: Capabilities(contextTokens: nil))
      case .unavailable(.appleIntelligenceNotEnabled):
        result = Availability(status: "unavailable", reason: "intelligence-disabled", capabilities: Capabilities(contextTokens: nil))
      case .unavailable(.modelNotReady):
        result = Availability(status: "not-ready", reason: nil, capabilities: Capabilities(contextTokens: nil))
      case .unavailable:
        result = Availability(status: "unavailable", reason: "unknown", capabilities: Capabilities(contextTokens: nil))
      }
    } else {
      result = Availability(status: "unavailable", reason: "unsupported-os", capabilities: Capabilities(contextTokens: nil))
    }
    #else
    result = Availability(status: "unavailable", reason: "unsupported-os", capabilities: Capabilities(contextTokens: nil))
    #endif
    return String(decoding: try JSONEncoder().encode(result), as: UTF8.self)
  }

  private final class WeakSession {
    weak var value: LanguageModelSession?
    init(_ value: LanguageModelSession) { self.value = value }
  }
}
