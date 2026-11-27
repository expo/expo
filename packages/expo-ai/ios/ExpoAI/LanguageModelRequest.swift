import ExpoModulesCore
import Foundation

/// All mutable state lives in `State` behind the mutex. Every callback belongs to this
/// request, so a delayed native tool can never attach itself to a later request.
/// `Mutex` is not reentrant, so code that already holds the lock validates the request
/// through the static `checkActive(_:)` core instead of the public `checkActive()`, and
/// never cancels a `Task` while holding it.
internal final class LanguageModelRequest: @unchecked Sendable {
  let id: String
  private let maximumToolCalls: Int
  private let onText: @Sendable (String) -> Void
  private let onTool: @Sendable (String, String, String) -> Void
  private let builtinTools: [String: LanguageModelBuiltinTool]
  private let images: [String: LanguageModelImage]

  private struct PendingTool {
    let continuation: CheckedContinuation<String, Error>
    let builtin: LanguageModelBuiltinTool?
    let imageLabel: String?
    var didStart = false
    var cancelExecution: (@Sendable () -> Void)?
  }

  private struct State {
    var task: Task<String, Error>?
    var terminalError: LanguageModelException?
    var isFinished = false
    var toolCalls = 0
    var pending: [String: PendingTool] = [:]
    var responseUsage = LanguageModelUsage()
    var imageSnapshots: [String: LanguageModelImageContent] = [:]
    var acceptHistory: (@Sendable () -> Void)?
    var resultReady = false
  }
  private let state = Mutex(State())

  init(
    id: String,
    maximumToolCalls: Int,
    builtinTools: [String: LanguageModelBuiltinTool] = [:],
    images: [LanguageModelImage] = [],
    onText: @escaping @Sendable (String) -> Void,
    onTool: @escaping @Sendable (String, String, String) -> Void
  ) {
    self.id = id
    self.maximumToolCalls = maximumToolCalls
    self.builtinTools = builtinTools
    self.images = Dictionary(uniqueKeysWithValues: images.map { ($0.label, $0) })
    self.onText = onText
    self.onTool = onTool
  }

  func bind(_ task: Task<String, Error>) {
    let isStale = state.withLock { state -> Bool in
      if state.terminalError != nil || state.isFinished { return true }
      state.task = task
      return false
    }
    // Cancelled outside the lock for the reason given on `cancel(_:)`.
    if isStale { task.cancel() }
  }

  private static func checkActive(_ state: State) throws {
    if let terminalError = state.terminalError { throw terminalError }
    guard !state.isFinished else { throw LanguageModelException.cancelled() }
    if Task.isCancelled { throw LanguageModelException.cancelled() }
  }

  func checkActive() throws {
    try state.withLock { try Self.checkActive($0) }
  }

  func emitText(_ text: String) throws {
    try state.withLock { state in
      try Self.checkActive(state)
      onText(text)
    }
  }

  func callTool(name: String, argumentsJSON: String) async throws -> String {
    try checkActive()
    let callId = UUID().uuidString
    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        state.withLock { state in
          do {
            try Self.checkActive(state)
            guard state.toolCalls < maximumToolCalls else {
              throw LanguageModelException("ERR_TOOL_CALL_LIMIT", "The request reached its maximum number of tool calls.")
            }
            let arguments = try LanguageModelJSON.decode(argumentsJSON)
            if builtinTools[name] != nil {
              guard let imageLabel = arguments.object?["image"]?.string, images[imageLabel] != nil else {
                throw LanguageModelException("ERR_TOOL_EXECUTION", "The image tool selected an unknown current-request image label.")
              }
            }
            state.toolCalls += 1
            state.pending[callId] = PendingTool(
              continuation: continuation,
              builtin: builtinTools[name],
              imageLabel: arguments.object?["image"]?.string
            )
            onTool(callId, name, argumentsJSON)
          } catch {
            continuation.resume(throwing: error)
          }
        }
      }
    } onCancel: {
      self.reject(callId: callId, error: LanguageModelException.cancelled())
    }
  }

  func resolve(callId: String, output: String?) -> Bool {
    state.withLock { state in
      guard state.terminalError == nil, !state.isFinished,
        let tool = state.pending.removeValue(forKey: callId)
      else { return false }
      tool.cancelExecution?()
      let continuation = tool.continuation
      if let output {
        continuation.resume(returning: output)
      } else {
        continuation.resume(throwing: LanguageModelException.invalid("A tool reply needs output."))
      }
      return true
    }
  }

  private func reject(callId: String, error: Error) {
    state.withLock { state in
      let tool = state.pending.removeValue(forKey: callId)
      tool?.cancelExecution?()
      tool?.continuation.resume(throwing: state.terminalError ?? error)
    }
  }

  /// `Task.cancel()` runs the task's cancellation handler synchronously on the calling
  /// thread, and `callTool`'s handler re-enters this request through `reject`. The mutex is
  /// not reentrant, so the task is cancelled only once the lock is released. By then the
  /// pending calls are already resolved and removed, so `reject` finds nothing and every
  /// continuation is still resumed exactly once.
  func cancel(_ error: LanguageModelException = .cancelled()) {
    let task: Task<String, Error>? = state.withLock { state in
      guard state.terminalError == nil, !state.isFinished || state.resultReady else { return nil }
      state.terminalError = error
      state.acceptHistory = nil
      state.resultReady = false
      state.imageSnapshots.removeAll()
      let callbacks = Array(state.pending.values)
      state.pending.removeAll()
      for callback in callbacks {
        callback.cancelExecution?()
        callback.continuation.resume(throwing: error)
      }
      return state.task
    }
    task?.cancel()
  }

  func finish() {
    state.withLock { state in
      state.isFinished = true
      state.task = nil
      if !state.resultReady { state.acceptHistory = nil }
      state.imageSnapshots.removeAll()
      let callbacks = Array(state.pending.values)
      state.pending.removeAll()
      for callback in callbacks {
        callback.cancelExecution?()
        callback.continuation.resume(throwing: LanguageModelException.cancelled())
      }
    }
  }

  /// Keep the completed native history provisional until JavaScript validates and
  /// accepts this exact result. Dropping the closure also releases staged images.
  func stageHistory(_ accept: @escaping @Sendable () -> Void) throws {
    try state.withLock { state in
      try Self.checkActive(state)
      state.acceptHistory = accept
    }
  }

  func prepareResult() throws {
    try state.withLock { state in
      try Self.checkActive(state)
      state.resultReady = true
    }
  }

  func acceptResult() -> Bool {
    state.withLock { state in
      guard state.resultReady, state.terminalError == nil else { return false }
      state.resultReady = false
      let accept = state.acceptHistory
      state.acceptHistory = nil
      accept?()
      return true
    }
  }

  func imageContent(for image: LanguageModelImage) throws -> LanguageModelImageContent {
    if let content = state.withLock({ $0.imageSnapshots[image.label] }) { return content }
    try checkActive()
    let content: LanguageModelImageContent
    do { content = try LanguageModelImageContent(url: image.url) } catch { throw LanguageModelException.invalid("The image file could not be decoded.") }
    return try state.withLock { state in
      try Self.checkActive(state)
      if let existing = state.imageSnapshots[image.label] { return existing }
      state.imageSnapshots[image.label] = content
      return content
    }
  }

  /// - Parameter cancel: Runs while this request's lock is held, so it must not call back into
  ///   the request or cancel a `Task` that would, as `cancel(_:)` explains.
  func beginBuiltin(
    callId: String,
    kind: LanguageModelBuiltinTool,
    imageLabel: String,
    cancel: @escaping @Sendable () -> Void
  ) throws -> LanguageModelImage {
    try state.withLock { state in
      try Self.checkActive(state)
      guard var tool = state.pending[callId], tool.builtin == kind, tool.imageLabel == imageLabel,
        !tool.didStart, let image = images[imageLabel]
      else {
        throw LanguageModelException("ERR_TOOL_EXECUTION", "The built-in tool has no matching active image call.")
      }
      tool.didStart = true
      tool.cancelExecution = cancel
      state.pending[callId] = tool
      return image
    }
  }

  func checkBuiltin(callId: String) throws {
    try state.withLock { state in
      try Self.checkActive(state)
      guard state.pending[callId]?.didStart == true else { throw LanguageModelException.cancelled() }
    }
  }

  func recordUsage(_ usage: LanguageModelUsage) throws {
    try state.withLock { state in
      try Self.checkActive(state)
      state.responseUsage = usage
    }
  }

  var usage: LanguageModelUsage { state.withLock { $0.responseUsage } }

  var pendingCount: Int { state.withLock { $0.pending.count } }
}
