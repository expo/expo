import ExpoModulesCore
import Foundation

internal final class LanguageModelSession: SharedObject, @unchecked Sendable {
  private let backend: any LanguageModelBackend
  private let builtinTools: [String: LanguageModelBuiltinTool]
  private struct State {
    var active: LanguageModelRequest?
    var pendingResult: LanguageModelRequest?
    var isDisposed = false
    // AsyncFunction dispatch can arrive after the synchronous cancel call.
    var cancellationsBeforeStart = Set<String>()
  }
  private let state = Mutex(State())

  init(backend: any LanguageModelBackend, builtinTools: [String: LanguageModelBuiltinTool] = [:]) {
    self.backend = backend
    self.builtinTools = builtinTools
    super.init()
  }

  func generate(requestId: String, prompt: String, optionsJSON: String) async throws -> String {
    let options = try LanguageModelRequestOptions(json: optionsJSON)
    let request = try start(requestId: requestId, maximumToolCalls: options.maximumToolCalls, images: options.images)
    defer {
      request.finish()
      state.withLock { if $0.active === request { $0.active = nil } }
    }
    let backend = backend
    let task = Task { try await backend.generate(prompt: prompt, options: options, request: request) }
    request.bind(task)
    return try await withTaskCancellationHandler {
      do {
        let result = try await task.value
        try request.checkActive()
        struct Response: Encodable { let text: String; let usage: LanguageModelUsage }
        // JSONEncoder produces UTF-8.
        // swiftlint:disable:next optional_data_string_conversion
        let response = String(decoding: try JSONEncoder().encode(Response(text: result, usage: request.usage)), as: UTF8.self)
        try state.withLock { state in
          guard !state.isDisposed else { throw LanguageModelException.disposed() }
          try request.prepareResult()
          state.pendingResult = request
          state.active = nil
        }
        return response
      } catch {
        try request.checkActive()
        throw error
      }
    } onCancel: {
      self.discardResult(requestId: requestId)
    }
  }

  private func start(requestId: String, maximumToolCalls: Int, images: [LanguageModelImage]) throws -> LanguageModelRequest {
    try state.withLock { state in
      guard !requestId.isEmpty else { throw LanguageModelException.invalid("requestId must not be empty.") }
      guard !state.isDisposed else { throw LanguageModelException.disposed() }
      if state.cancellationsBeforeStart.remove(requestId) != nil { throw LanguageModelException.cancelled() }
      guard state.active == nil, state.pendingResult == nil else {
        throw LanguageModelException("ERR_SESSION_BUSY", "Only one generation may run in a session.")
      }
      let request = LanguageModelRequest(
        id: requestId,
        maximumToolCalls: maximumToolCalls,
        builtinTools: builtinTools,
        images: images,
        onText: { [weak self] text in
          self?.emit(event: "onText", payload: ["requestId": requestId, "text": text])
        },
        onTool: { [weak self] callId, name, argumentsJSON in
          self?.emit(event: "onToolCall", payload: [
            "requestId": requestId, "callId": callId, "name": name, "argumentsJSON": argumentsJSON
          ])
        })
      state.active = request
      return request
    }
  }

  func cancel(requestId: String) {
    let request = state.withLock { state -> LanguageModelRequest? in
      guard !state.isDisposed else { return nil }
      if let pendingResult = state.pendingResult, pendingResult.id == requestId {
        state.pendingResult = nil
        return pendingResult
      }
      if let active = state.active, active.id == requestId { return active }
      // IDs are unique in the JS wrapper. Fail closed instead of dropping a
      // cancellation when hostile/direct native callers exhaust bookkeeping.
      if state.cancellationsBeforeStart.contains(requestId) { return nil }
      if state.cancellationsBeforeStart.count >= 128 {
        state.isDisposed = true
        state.cancellationsBeforeStart.removeAll()
        state.pendingResult?.cancel(.disposed())
        state.pendingResult = nil
        return state.active
      }
      state.cancellationsBeforeStart.insert(requestId)
      return nil
    }
    if state.withLock({ $0.isDisposed }) {
      request?.cancel(.disposed())
      backend.dispose()
    } else {
      request?.cancel()
    }
  }

  func acceptResult(requestId: String) -> Bool {
    state.withLock { state in
      guard !state.isDisposed, let pendingResult = state.pendingResult, pendingResult.id == requestId,
        pendingResult.acceptResult()
      else { return false }
      state.pendingResult = nil
      return true
    }
  }

  func discardResult(requestId: String) {
    state.withLock { state in
      if let active = state.active, active.id == requestId { active.cancel() }
      if let pendingResult = state.pendingResult, pendingResult.id == requestId {
        pendingResult.cancel()
        state.pendingResult = nil
      }
    }
  }

  func resolveTool(callId: String, output: String?) -> Bool {
    let request = state.withLock { $0.active }
    return request?.resolve(callId: callId, output: output) ?? false
  }

  func executeBuiltinTool(callId: String, kind: String, imageLabel: String) async throws -> String {
    guard let kind = LanguageModelBuiltinTool(rawValue: kind), let request = state.withLock({ $0.active }) else {
      throw LanguageModelException("ERR_TOOL_EXECUTION", "There is no matching active image tool call.")
    }
    return try await LanguageModelImageTools.execute(request: request, callId: callId, kind: kind, imageLabel: imageLabel)
  }

  func dispose() {
    let request = state.withLock { state -> LanguageModelRequest? in
      state.isDisposed = true
      state.cancellationsBeforeStart.removeAll()
      state.pendingResult?.cancel(.disposed())
      state.pendingResult = nil
      return state.active
    }
    request?.cancel(.disposed())
    backend.dispose()
  }

  override func sharedObjectWillRelease() { dispose() }
  deinit { dispose() }
}
