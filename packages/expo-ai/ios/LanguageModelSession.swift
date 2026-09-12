import ExpoModulesCore
import Foundation

internal final class LanguageModelSession: SharedObject, @unchecked Sendable {
  private let backend: any LanguageModelBackend
  private let builtinTools: [String: LanguageModelBuiltinTool]
  private let lock = NSLock()
  private var active: LanguageModelRequest?
  private var pendingResult: LanguageModelRequest?
  private var isDisposed = false
  // AsyncFunction dispatch can arrive after the synchronous cancel call.
  private var cancellationsBeforeStart = Set<String>()

  init(backend: any LanguageModelBackend, builtinTools: [String: LanguageModelBuiltinTool] = [:]) {
    self.backend = backend
    self.builtinTools = builtinTools
    super.init()
  }

  func generate(requestId: String, prompt: String, optionsJSON: String, withMetadata: Bool = false) async throws -> String {
    let options = try LanguageModelRequestOptions(json: optionsJSON)
    let request = try start(requestId: requestId, maximumToolCalls: options.maximumToolCalls, images: options.images)
    defer {
      request.finish()
      lock.withLock { if active === request { active = nil } }
    }
    let backend = backend
    let task = Task { try await backend.generate(prompt: prompt, options: options, request: request) }
    request.bind(task)
    return try await withTaskCancellationHandler {
      do {
        let result = try await task.value
        try request.checkActive()
        let response: String
        if withMetadata {
          struct Response: Encodable { let text: String; let usage: LanguageModelUsage }
          // JSONEncoder produces UTF-8.
          // swiftlint:disable:next optional_data_string_conversion
          response = String(decoding: try JSONEncoder().encode(Response(text: result, usage: request.usage)), as: UTF8.self)
        } else {
          response = result
        }
        try lock.withLock {
          guard !isDisposed else { throw LanguageModelException.disposed() }
          try request.prepareResult()
          pendingResult = request
          active = nil
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
    try lock.withLock {
      guard !requestId.isEmpty else { throw LanguageModelException.invalid("requestId must not be empty.") }
      guard !isDisposed else { throw LanguageModelException.disposed() }
      if cancellationsBeforeStart.remove(requestId) != nil { throw LanguageModelException.cancelled() }
      guard active == nil, pendingResult == nil else {
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
      active = request
      return request
    }
  }

  func cancel(requestId: String) {
    let request = lock.withLock { () -> LanguageModelRequest? in
      guard !isDisposed else { return nil }
      if let pendingResult, pendingResult.id == requestId {
        self.pendingResult = nil
        return pendingResult
      }
      if let active, active.id == requestId { return active }
      // IDs are unique in the JS wrapper. Fail closed instead of dropping a
      // cancellation when hostile/direct native callers exhaust bookkeeping.
      if cancellationsBeforeStart.contains(requestId) { return nil }
      if cancellationsBeforeStart.count >= 128 {
        isDisposed = true
        cancellationsBeforeStart.removeAll()
        pendingResult?.cancel(.disposed())
        pendingResult = nil
        return active
      }
      cancellationsBeforeStart.insert(requestId)
      return nil
    }
    if lock.withLock({ isDisposed }) {
      request?.cancel(.disposed())
      backend.dispose()
    } else {
      request?.cancel()
    }
  }

  func acceptResult(requestId: String) -> Bool {
    lock.withLock {
      guard !isDisposed, let pendingResult, pendingResult.id == requestId,
        pendingResult.acceptResult()
      else { return false }
      self.pendingResult = nil
      return true
    }
  }

  func discardResult(requestId: String) {
    lock.withLock {
      if let active, active.id == requestId { active.cancel() }
      if let pendingResult, pendingResult.id == requestId {
        pendingResult.cancel()
        self.pendingResult = nil
      }
    }
  }

  func resolveTool(callId: String, output: String?, error: String?) -> Bool {
    let request = lock.withLock { active }
    return request?.resolve(callId: callId, output: output, error: error) ?? false
  }

  func executeBuiltinTool(callId: String, kind: String, imageLabel: String) async throws -> String {
    guard let kind = LanguageModelBuiltinTool(rawValue: kind), let request = lock.withLock({ active }) else {
      throw LanguageModelException("ERR_TOOL_EXECUTION", "There is no matching active image tool call.")
    }
    return try await LanguageModelImageTools.execute(request: request, callId: callId, kind: kind, imageLabel: imageLabel)
  }

  func dispose() {
    let request = lock.withLock { () -> LanguageModelRequest? in
      isDisposed = true
      cancellationsBeforeStart.removeAll()
      pendingResult?.cancel(.disposed())
      pendingResult = nil
      return active
    }
    request?.cancel(.disposed())
    backend.dispose()
  }

  override func sharedObjectWillRelease() { dispose() }
  deinit { dispose() }
}
