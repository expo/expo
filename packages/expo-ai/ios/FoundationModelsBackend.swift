import Foundation

internal protocol LanguageModelBackend: Sendable {
  func generate(
    prompt: String,
    options: LanguageModelRequestOptions,
    request: LanguageModelRequest
  ) async throws -> String
  func dispose()
}

extension LanguageModelBackend {
  func dispose() {}
}

#if canImport(FoundationModels)
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
internal actor FoundationModelsBackend: LanguageModelBackend {
  private let instructions: String?
  private let tools: [NativeToolDefinition]
  private let hasImageTools: Bool
  private let history = TranscriptHistory()

  init(options: LanguageModelSessionOptions) throws {
    instructions = options.instructions
    hasImageTools = options.tools.contains { $0.builtin != nil }
    tools = try options.tools.enumerated().map { index, definition in
      NativeToolDefinition(
        name: definition.name,
        description: definition.description,
        schema: try LanguageModelSchema.compile(definition.schema, name: "Tool\(index)")
      )
    }
  }

  nonisolated func dispose() { history.clear() }

  func generate(
    prompt: String,
    options: LanguageModelRequestOptions,
    request: LanguageModelRequest
  ) async throws -> String {
    try request.checkActive()
    let schema = try options.schema.map { try LanguageModelSchema.compile($0, name: "Response") }
    let nativeTools: [any Tool] = tools.map { RuntimeTool(definition: $0, request: request) }
    let session: FoundationModels.LanguageModelSession
    if let transcript = history.snapshot {
      session = FoundationModels.LanguageModelSession(model: SystemLanguageModel.default, tools: nativeTools, transcript: transcript)
    } else {
      session = FoundationModels.LanguageModelSession(model: SystemLanguageModel.default, tools: nativeTools, instructions: instructions)
    }
    let nativePrompt = try makePrompt(prompt, images: options.images, request: request)
    let generationOptions = GenerationOptions(maximumResponseTokens: options.maximumOutputTokens)
    do {
      let result: String
      var usage = LanguageModelUsage()
      if options.stream {
        if let schema {
          var final: GeneratedContent?
          for try await snapshot in session.streamResponse(to: nativePrompt, schema: schema, options: generationOptions) {
            try request.emitText(snapshot.rawContent.jsonString)
            final = snapshot.rawContent
            #if compiler(>=6.4)
            if #available(iOS 27.0, macOS 27.0, *) { usage = LanguageModelAppleFeatures.measuredUsage(snapshot.usage) }
            #endif
          }
          guard let final, final.isComplete else {
            throw LanguageModelException("ERR_RESPONSE_INVALID", "The structured response did not complete.")
          }
          result = final.jsonString
        } else {
          var text = ""
          for try await snapshot in session.streamResponse(to: nativePrompt, options: generationOptions) {
            text = snapshot.content
            try request.emitText(text)
            #if compiler(>=6.4)
            if #available(iOS 27.0, macOS 27.0, *) { usage = LanguageModelAppleFeatures.measuredUsage(snapshot.usage) }
            #endif
          }
          result = text
        }
      } else if let schema {
        let response = try await session.respond(to: nativePrompt, schema: schema, options: generationOptions)
        result = response.content.jsonString
        #if compiler(>=6.4)
        if #available(iOS 27.0, macOS 27.0, *) { usage = LanguageModelAppleFeatures.measuredUsage(response.usage) }
        #endif
      } else {
        let response = try await session.respond(to: nativePrompt, options: generationOptions)
        result = response.content
        #if compiler(>=6.4)
        if #available(iOS 27.0, macOS 27.0, *) { usage = LanguageModelAppleFeatures.measuredUsage(response.usage) }
        #endif
      }
      try request.checkActive()
      // Context accounting is optional metadata. An unavailable token counter
      // must not turn a successful response into an inference failure.
      #if compiler(>=6.3)
      if #available(iOS 26.4, macOS 26.4, *) {
        usage.contextTokens = try? await SystemLanguageModel.default.tokenCount(for: session.transcript)
      }
      #endif
      try request.recordUsage(usage)
      let completedTranscript = session.transcript
      try request.stageHistory { [history] in history.accept(completedTranscript) }
      return result
    } catch {
      // Prefer the cancellation/disposal reason over provider cancellation wrappers.
      try request.checkActive()
      throw mapError(error)
    }
  }

  private func makePrompt(_ prompt: String, images: [LanguageModelImage], request: LanguageModelRequest) throws -> Prompt {
    guard !images.isEmpty else { return Prompt(prompt) }
    // JSONEncoder produces UTF-8.
    // swiftlint:disable:next optional_data_string_conversion
    let labels = String(decoding: try JSONEncoder().encode(images.map(\.label)), as: UTF8.self)
    let imageInstructions = "Current image labels for image tools: \(labels). Use these exact labels for the image argument."
    #if compiler(>=6.4)
    if #available(iOS 27.0, macOS 27.0, *), LanguageModelAppleFeatures.images {
      let attachments = try images.map { image in
        let content = try request.imageContent(for: image)
        // Internal attachment labels cannot collide with images retained in history.
        return Attachment(content.image, orientation: content.orientation).label("\(request.id):\(image.label)")
      }
      return Prompt {
        prompt
        imageInstructions
        attachments
      }
    }
    #endif
    guard hasImageTools else {
      throw LanguageModelException(
        "ERR_UNSUPPORTED_FEATURE",
        "Image understanding requires iOS 27 or macOS 27. On iOS 26, images require an OCR or barcode tool."
      )
    }
    return Prompt {
      prompt
      imageInstructions
      "Images are available only to the supplied image tools; the language model cannot see their pixels."
    }
  }

  private func mapError(_ error: Error) -> Error {
    if let error = error as? LanguageModelException { return error }
    if let error = error as? FoundationModels.LanguageModelSession.ToolCallError {
      return mapError(error.underlyingError)
    }
    #if compiler(>=6.4)
    if #available(iOS 27.0, macOS 27.0, *), let mapped = LanguageModelAppleFeatures.mapError(error) {
      return mapped
    }
    #endif
    if error is CancellationError { return LanguageModelException.cancelled() }
    if let error = error as? FoundationModels.LanguageModelSession.GenerationError {
      let code: String
      switch error {
      case .exceededContextWindowSize: code = "ERR_CONTEXT_WINDOW_EXCEEDED"
      case .assetsUnavailable: code = "ERR_MODEL_NOT_READY"
      case .concurrentRequests: code = "ERR_SESSION_BUSY"
      case .unsupportedGuide: code = "ERR_SCHEMA_UNSUPPORTED"
      case .unsupportedLanguageOrLocale: code = "ERR_UNSUPPORTED_LANGUAGE"
      case .rateLimited: code = "ERR_RATE_LIMITED"
      case .guardrailViolation, .refusal: code = "ERR_MODEL_REFUSAL"
      case .decodingFailure: code = "ERR_RESPONSE_INVALID"
      @unknown default: code = "ERR_GENERATION_FAILED"
      }
      return LanguageModelException(code, error.localizedDescription)
    }
    return LanguageModelException("ERR_GENERATION_FAILED", error.localizedDescription)
  }

  private struct NativeToolDefinition: Sendable {
    let name: String
    let description: String
    let schema: GenerationSchema
  }

  /// Acceptance is synchronous on the JavaScript thread. Keep the complete native
  /// transcript behind a lock so it can be accepted without an actor suspension.
  private final class TranscriptHistory: @unchecked Sendable {
    private let lock = NSLock()
    private var transcript: Transcript?

    var snapshot: Transcript? { lock.withLock { transcript } }

    func accept(_ transcript: Transcript) {
      lock.withLock { self.transcript = transcript }
    }

    func clear() { lock.withLock { transcript = nil } }
  }

  private struct RuntimeTool: Tool {
    typealias Arguments = GeneratedContent
    typealias Output = String

    let definition: NativeToolDefinition
    let request: LanguageModelRequest
    var name: String { definition.name }
    var description: String { definition.description }
    var parameters: GenerationSchema { definition.schema }

    func call(arguments: GeneratedContent) async throws -> String {
      guard arguments.isComplete else {
        throw LanguageModelException("ERR_RESPONSE_INVALID", "Incomplete tool arguments cannot execute.")
      }
      return try await request.callTool(name: name, argumentsJSON: arguments.jsonString)
    }
  }
}
#endif
